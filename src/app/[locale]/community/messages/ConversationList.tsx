'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'

type Conversation = {
  id: string
  type: 'direct' | 'group'
  title: string | null
  updated_at: string
  members: Array<{ userId: string }>
  otherUser: { displayName: string | null; avatarUrl: string | null } | null
}

export default function ConversationList({
  conversations,
  locale,
}: {
  conversations: Conversation[]
  locale: string
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all')

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en')

    return conversations.filter((conversation) => {
      const matchesFilter = filter === 'all' || conversation.type === filter
      if (!matchesFilter) return false
      if (!query) return true

      const title = conversation.type === 'direct' ? conversation.otherUser?.displayName ?? '' : conversation.title ?? ''
      return title.toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en').includes(query)
    })
  }, [conversations, filter, locale, search])

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={locale === 'ar' ? 'ابحث في المحادثات...' : 'Search conversations...'}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white"
          type="search"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        />

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(['all', 'direct', 'group'] as const).map((value) => {
            const active = filter === value
            const label = value === 'all' ? (locale === 'ar' ? 'الكل' : 'All') : value === 'direct' ? (locale === 'ar' ? 'مباشرة' : 'Direct') : (locale === 'ar' ? 'مجموعات' : 'Groups')

            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={active ? "shrink-0 rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white sm:text-sm" : "shrink-0 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 sm:text-sm"}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-700">💬</div>
          <p className="text-sm text-gray-500 sm:text-base">
            {search.trim() ? (locale === 'ar' ? 'لا توجد محادثات مطابقة' : 'No matching conversations') : (locale === 'ar' ? 'لا توجد محادثات' : 'No conversations')}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const title = conversation.type === 'direct' ? (conversation.otherUser?.displayName || (locale === 'ar' ? 'مستخدم' : 'User')) : (conversation.title || (locale === 'ar' ? 'محادثة جماعية' : 'Group conversation'))
              const avatarUrl = conversation.otherUser?.avatarUrl

              return (
                <Link
                  key={conversation.id}
                  href={'/community/messages/' + conversation.id}
                  className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:gap-4 sm:p-4 lg:p-5"
                >
                  <div className="shrink-0">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover sm:h-12 sm:w-12 lg:h-14 lg:w-14" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700 sm:h-12 sm:w-12 sm:text-lg lg:h-14 lg:w-14 lg:text-xl">{title.charAt(0).toUpperCase()}</div>}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                      <h2 className="min-w-0 truncate text-sm font-semibold text-gray-800 sm:text-base lg:text-lg">{title}</h2>
                      <time className="shrink-0 text-[10px] text-gray-400 sm:text-xs">{(() => { const d = new Date(conversation.updated_at); const date = String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear(); const time = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); return date + ' ' + time })()}</time>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">{conversation.type === 'direct' ? (locale === 'ar' ? 'محادثة مباشرة' : 'Direct conversation') : (locale === 'ar' ? 'محادثة جماعية · ' + conversation.members.length + ' أعضاء' : 'Group conversation · ' + conversation.members.length + ' members')}</p>
                  </div>

                  <span aria-hidden="true" className="hidden shrink-0 text-gray-300 sm:block">{locale === 'ar' ? '‹' : '›'}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}