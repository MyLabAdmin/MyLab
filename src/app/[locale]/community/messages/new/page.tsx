import { getFriends } from '@/app/[locale]/actions/friends'
import NewConversationForm from './NewConversationForm'

export default async function NewConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { locale } = await params
  const { type } = await searchParams

  const result = await getFriends()

  if (!result.success) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {locale === 'ar'
              ? 'تعذر تحميل قائمة الأصدقاء'
              : 'Failed to load friends'}
          </div>
        </div>
      </main>
    )
  }

  const initialType = type === 'group' ? 'group' : 'direct'

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <NewConversationForm
          locale={locale}
          initialType={initialType}
          friends={result.friends}
        />
      </div>
    </main>
  )
}
