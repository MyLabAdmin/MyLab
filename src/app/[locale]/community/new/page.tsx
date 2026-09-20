import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import NewPostForm from './NewPostForm'

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect({ href: '/login', locale })
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user!.id)

  const isAdmin = roles?.some((r) => r.role === 'admin') ?? false

  return <NewPostForm canAddImage={isAdmin} />
}
