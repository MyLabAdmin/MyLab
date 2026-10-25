import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import AppHeader from '@/components/navigation/AppHeader'
import { resolveAvatarUrl } from '@/lib/storage/avatar-server'
import CourseForm from './CourseForm'

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect({ href: '/login', locale })
    return null
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)

  if (!roles?.some((role) => role.role === 'admin')) {
    redirect({ href: '/', locale })
  }

  const { data: profile } = await supabase
    .from('profiles_public')
    .select('display_name, avatar_url')
    .eq('id', userData.user.id)
    .maybeSingle()

  const displayName = profile?.display_name ?? null
  const avatarUrl = await resolveAvatarUrl(profile?.avatar_url)

  return (
    <div className="flex flex-col gap-5 p-4">
      <AppHeader
        locale={locale === 'en' ? 'en' : 'ar'}
        userId={userData.user.id}
        displayName={displayName}
        avatarUrl={avatarUrl}
        title={locale === 'ar' ? 'إنشاء دورة' : 'Create course'}
      />
      <CourseForm />
    </div>
  )
}
