import type { ReactNode } from 'react'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationShell } from '@/components/app-shell/ApplicationShell'

type AppLayoutProps = {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

export default async function AppLayout({
  children,
  params,
}: AppLayoutProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect({
      href: '/login',
      locale: locale as 'en' | 'ar',
    })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return redirect({
      href: '/profile/complete',
      locale: locale as 'en' | 'ar',
    })
  }

  return <ApplicationShell>{children}</ApplicationShell>
}
