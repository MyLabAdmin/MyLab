'use client'

import { upload, type UploadResponse } from '@imagekit/next'

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export interface KnowledgeImageUploadResult {
  upload: UploadResponse
  folder: string
}

interface ImageKitAuthResponse {
  token: string
  expire: number
  signature: string
  publicKey: string
  folder: string
}

function isAllowedImage(file: File) {
  return (
    ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
    ) &&
    file.size <= MAX_IMAGE_SIZE_BYTES
  )
}

export async function uploadKnowledgeImage(
  file: File,
  versionId: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<KnowledgeImageUploadResult> {
  if (!isAllowedImage(file)) {
    throw new Error('Unsupported image type or image size')
  }

  const authResponse = await fetch(
    `/api/imagekit/auth?versionId=${encodeURIComponent(versionId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!authResponse.ok) {
    throw new Error('Failed to obtain ImageKit upload authorization')
  }

  const auth =
    (await authResponse.json()) as ImageKitAuthResponse

  const result = await upload({
    file,
    fileName: file.name,
    token: auth.token,
    signature: auth.signature,
    expire: auth.expire,
    publicKey: auth.publicKey,
    folder: auth.folder,
    useUniqueFileName: true,
    isPrivateFile: true,
    checks:
      '"file.mime" IN ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] AND "file.size" <= "5MB"',
    responseFields: ['isPrivateFile'],
    onProgress: onProgress
      ? (event) => {
          onProgress(event.loaded, event.total)
        }
      : undefined,
  })

  return {
    upload: result,
    folder: auth.folder,
  }
}
