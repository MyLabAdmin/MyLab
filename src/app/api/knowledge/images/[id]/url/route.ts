import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import {
  createSignedKnowledgeImageUrl,
  getImageKitFileDetails,
  isKnowledgeImagePath,
} from '@/lib/knowledge/imagekit'

const SIGNED_URL_EXPIRY_SECONDS = 5 * 60

type RouteContext = {
  params: Promise<{ id: string }>
}

async function hasCapability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  capabilityKey: string,
) {
  const { data, error } = await supabase.rpc('current_user_has_capability', {
    p_capability_key: capabilityKey,
  })

  if (error) {
    return false
  }

  return data === true
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const [canManage, canReview] = await Promise.all([
    hasCapability(supabase, 'knowledge.manage'),
    hasCapability(supabase, 'knowledge.review'),
  ])

  const { data: image, error: imageError } = await supabase
    .from('knowledge_version_images')
    .select(`
      id,
      imagekit_file_id,
      knowledge_item_version_id,
      knowledge_item_versions!inner (
        id,
        knowledge_item_id,
        status,
        review_status,
        knowledge_items!inner (
          id,
          status
        )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (imageError || !image) {
    return NextResponse.json(
      { error: 'Knowledge image not found' },
      { status: 404 },
    )
  }

  const version = Array.isArray(image.knowledge_item_versions)
    ? image.knowledge_item_versions[0]
    : image.knowledge_item_versions

  const item = Array.isArray(version.knowledge_items)
    ? version.knowledge_items[0]
    : version.knowledge_items

  if (!version || !item) {
    return NextResponse.json(
      { error: 'Knowledge image ownership could not be verified' },
      { status: 409 },
    )
  }

  const isStaffPreview =
    canManage || canReview

  const isPublished =
    version.status === 'published' &&
    version.review_status === 'approved' &&
    item.status === 'published'

  let hasContentAccess = false

  if (isPublished) {
    const { data: policy } = await supabase
      .from('knowledge_access_policies')
      .select('access_tier, active')
      .eq('knowledge_item_id', version.knowledge_item_id)
      .eq('active', true)
      .maybeSingle()

    if (policy?.access_tier === 'free') {
      hasContentAccess = true
    }

    if (policy?.access_tier === 'premium') {
      const now = new Date().toISOString()

      const { data: entitlement } = await supabase
        .from('knowledge_entitlements')
        .select('id')
        .eq('user_id', user.id)
        .eq('knowledge_item_id', version.knowledge_item_id)
        .eq('status', 'active')
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .limit(1)
        .maybeSingle()

      hasContentAccess = Boolean(entitlement)
    }
  }

  if (!isStaffPreview && !hasContentAccess) {
    return NextResponse.json(
      { error: 'Knowledge image access denied' },
      { status: 403 },
    )
  }

  let details

  try {
    details = await getImageKitFileDetails(image.imagekit_file_id)
  } catch {
    return NextResponse.json(
      { error: 'Knowledge image could not be verified with ImageKit' },
      { status: 502 },
    )
  }

  if (
    details.fileId !== image.imagekit_file_id ||
    details.isPrivateFile !== true ||
    !isKnowledgeImagePath(
      details.filePath,
      image.knowledge_item_version_id,
    ) ||
    details.fileType !== 'image'
  ) {
    return NextResponse.json(
      { error: 'Knowledge image failed security validation' },
      { status: 409 },
    )
  }

  try {
    const url = createSignedKnowledgeImageUrl(
      details.filePath!,
      SIGNED_URL_EXPIRY_SECONDS,
    )

    return NextResponse.json({
      url,
      expiresAt:
        Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS,
    })
  } catch {
    return NextResponse.json(
      { error: 'Knowledge image signing is unavailable' },
      { status: 503 },
    )
  }
}
