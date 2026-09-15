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
