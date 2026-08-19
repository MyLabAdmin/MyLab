import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

function getLocale(requestUrl: URL) {
  const locale = requestUrl.searchParams.get('locale')

  if (
    locale &&
    routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    return locale
  }

  return routing.defaultLocale
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const locale = getLocale(requestUrl)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/login`, requestUrl.origin),
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?error=confirmation_failed`,
        requestUrl.origin,
      ),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL(`/${locale}/login`, requestUrl.origin),
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.redirect(
      new URL(`/${locale}/profile/complete`, requestUrl.origin),
    )
  }

  return NextResponse.redirect(
    new URL(`/${locale}/dashboard`, requestUrl.origin),
  )
}
