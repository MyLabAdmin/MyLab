import ImageKit from '@imagekit/nodejs'

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
})

export function getImagekitSignedUrl(path: string, expiresIn = 3600) {
  return client.helper.buildSrc({
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    src: path,
    signed: true,
    expiresIn,
  })
}

export async function deleteImagekitFileByPath(path: string) {
  const normalizedPath = path.trim()

  if (!normalizedPath) {
    throw new Error('ImageKit file path is required')
  }

  const fileName = normalizedPath.split('/').pop()

  if (!fileName) {
    throw new Error('Invalid ImageKit file path')
  }

  const escapedName = fileName
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')

  const assets = await client.assets.list({
    type: 'file',
    limit: 100,
    searchQuery: `name: "${escapedName}"`,
  })

  const file = assets.find(
    (asset) =>
      asset.type === 'file' &&
      'fileId' in asset &&
      asset.filePath === normalizedPath &&
      typeof asset.fileId === 'string' &&
      asset.fileId.length > 0,
  )

  if (!file || !('fileId' in file) || !file.fileId) {
    throw new Error('ImageKit avatar file was not found')
  }

  await client.files.delete(file.fileId)
}
