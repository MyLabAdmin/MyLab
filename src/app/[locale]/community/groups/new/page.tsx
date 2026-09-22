import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import NewGroupForm from './NewGroupForm'

export default async function NewGroupPage({
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

  return <NewGroupForm />
}
