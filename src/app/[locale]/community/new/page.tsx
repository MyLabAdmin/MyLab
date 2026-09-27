import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import NewPostForm from './NewPostForm'

export default async function NewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ group?: string }>
}) {
  const { locale } = await params
  const { group } = await searchParams
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect({ href: '/login', locale })
  }

  return <NewPostForm groupId={group} />
}
