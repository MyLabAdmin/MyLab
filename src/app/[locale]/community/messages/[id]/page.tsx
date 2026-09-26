import { getConversation, getMessages } from '@/app/[locale]/actions/messaging'
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
  const conversationName =
    conversation.type === 'direct'
      ? otherMember?.display_name || (locale === 'ar' ? 'مستخدم' : 'User')
      : conversation.title || (locale === 'ar' ? 'محادثة جماعية' : 'Group conversation')

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:gap-4">
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
                size="md"
              />
            ) : (
              <Avatar
                name={conversationName}
                avatarUrl={conversation.avatar_url ?? null}
                size="md"
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
        <section className="min-h-[60vh] rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-5 lg:p-6">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isGroup={conversation.type === 'group'}
            locale={locale}
          />
        </section>

        <MessageComposer
          conversationId={conversation.id}
          locale={locale}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  )
}
