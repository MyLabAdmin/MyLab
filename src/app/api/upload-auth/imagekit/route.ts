import { getUploadAuthParams } from '@imagekit/next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)

  if (!roles?.some((r) => r.role === 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
  })

  return Response.json({
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  })
}
