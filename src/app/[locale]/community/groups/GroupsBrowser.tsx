'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'

type Group = {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  privacy: 'public' | 'private'
  joinPolicy: 'instant' | 'approval'
  memberCount: number
  myStatus: string | null
  myRole: string | null
}

type Filter = 'all' | 'mine' | 'discover'

export default function GroupsBrowser({
  groups,
  locale,
}: {
  groups: Group[]
  locale: string
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const labels = {
    all: locale === 'ar' ? 'الكل' : 'All Groups',
    mine: locale === 'ar' ? 'مجموعاتي' : 'My Groups',
    discover: locale === 'ar' ? 'اكتشف' : 'Discover',
  }

  const filteredGroups = useMemo(() => {
    const mine = groups.filter((g) => g.myStatus === 'active')
    const discover = groups.filter((g) => g.myStatus !== 'active')

    if (filter === 'mine') return mine
    if (filter === 'discover') return discover

    return [...mine, ...discover]
  }, [filter, groups])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-1.5 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(['all', 'mine', 'discover'] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === item
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:bg-white/70'
            }`}
          >
            {labels[item]}
          </button>
        ))}
      </div>

      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredGroups.map((group) => (
            <Link
              key={group.id}
              href={`/community/groups/${group.id}`}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 transition-shadow hover:shadow-sm"
            >
              {group.coverUrl ? (
                <img
                  src={group.coverUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg text-gray-400">
                  👥
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-gray-800">
                    {group.name}
                  </h3>

                  {group.myStatus === 'active' && (
                    <span className="shrink-0 text-xs text-green-600">
                      ✓
                    </span>
                  )}

                  {group.myStatus === 'pending' && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {locale === 'ar' ? 'معلّق' : 'Pending'}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {group.memberCount}{' '}
                  {locale === 'ar' ? 'عضو' : 'members'}
                  {' · '}
                  {group.privacy === 'private'
                    ? locale === 'ar'
                      ? 'خاصة'
                      : 'Private'
                    : locale === 'ar'
                      ? 'عامة'
                      : 'Public'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">
          {filter === 'mine'
            ? locale === 'ar'
              ? 'لا توجد مجموعات منضم إليها بعد'
              : 'You have not joined any groups yet'
            : filter === 'discover'
              ? locale === 'ar'
                ? 'لا توجد مجموعات لاكتشافها'
                : 'No groups to discover'
              : locale === 'ar'
                ? 'لا توجد مجموعات بعد'
                : 'No groups yet'}
        </p>
      )}
    </div>
  )
}
