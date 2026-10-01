import {
  acceptMessageRequest,
  getConversation,
  getMessages,
} from '@/app/[locale]/actions/messaging'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import Avatar from '@/components/community/Avatar'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import ConversationPresence from './ConversationPresence'
import MessageComposer from './MessageComposer'
import MessageList from './MessageList'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const supabase = await createClient()

  const [conversationResult, messagesResult, userData] = await Promise.all([
    getConversation(id),
    getMessages(id),
    supabase.auth.getUser(),
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

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.data.user?.id ?? '')
    .eq('role', 'admin')
    .maybeSingle()

  const isAdmin = !!adminRole
  const conversationMembers = conversation.conversation_members
  const otherMember = conversationMembers.find((member) => member.user_id !== currentUserId)

  const isMessageRequest =
    conversation.type === 'direct' &&
    conversation.message_request_status === 'pending'

  const isMessageRequester =
    isMessageRequest &&
    conversation.message_requester_id === currentUserId

  const hasSentRequestMessage =
    isMessageRequester &&
    messages.some(
      (message) =>
        message.sender_id === currentUserId &&
        !message.deleted_at,
    )

  const acceptMessageRequestFromForm = async (formData: FormData) => {
    'use server'

    const conversationId = formData.get('conversationId')

    if (typeof conversationId !== 'string' || !conversationId) {
      return
    }

    await acceptMessageRequest(conversationId)
  }
  const conversationName =
    conversation.type === 'direct'
      ? otherMember?.display_name || (locale === 'ar' ? 'مستخدم' : 'User')
      : conversation.title || (locale === 'ar' ? 'محادثة جماعية' : 'Group conversation')

  return (
    <main className="h-[100dvh] overflow-hidden px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-4xl min-h-0 flex-col gap-3 sm:gap-4">
        <header className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm sm:gap-3 sm:p-3.5">
          <Link
            href="/community/messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:h-11 sm:w-11"
            aria-label={locale === 'ar' ? 'العودة' : 'Back'}
          >
            {locale === 'ar' ? (
              <ArrowRight className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </Link>

          <Link
            href={
              conversation.type === 'direct'
                ? '/community/profile/' + (otherMember?.user_id ?? '')
                : '/community/messages/' + conversation.id + '/info'
            }
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 transition-colors hover:bg-gray-50"
          >
            {conversation.type === 'direct' ? (
              <Avatar
                name={conversationName}
                avatarUrl={otherMember?.avatar_url}
                size="ml"
              />
            ) : (
              <Avatar
                name={conversationName}
                avatarUrl={conversation.avatar_url ?? null}
                size="ml"
              />
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-gray-800 sm:text-base lg:text-lg">
                {conversationName}
              </h1>

              <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                <ConversationPresence
                  conversationId={conversation.id}
                  currentUserId={currentUserId}
                  memberIds={conversationMembers.map(
                    (member) => member.user_id,
                  )}
                  otherMemberId={otherMember?.user_id}
                  isGroup={conversation.type === 'group'}
                  locale={locale}
                />
              </p>
            </div>
          </Link>

          <Link
            href={
              conversation.type === 'direct'
                ? '/community/profile/' + (otherMember?.user_id ?? '')
                : '/community/messages/' + conversation.id + '/info'
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:h-11 sm:w-11"
            aria-label={
              locale === 'ar' ? 'معلومات المحادثة' : 'Conversation info'
            }
          >
            <Info className="h-5 w-5" />
          </Link>
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-5 lg:p-6">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isGroup={conversation.type === 'group'}
            locale={locale}
          />
        </section>

        {isMessageRequest && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {locale === 'ar'
                    ? 'طلب مراسلة'
                    : 'Message request'}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {isMessageRequester
                    ? hasSentRequestMessage
                      ? locale === 'ar'
                        ? 'تم إرسال طلب المراسلة. لا يمكنك إرسال رسالة أخرى حتى يتم قبول الطلب.'
                        : 'Your message request was sent. You cannot send another message until it is accepted.'
                      : locale === 'ar'
                        ? 'يمكنك إرسال رسالة واحدة فقط أثناء انتظار قبول الطلب.'
                        : 'You can send only one message while the request is pending.'
                    : locale === 'ar'
                      ? 'يمكنك قبول طلب المراسلة للبدء بالمحادثة.'
                      : 'Accept the message request to start the conversation.'}
                </p>
              </div>

              {!isMessageRequester && (
                <form action={acceptMessageRequestFromForm}>
                  <input
                    type="hidden"
                    name="conversationId"
                    value={conversation.id}
                  />
                  <button
                    type="submit"
                    className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    {locale === 'ar' ? 'قبول الطلب' : 'Accept request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <MessageComposer
          conversationId={conversation.id}
          locale={locale}
          isAdmin={isAdmin}
          disabled={
            isMessageRequest &&
            (isMessageRequester ? hasSentRequestMessage : true)
          }
          disabledReason={
            isMessageRequest
              ? isMessageRequester
                ? hasSentRequestMessage
                  ? locale === 'ar'
                    ? 'لا يمكنك إرسال رسالة أخرى حتى يتم قبول طلب المراسلة.'
                    : 'You cannot send another message until the message request is accepted.'
                  : undefined
                : locale === 'ar'
                  ? 'اقبل طلب المراسلة أولًا للبدء في المحادثة.'
                  : 'Accept the message request first to start the conversation.'
              : undefined
          }
        />
      </div>
    </main>
  )
}
