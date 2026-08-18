import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'

type DashboardPageProps = {
  params: Promise<{
    locale: 'en' | 'ar'
  }>
}

export default async function DashboardPage({
  params,
}: DashboardPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect({
      href: '/login',
      locale,
    })
  }

  return (
    <main>
      <h1>MyLab Dashboard</h1>
      <p>Welcome back.</p>
      <p>{user.email}</p>
    </main>
  )
}
