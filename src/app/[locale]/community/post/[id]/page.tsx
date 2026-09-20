import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getPostDetail } from '@/app/[locale]/actions/community'
import SinglePostView from './SinglePostView'

export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
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

  const post = await getPostDetail(id)
  if (!post) {
    redirect({ href: '/community', locale })
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <SinglePostView post={post as any} currentUserId={userData.user!.id} isAdmin={isAdmin} />
    </main>
  )
}
