import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getFeed } from '@/app/[locale]/actions/community'
import FeedList from './FeedList'
import { Link } from '@/i18n/navigation'

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

  const { posts, nextCursor } = await getFeed()

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-primary-700">
          {locale === 'ar' ? 'المجتمع' : 'Community'}
        </h1>

        <Link
          href="/community/friends"
          className="btn-secondary w-auto shrink-0 px-3 py-1.5 text-sm"
        >
          {locale === 'ar' ? 'الأصدقاء' : 'Friends'}
        </Link>
      </div>

      <FeedList
        initialPosts={posts as any}
        initialCursor={nextCursor}
        canAddImage={isAdmin}
        currentUserId={userData.user!.id}
        isAdmin={isAdmin}
      />
    </main>
  )
}
