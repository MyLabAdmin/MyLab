import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  deleteImageKitFile,
  getImageKitFileDetails,
  isKnowledgeImageMimeType,
  isKnowledgeImagePath,
  KNOWLEDGE_IMAGE_MAX_SIZE_BYTES,
} from '@/lib/knowledge/imagekit'

const ALLOWED_PURPOSES = [
  'content',
  'tube',
  'specimen',
  'additional',
] as const

type ImagePurpose = (typeof ALLOWED_PURPOSES)[number]

function isPurpose(value: unknown): value is ImagePurpose {
  return (
    typeof value === 'string' &&
    ALLOWED_PURPOSES.includes(value as ImagePurpose)
  )
}

function isEditableVersion(version: {
  status: string
  review_status: string
}) {
  return (
    version.status === 'draft' &&
    (version.review_status === 'draft' ||
      version.review_status === 'rejected')
  )
}

async function cleanupOwnedPrivateFile(
  fileId: string,
  versionId: string,
  details: {
    fileId?: string
    filePath?: string
    isPrivateFile?: boolean
  },
) {
  if (
    details.fileId === fileId &&
    details.isPrivateFile === true &&
    isKnowledgeImagePath(details.filePath, versionId)
  ) {
    try {
      await deleteImageKitFile(fileId)
    } catch {
      // Cleanup is best-effort. The private file remains isolated
      // in its version-scoped folder and can be cleaned up later.
    }
  }
}

export async function POST(request: Request) {
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

  const { data: canManage, error: capabilityError } =
    await supabase.rpc('current_user_has_capability', {
      p_capability_key: 'knowledge.manage',
    })

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

  let body: {
    versionId?: unknown
    fileId?: unknown
    altText?: unknown
    caption?: unknown
    sortOrder?: unknown
    purpose?: unknown
    testSpecimenId?: unknown
  }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const versionId =
    typeof body.versionId === 'string'
      ? body.versionId
      : null

  const fileId =
    typeof body.fileId === 'string'
      ? body.fileId
      : null

  const altText =
    body.altText === null || body.altText === undefined
      ? null
      : typeof body.altText === 'string'
        ? body.altText.trim()
        : null

  const caption =
    body.caption === null || body.caption === undefined
      ? null
      : typeof body.caption === 'string'
        ? body.caption.trim()
        : null

  const sortOrder =
    typeof body.sortOrder === 'number' &&
    Number.isInteger(body.sortOrder) &&
    body.sortOrder >= 0
      ? body.sortOrder
      : 0

  const purpose = body.purpose ?? 'additional'

  const testSpecimenId =
    body.testSpecimenId === null ||
    body.testSpecimenId === undefined
      ? null
      : typeof body.testSpecimenId === 'string'
        ? body.testSpecimenId
        : null

  if (!versionId || !fileId) {
    return NextResponse.json(
      {
        error: 'versionId and fileId are required',
      },
      { status: 400 },
    )
  }

  if (!isPurpose(purpose)) {
    return NextResponse.json(
      { error: 'Invalid image purpose' },
      { status: 400 },
    )
  }

  if (altText === '') {
    return NextResponse.json(
      { error: 'altText cannot be blank' },
      { status: 400 },
    )
  }

  if (caption === '') {
    return NextResponse.json(
      { error: 'caption cannot be blank' },
      { status: 400 },
    )
  }

  const { data: version, error: versionError } =
    await supabase
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

  if (!isEditableVersion(version)) {
    return NextResponse.json(
      { error: 'Knowledge version is not editable' },
      { status: 409 },
    )
  }

  const { data: existing, error: existingError } =
    await supabase
      .from('knowledge_version_images')
      .select('*')
      .eq('knowledge_item_version_id', versionId)
      .eq('imagekit_file_id', fileId)
      .maybeSingle()

  if (existingError) {
    return NextResponse.json(
      { error: 'Existing image lookup failed' },
      { status: 500 },
    )
  }

  if (existing) {
    return NextResponse.json(
      { image: existing },
      { status: 200 },
    )
  }

  let details

  try {
    details = await getImageKitFileDetails(fileId)
  } catch {
    return NextResponse.json(
      { error: 'Uploaded ImageKit file could not be verified' },
      { status: 502 },
    )
  }

  const ownedPrivateFile =
    details.fileId === fileId &&
    details.isPrivateFile === true &&
    isKnowledgeImagePath(details.filePath, versionId)

  if (
    !ownedPrivateFile ||
    details.fileType !== 'image' ||
    !details.url ||
    !isKnowledgeImageMimeType(details.mime) ||
    typeof details.size !== 'number' ||
    details.size <= 0 ||
    details.size > KNOWLEDGE_IMAGE_MAX_SIZE_BYTES
  ) {
    await cleanupOwnedPrivateFile(
      fileId,
      versionId,
      details,
    )

    return NextResponse.json(
      { error: 'Uploaded ImageKit file failed validation' },
      { status: 422 },
    )
  }

  if (
    details.width !== undefined &&
    (!Number.isInteger(details.width) ||
      details.width <= 0)
  ) {
    await cleanupOwnedPrivateFile(
      fileId,
      versionId,
      details,
    )

    return NextResponse.json(
      { error: 'Invalid image width' },
      { status: 422 },
    )
  }

  if (
    details.height !== undefined &&
    (!Number.isInteger(details.height) ||
      details.height <= 0)
  ) {
    await cleanupOwnedPrivateFile(
      fileId,
      versionId,
      details,
    )

    return NextResponse.json(
      { error: 'Invalid image height' },
      { status: 422 },
    )
  }

  const { data: image, error: insertError } =
    await supabase
      .from('knowledge_version_images')
      .insert({
        knowledge_item_version_id: versionId,
        imagekit_file_id: fileId,
        imagekit_url: details.url,
        alt_text: altText,
        caption,
        sort_order: sortOrder,
        created_by: user.id,
        purpose,
        test_specimen_id: testSpecimenId,
        mime_type: details.mime,
        file_size_bytes: details.size,
        width: details.width ?? null,
        height: details.height ?? null,
      })
      .select('*')
      .single()

  if (insertError) {
    try {
      await deleteImageKitFile(fileId)
    } catch {
      // Cleanup is best-effort. The file remains unpublished and
      // can be retried later.
    }

    return NextResponse.json(
      { error: 'Knowledge image metadata could not be saved' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { image },
    { status: 201 },
  )
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Use the Knowledge version image listing service',
    },
    { status: 405 },
  )
}
