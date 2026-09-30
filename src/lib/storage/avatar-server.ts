import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'

export async function resolveAvatarUrl(
  avatarRef: string | null | undefined,
): Promise<string | null> {
  if (!avatarRef) return null

  const parsed = parseMediaRef(avatarRef)

  if (parsed.provider === 'imagekit' && parsed.path.trim()) {
    return getImagekitSignedUrl(parsed.path)
  }

  return avatarRef
}
