import 'server-only'

import { createHmac } from 'node:crypto'

export const KNOWLEDGE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const KNOWLEDGE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

export type KnowledgeImageMimeType =
  (typeof KNOWLEDGE_IMAGE_MIME_TYPES)[number]

export interface ImageKitFileDetails {
  fileId?: string
  filePath?: string
  url?: string
  fileType?: string
  mime?: string
  size?: number
  width?: number
  height?: number
  isPublished?: boolean
  isPrivateFile?: boolean
}

export class ImageKitApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ImageKitApiError'
    this.status = status
  }
}

function getPrivateKey() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('ImageKit private key is not configured')
  }

  return privateKey
}

function getAuthorizationHeader() {
  const encoded = Buffer.from(`${getPrivateKey()}:`).toString('base64')
  return `Basic ${encoded}`
}

export function buildKnowledgeImageFolder(versionId: string) {
  return `/mylab/knowledge/versions/${versionId}`
}

export function isKnowledgeImageMimeType(
  value: string | null | undefined,
): value is KnowledgeImageMimeType {
  return Boolean(
    value &&
      KNOWLEDGE_IMAGE_MIME_TYPES.includes(
        value as KnowledgeImageMimeType,
      ),
  )
}

export function isKnowledgeImagePath(
  filePath: string | null | undefined,
  versionId: string,
) {
  if (!filePath) {
    return false
  }

  const folder = buildKnowledgeImageFolder(versionId)

  return (
    filePath === folder ||
    filePath.startsWith(`${folder}/`)
  )
}

export async function getImageKitFileDetails(
  fileId: string,
): Promise<ImageKitFileDetails> {
  const response = await fetch(
    `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: getAuthorizationHeader(),
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new ImageKitApiError(
      'ImageKit file details request failed',
      response.status,
    )
  }

  return (await response.json()) as ImageKitFileDetails
}

export async function deleteImageKitFile(fileId: string) {
  const response = await fetch(
    `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: getAuthorizationHeader(),
      },
      cache: 'no-store',
    },
  )

  if (!response.ok && response.status !== 404) {
    throw new ImageKitApiError(
      'ImageKit file deletion failed',
      response.status,
    )
  }
}

export function createSignedKnowledgeImageUrl(
  filePath: string,
  expiresInSeconds = 300,
) {
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY

  if (!urlEndpoint || !privateKey) {
    throw new Error('ImageKit is not configured')
  }

  if (!filePath.startsWith('/')) {
    throw new Error('Invalid ImageKit file path')
  }

  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('Invalid ImageKit URL expiry')
  }

  const expireAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = createHmac('sha1', privateKey)
    .update(`${filePath}${expireAt}`)
    .digest('hex')

  const signedUrl = new URL(
    filePath,
    urlEndpoint.endsWith('/') ? urlEndpoint : `${urlEndpoint}/`,
  )

  signedUrl.searchParams.set('ik-t', String(expireAt))
  signedUrl.searchParams.set('ik-s', signature)

  return signedUrl.toString()
}
