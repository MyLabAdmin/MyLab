import { getUploadAuthParams } from '@imagekit/next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildKnowledgeImageFolder } from '@/lib/knowledge/imagekit'

const AUTH_EXPIRY_SECONDS = 15 * 60

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const { data: canManage, error: capabilityError } = await supabase.rpc(
    'current_user_has_capability',
    {
      p_capability_key: 'knowledge.manage',
    },
  )

  if (capabilityError) {
    return NextResponse.json(
      { error: 'Authorization check failed' },
      { status: 500 },
    )
  }

  if (!canManage) {
    return NextResponse.json(
      { error: 'Knowledge management permission required' },
      { status: 403 },
    )
  }

  const versionId = new URL(request.url).searchParams.get('versionId')

  if (!versionId) {
    return NextResponse.json(
      { error: 'versionId is required' },
      { status: 400 },
    )
  }

  const { data: version, error: versionError } = await supabase
    .from('knowledge_item_versions')
    .select('id, status, review_status')
    .eq('id', versionId)
    .maybeSingle()

  if (versionError) {
    return NextResponse.json(
      { error: 'Knowledge version lookup failed' },
      { status: 500 },
    )
  }

  if (!version) {
    return NextResponse.json(
      { error: 'Knowledge version not found' },
      { status: 404 },
    )
  }

  const editable =
    version.status === 'draft' &&
    (version.review_status === 'draft' ||
      version.review_status === 'rejected')

  if (!editable) {
    return NextResponse.json(
      { error: 'Knowledge version is not editable' },
      { status: 409 },
    )
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY

  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: 'ImageKit is not configured' },
      { status: 503 },
    )
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey,
    publicKey,
    expire: Math.floor(Date.now() / 1000) + AUTH_EXPIRY_SECONDS,
  })

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    folder: buildKnowledgeImageFolder(versionId),
  })
}
