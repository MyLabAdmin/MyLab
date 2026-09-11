import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ImageKitApiError,
  buildKnowledgeImageFolder,
  deleteImageKitFile,
  getImageKitFileDetails,
} from '@/lib/knowledge/imagekit'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  const { data: image, error: imageError } =
    await supabase
      .from('knowledge_version_images')
      .select(
        `
          *,
          knowledge_item_versions!inner(
            id,
            status,
            review_status
          )
        `,
      )
      .eq('id', id)
      .maybeSingle()

  if (imageError) {
    return NextResponse.json(
      { error: 'Knowledge image lookup failed' },
      { status: 500 },
    )
  }

  if (!image) {
    return NextResponse.json(
      { error: 'Knowledge image not found' },
      { status: 404 },
    )
  }

  const version = Array.isArray(
    image.knowledge_item_versions,
  )
    ? image.knowledge_item_versions[0]
    : image.knowledge_item_versions

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

  let fileExists = true

  try {
    const details = await getImageKitFileDetails(
      image.imagekit_file_id,
    )

    if (
      details.fileId !== image.imagekit_file_id ||
      !details.filePath ||
      !details.filePath.startsWith(
        `${buildKnowledgeImageFolder(
          image.knowledge_item_version_id,
        )}/`,
      )
    ) {
      return NextResponse.json(
        { error: 'ImageKit file failed ownership validation' },
        { status: 422 },
      )
    }
  } catch (error) {
    if (
      error instanceof ImageKitApiError &&
      error.status === 404
    ) {
      fileExists = false
    } else {
      return NextResponse.json(
        { error: 'ImageKit file could not be verified' },
        { status: 502 },
      )
    }
  }

  if (fileExists) {
    try {
      await deleteImageKitFile(
        image.imagekit_file_id,
      )
    } catch {
      return NextResponse.json(
        {
          error:
            'ImageKit file could not be deleted; metadata was retained',
        },
        { status: 502 },
      )
    }
  }

  const { error: deleteMetadataError } =
    await supabase
      .from('knowledge_version_images')
      .delete()
      .eq('id', id)

  if (deleteMetadataError) {
    return NextResponse.json(
      {
        error:
          'Image file was deleted, but metadata could not be removed. Retry the operation.',
      },
      { status: 500 },
    )
  }

  return new NextResponse(null, { status: 204 })
}
