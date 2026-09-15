import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getCategories } from '@/app/[locale]/actions/knowledge'
import UploadForm from './UploadForm'
import AuthHeader from '@/components/auth/AuthHeader'

export default async function NewKnowledgeItemPage({
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

  const isAdmin = roles?.some((r) => r.role === 'admin')
  if (!isAdmin) {
    redirect({ href: '/', locale })
  }

  const { categories } = await getCategories()

  return (
    <div className="p-4 flex flex-col gap-5">
      <AuthHeader />
      <UploadForm categories={categories ?? []} />
    </div>
  )
}
