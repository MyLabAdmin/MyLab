import { redirect } from '@/i18n/navigation'
import {
  getBlockedUsers,
  getFriendsHub,
} from '@/app/[locale]/actions/friends'
import FriendsBrowser from './FriendsBrowser'

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const [friendsResult, blockedResult] = await Promise.all([
    getFriendsHub(),
    getBlockedUsers(),
  ])

  if (!friendsResult.success) {
    redirect({ href: '/login', locale })
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <header>
          <h1 className="text-xl font-bold text-primary-700 sm:text-2xl">
            {locale === 'ar' ? 'الأصدقاء' : 'Friends'}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {locale === 'ar'
              ? 'اكتشف أشخاصاً، أرسل طلبات صداقة وأدر علاقاتك.'
              : 'Discover people, send friend requests, and manage your connections.'}
          </p>
        </header>

        <FriendsBrowser
          people={friendsResult.people ?? []}
          incoming={friendsResult.incoming ?? []}
          sent={friendsResult.sent ?? []}
          friends={friendsResult.friends ?? []}
          blockedUsers={
            blockedResult.success
              ? blockedResult.blockedUsers
              : []
          }
          locale={locale}
        />
      </div>
    </main>
  )
}
