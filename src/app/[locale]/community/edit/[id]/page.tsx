import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getPostForEdit } from '@/app/[locale]/actions/community'
import EditPostForm from './EditPostForm'

export default async function EditPostPage({
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

  const post = await getPostForEdit(id)
  if (!post) {
    redirect({ href: '/community', locale })
  }

  const isOwner = post!.authorId === userData.user!.id
  let canManageGroupPost = false

  if (post!.groupId) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role, status')
      .eq('group_id', post!.groupId)
      .eq('user_id', userData.user!.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership?.role === 'owner') {
      canManageGroupPost = true
    } else if (membership?.role === 'moderator') {
      const { data: permissions } = await supabase
        .from('group_moderator_permissions')
        .select('can_manage_posts')
        .eq('group_id', post!.groupId)
        .eq('user_id', userData.user!.id)
        .maybeSingle()

      canManageGroupPost = permissions?.can_manage_posts === true
    }
  }

  if (!isOwner && !isAdmin && !canManageGroupPost) {
    redirect({ href: '/community', locale })
  }

  return (
    <EditPostForm
      postId={post!.id}
      initialContent={post!.content}
      initialImageRefs={post!.imageRefs}
    />
  )
}
