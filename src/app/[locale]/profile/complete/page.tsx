import { redirect } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AuthCard } from '@/components/auth/ui/AuthCard'
import { AuthHeader } from '@/components/auth/ui/AuthHeader'
import { AuthShell } from '@/components/auth/ui/AuthShell'
import { ProfileCompletionForm } from '@/components/profile/ProfileCompletionForm'

type PageProps = {
  params: Promise<{
    locale: 'en' | 'ar'
  }>
}

export default async function CompleteProfilePage({
  params,
}: PageProps) {
  const { locale } = await params
  const t = await getTranslations('profile')
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    return redirect({
      href: '/dashboard',
      locale,
    })
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title={t('title')}
          description={t('description')}
        />
        <ProfileCompletionForm />
      </AuthCard>
    </AuthShell>
  )
}
