'use client'

import { useMemo, useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/community/Avatar'
import ConversationListPresence from './ConversationListPresence'
import {
  hideConversation,
  unarchiveConversation,
} from '@/app/[locale]/actions/messaging'

type Conversation = {
  id: string
  type: 'direct' | 'group'
  title: string | null
  avatar_url: string | null
  updated_at: string
  hiddenAt: string | null
  messageRequestStatus: 'accepted' | 'pending'
  messageRequesterId: string | null
  unreadCount: number
  members: Array<{ userId: string }>
  otherUser: {
    userId: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}

export default function ConversationList({
  conversations,
  locale,
}: {
  conversations: Conversation[]
  locale: string
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] =
    useState<
      'all' | 'direct' | 'group' | 'requests' | 'unread' | 'archived'
    >('all')
  const router = useRouter()
  const [isHiding, startHideTransition] = useTransition()

  const filteredConversations = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en')

    return conversations.filter((conversation) => {
      const isArchived = Boolean(conversation.hiddenAt)
      const isIncomingMessageRequest =
        conversation.type === 'direct' &&
        conversation.messageRequestStatus === 'pending' &&
        conversation.messageRequesterId === conversation.otherUser?.userId

      const matchesFilter =
        filter === 'archived'
          ? isArchived
          : !isArchived &&
            (filter === 'all' ||
              (filter === 'direct' && conversation.type === 'direct') ||
              (filter === 'group' && conversation.type === 'group') ||
              (filter === 'requests' && isIncomingMessageRequest) ||
              (filter === 'unread' && conversation.unreadCount > 0))

      if (!matchesFilter) return false
      if (!query) return true

      const title =
        conversation.type === 'direct'
          ? conversation.otherUser?.displayName ?? ''
          : conversation.title ?? ''

      return title
        .toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en')
        .includes(query)
    })
  }, [conversations, filter, locale, search])

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            locale === 'ar'
              ? 'ابحث في المحادثات...'
              : 'Search conversations...'
          }
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white"
          type="search"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        />

        <div className="mt-3 flex w-full justify-start gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {(
            ['all', 'requests', 'unread', 'direct', 'group', 'archived'] as const
          ).map((value) => {
            const active = filter === value

            const label =
              value === 'all'
                ? locale === 'ar'
                  ? 'الكل'
                  : 'All'
                : value === 'requests'
                  ? locale === 'ar'
                    ? 'طلبات المراسلة'
                    : 'Message requests'
                  : value === 'unread'
                    ? locale === 'ar'
                      ? 'غير المقروءة'
                      : 'Unread'
                    : value === 'direct'
                      ? locale === 'ar'
                        ? 'مباشرة'
                        : 'Direct'
                      : value === 'group'
                        ? locale === 'ar'
                          ? 'مجموعات'
                          : 'Groups'
                        : locale === 'ar'
                          ? 'المؤرشفة'
                          : 'Archived'

            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={
                  active
                    ? 'shrink-0 rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white sm:text-sm'
                    : 'shrink-0 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 sm:text-sm'
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-700">
            💬
          </div>

          <p className="text-sm text-gray-500 sm:text-base">
            {search.trim()
              ? locale === 'ar'
                ? 'لا توجد محادثات مطابقة'
                : 'No matching conversations'
              : locale === 'ar'
                ? 'لا توجد محادثات'
                : 'No conversations'}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const title =
                conversation.type === 'direct'
                  ? conversation.otherUser?.displayName ||
                    (locale === 'ar' ? 'مستخدم' : 'User')
                  : conversation.title ||
                    (locale === 'ar'
                      ? 'محادثة جماعية'
                      : 'Group conversation')

              const avatarUrl =
                conversation.type === 'direct'
                  ? conversation.otherUser?.avatarUrl
                  : conversation.avatar_url

              const archive = () => {
                startHideTransition(async () => {
                  const result = await hideConversation(conversation.id)

                  if (!result.success) {
                    return
                  }

                  router.refresh()
                })
              }

              const unarchive = () => {
                startHideTransition(async () => {
                  const result = await unarchiveConversation(conversation.id)

                  if (!result.success) {
                    return
                  }

                  router.refresh()
                })
              }

              const isArchived = Boolean(conversation.hiddenAt)

              return (
                <div
                  key={conversation.id}
                  className="flex min-w-0 items-stretch border-b border-gray-100 last:border-b-0"
                >
                  <Link
                    href={'/community/messages/' + conversation.id}
                    className="flex min-w-0 flex-1 items-center gap-3 p-3 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:gap-4 sm:p-4 lg:p-5"
                  >
                    <div className="shrink-0">
                      <Avatar
                        name={title}
                        avatarUrl={avatarUrl}
                        size="lg"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                        <h2
                          className={[
                            'min-w-0 truncate text-sm sm:text-base lg:text-lg',
                            conversation.unreadCount > 0
                              ? 'font-bold text-gray-900'
                              : 'font-semibold text-gray-800',
                          ].join(' ')}
                        >
                          {title}
                        </h2>

                        <time className="shrink-0 text-[10px] text-gray-400 sm:text-xs">
                          {(() => {
                            const d = new Date(
                              conversation.updated_at,
                            )

                            const date =
                              String(d.getUTCDate()).padStart(2, '0') +
                              '/' +
                              String(
                                d.getUTCMonth() + 1,
                              ).padStart(2, '0') +
                              '/' +
                              d.getUTCFullYear()

                            const time =
                              String(d.getUTCHours()).padStart(2, '0') +
                              ':' +
                              String(d.getUTCMinutes()).padStart(2, '0')

                            return date + ' ' + time
                          })()}
                        </time>
                      </div>

                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-gray-500 sm:text-sm">
                          {conversation.type === 'direct' ? (
                            <ConversationListPresence
                              userId={
                                conversation.otherUser?.userId ?? ''
                              }
                              locale={locale}
                            />
                          ) : (
                            <>
                              {locale === 'ar'
                                ? 'محادثة جماعية · ' +
                                  conversation.members.length +
                                  ' أعضاء'
                                : 'Group conversation · ' +
                                  conversation.members.length +
                                  ' members'}
                            </>
                          )}
                        </p>

                        {conversation.messageRequestStatus === 'pending' && (
                          <>
                            {conversation.messageRequesterId !==
                              conversation.otherUser?.userId && (
                              <span
                                className="basis-full h-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="w-fit shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              {conversation.messageRequesterId ===
                              conversation.otherUser?.userId
                                ? locale === 'ar'
                                  ? 'طلب مراسلة'
                                  : 'Message request'
                                : locale === 'ar'
                                  ? 'بانتظار القبول'
                                  : 'Awaiting acceptance'}
                            </span>
                          </>
                        )}

                        {conversation.unreadCount > 0 && (
                          <span
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white"
                            aria-label={
                              locale === 'ar'
                                ? conversation.unreadCount + ' غير مقروءة'
                                : conversation.unreadCount + ' unread'
                            }
                          >
                            {conversation.unreadCount > 99
                              ? '99+'
                              : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className="hidden shrink-0 text-gray-300 sm:block"
                    >
                      {locale === 'ar' ? '‹' : '›'}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()

                      if (isArchived) {
                        unarchive()
                      } else {
                        archive()
                      }
                    }}
                    disabled={isHiding}
                    aria-label={
                      isArchived
                        ? locale === 'ar'
                          ? 'إلغاء أرشفة المحادثة'
                          : 'Unarchive conversation'
                        : locale === 'ar'
                          ? 'أرشفة المحادثة'
                          : 'Archive conversation'
                    }
                    title={
                      isArchived
                        ? locale === 'ar'
                          ? 'إلغاء الأرشفة'
                          : 'Unarchive'
                        : locale === 'ar'
                          ? 'أرشفة'
                          : 'Archive'
                    }
                    className="shrink-0 self-center px-3 text-xs text-gray-400 transition hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                  >
                    {isArchived
                      ? locale === 'ar'
                        ? 'إلغاء الأرشفة'
                        : 'Unarchive'
                      : locale === 'ar'
                        ? 'أرشفة'
                        : 'Archive'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
