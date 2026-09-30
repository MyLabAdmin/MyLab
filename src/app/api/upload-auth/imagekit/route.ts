import { getUploadAuthParams } from '@imagekit/next/server'
import { getFeatureCapacityStatus } from '@/lib/features/access'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_USER_UPLOAD_FEATURES = new Set([
  'post_media',
  'message_media',
  'group_cover',
  'profile_avatar',
])

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)

  const isAdmin = roles?.some((r) => r.role === 'admin') ?? false
  const featureKey = new URL(request.url).searchParams.get('feature')

  if (!featureKey) {
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    if (isAdmin) {
      // Admins retain the existing upload capability.
    } else {
      if (!ALLOWED_USER_UPLOAD_FEATURES.has(featureKey)) {
        return Response.json(
          {
            error: 'Unsupported upload feature',
            featureKey,
          },
          { status: 403 },
        )
      }

      if (featureKey !== 'group_cover' && featureKey !== 'profile_avatar') {
        const statusResult =
          await getFeatureCapacityStatus(featureKey)

      if (!statusResult.success) {
        return Response.json(
          {
            error: 'Feature access required',
            featureKey,
          },
          { status: 403 },
        )
      }

      const status = statusResult.status

      const hasCapacity =
        status.dailyRemaining > 0 ||
        status.totalCapacityRemaining > 0

      if (!hasCapacity) {
        return Response.json(
          {
            error: 'Feature access required',
            featureKey,
          },
          { status: 403 },
        )
      }
      }
    }
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
