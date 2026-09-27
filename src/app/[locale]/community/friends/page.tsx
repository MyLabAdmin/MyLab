import { redirect } from '@/i18n/navigation'
import { getFriendsHub } from '@/app/[locale]/actions/friends'
import FriendsBrowser from './FriendsBrowser'

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const result = await getFriendsHub()

  if (!result.success) {
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
          people={result.people ?? []}
          incoming={result.incoming ?? []}
          sent={result.sent ?? []}
          friends={result.friends ?? []}
          locale={locale}
        />
      </div>
    </main>
  )
}
