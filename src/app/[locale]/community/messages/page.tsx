import { getConversations } from '@/app/[locale]/actions/messaging'
import ConversationList from './ConversationList'

function formatConversationTime(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const result = await getConversations()

  if (!result.success) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {locale === 'ar'
              ? 'تعذر تحميل المحادثات'
              : 'Failed to load conversations'}
          </p>
        </div>
      </main>
    )
  }

  const conversations = result.conversations

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
        <header>
          <h1 className="text-xl font-bold text-primary-700 sm:text-2xl lg:text-3xl">
            {locale === 'ar' ? 'المراسلات' : 'Messages'}
          </h1>

          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            {locale === 'ar'
              ? 'محادثاتك ورسائلك'
              : 'Your conversations and messages'}
          </p>
        </header>

        <ConversationList conversations={conversations} locale={locale} />
      </div>
    </main>
  )
}
