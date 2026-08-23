import { NextResponse } from 'next/server'
import { getUploadAuthParams } from '@imagekit/next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY

  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: 'ImageKit is not configured' },
      { status: 500 },
    )
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey,
    publicKey,
  })

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
  })
}
