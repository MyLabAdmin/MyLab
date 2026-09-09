import { getUploadAuthParams } from '@imagekit/next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AUTH_EXPIRY_SECONDS = 15 * 60

export async function GET() {
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
  })
}
