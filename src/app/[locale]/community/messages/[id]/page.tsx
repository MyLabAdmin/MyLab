import { getConversation, getMessages } from '@/app/[locale]/actions/messaging'
import { Link } from '@/i18n/navigation'
import Avatar from '@/components/community/Avatar'
import MessageComposer from './MessageComposer'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const [conversationResult, messagesResult] = await Promise.all([
    getConversation(id),
    getMessages(id),
  ])

  if (!conversationResult.success || !messagesResult.success) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {locale === 'ar'
              ? 'تعذر تحميل المحادثة'
              : 'Failed to load conversation'}
          </div>
        </div>
      </main>
    )
  }

  const conversation = conversationResult.conversation
  const messages = messagesResult.messages
  const currentUserId = conversationResult.currentUserId
  const conversationMembers = conversation.conversation_members
  const otherMember = conversationMembers.find((member) => member.user_id !== currentUserId)
  const conversationName =
    conversation.type === 'direct'
      ? otherMember?.display_name || (locale === 'ar' ? 'مستخدم' : 'User')
      : conversation.title || (locale === 'ar' ? 'محادثة جماعية' : 'Group conversation')

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:gap-4">
        <header className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <Link
            href="/community/messages"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-medium text-gray-600 transition-colors hover:bg-gray-100"
            aria-label={locale === 'ar' ? 'العودة' : 'Back'}
          >
            {locale === 'ar' ? '→' : '←'}
          </Link>

          <Link
            href={conversation.type === 'direct' ? '/community/profile/' + (otherMember?.user_id ?? '') : '/community/messages/' + conversation.id + '/info'}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-gray-50"
          >
            {conversation.type === 'direct' ? (
              <Avatar
                name={conversationName}
                avatarUrl={otherMember?.avatar_url}
                size="md"
              />
            ) : (
              <div className="flex shrink-0 -space-x-2">
                {conversationMembers.slice(0, 2).map((member) => (
                  <Avatar
                    key={member.user_id}
                    name={member.display_name || (locale === 'ar' ? 'مستخدم' : 'User')}
                    avatarUrl={member.avatar_url}
                    size="sm"
                  />
                ))}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-gray-800 sm:text-lg lg:text-xl">
                {conversationName}
              </h1>

              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {conversation.type === 'direct'
                  ? locale === 'ar'
                    ? 'محادثة مباشرة'
                    : 'Direct conversation'
                  : locale === 'ar'
                    ? conversationMembers.length + ' أعضاء'
                    : conversationMembers.length + ' members'}
              </p>
            </div>

            <span className="shrink-0 text-gray-400" aria-hidden="true">
              {locale === 'ar' ? '←' : '→'}
            </span>
          </Link>
        </header>
        <section className="min-h-[60vh] rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-5 lg:p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[55vh] items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-xl">
                  💬
                </div>

                <p className="text-sm text-gray-500 sm:text-base">
                  {locale === 'ar'
                    ? 'لا توجد رسائل حتى الآن'
                    : 'No messages yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => {
                const senderName =
                  message.sender.display_name ||
                  (locale === 'ar' ? 'مستخدم' : 'User')

                return (
                  <article
                    key={message.id}
                    className="max-w-[90%] rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:max-w-[80%] sm:px-4 sm:py-3"
                  >
                    {conversation.type === 'group' && (
                      <div className="mb-2 flex items-center gap-2">
                        {message.sender.avatar_url ? (
                          <img
                            src={message.sender.avatar_url}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <span className="min-w-0 truncate text-xs font-semibold text-gray-700 sm:text-sm">
                          {senderName}
                        </span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800 sm:text-base">
                      {message.deleted_at
                        ? locale === 'ar'
                          ? 'تم حذف هذه الرسالة'
                          : 'This message was deleted'
                        : message.body}
                    </p>

                    <time className="mt-1 block text-[10px] text-gray-400 sm:text-xs">
                      {new Intl.DateTimeFormat(
                        locale === 'ar' ? 'ar' : 'en',
                        {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        },
                      ).format(new Date(message.created_at))}
                    </time>
                  </article>
                )
              })}            </div>
          )}
        </section>

        <MessageComposer
          conversationId={conversation.id}
          locale={locale}
        />
      </div>
    </main>
  )
}
