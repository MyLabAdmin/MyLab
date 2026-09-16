import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getFeed } from '@/app/[locale]/actions/community'
import PostComposer from './PostComposer'
import ReactionPicker from './ReactionPicker'
import ReactionDetailsWrapper from './ReactionDetailsWrapper'
import CommentSection from './CommentSection'
import PostTimestamp from './PostTimestamp'
import PostActionsBar from './PostActionsBar'

export default async function CommunityPage({
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

  const posts = await getFeed()

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      <h1 className="text-xl md:text-2xl font-bold text-primary-700">
        {locale === 'ar' ? 'المجتمع' : 'Community'}
      </h1>

      <PostComposer canAddImage={isAdmin} />

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div key={post.id} id={post.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                {post.authorName?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-800 text-sm">{post.authorName}</span>
                <PostTimestamp createdAt={post.createdAt} />
              </div>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap" dir="auto">{post.content}</p>

            {post.media.map((m, i) =>
              m.type === 'image' ? (
                <img key={i} src={m.url} alt="" className="w-full rounded-lg" />
              ) : null
            )}

            <ReactionDetailsWrapper
              targetType="post"
              targetId={post.id}
              counts={post.reactionCounts}
              myReaction={post.myReaction}
            />

            <PostActionsBar
              postId={post.id}
              initialBookmarked={post.bookmarked}
              initialMuted={post.muted}
            />

            <CommentSection postId={post.id} comments={post.comments} />
          </div>
        ))}

        {posts.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            {locale === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
        )}
      </div>
    </main>
  )
}
