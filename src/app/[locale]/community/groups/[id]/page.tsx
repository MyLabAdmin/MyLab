import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import {
  getGroupDetail,
  getPendingMembers,
} from '@/app/[locale]/actions/groups'
import { getFeed } from '@/app/[locale]/actions/community'
import GroupHeader from './GroupHeader'
import FeedList from '../../FeedList'

export default async function GroupDetailPage({
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

  const user = userData.user!

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const isAdmin = roles?.some((r) => r.role === 'admin') ?? false

  const group = await getGroupDetail(id)

  if (!group) {
    redirect({ href: '/community/groups', locale })
  }

  const currentGroup = group!

  const canManageJoinRequests =
    isAdmin ||
    currentGroup.myRole === 'owner' ||
    currentGroup.moderatorPermissions?.canManageJoinRequests === true

  const pendingMembers = canManageJoinRequests
    ? await getPendingMembers(id)
    : []

  const canSeeFeed =
    currentGroup.privacy === 'public' ||
    currentGroup.myStatus === 'active' ||
    isAdmin

  const { posts, nextCursor } = canSeeFeed
    ? await getFeed(null, id)
    : { posts: [], nextCursor: null }

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      <GroupHeader
        group={currentGroup}
        pendingCount={pendingMembers.length}
      />

      {canSeeFeed ? (
        <FeedList
          initialPosts={posts as any}
          initialCursor={nextCursor}
          canAddImage={isAdmin}
          currentUserId={user.id}
          isAdmin={isAdmin}
          canManagePosts={
            currentGroup.myRole === 'owner' ||
            currentGroup.moderatorPermissions?.canManagePosts === true ||
            isAdmin
          }
          canDeletePosts={
            currentGroup.myRole === 'owner' ||
            currentGroup.moderatorPermissions?.canDeletePosts === true ||
            isAdmin
          }
          groupId={id}
        />
      ) : (
        <p className="text-gray-400 text-sm text-center py-8">
          {locale === 'ar'
            ? 'انضم للمجموعة عشان تشوف المنشورات'
            : 'Join the group to see posts'}
        </p>
      )}
    </main>
  )
}
