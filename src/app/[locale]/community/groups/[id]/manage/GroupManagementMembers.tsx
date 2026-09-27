'use client'

import { useEffect, useMemo, useState } from 'react'
import { getGroupManagementMembers } from '@/app/[locale]/actions/groups'

type Member = {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  role: 'owner' | 'moderator' | 'member'
  joinedAt: string
}

export default function GroupManagementMembers({
  groupId,
  locale,
}: {
  groupId: string
  locale: string
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getGroupManagementMembers(groupId)

        if (!cancelled) {
          setMembers(data as Member[])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [groupId])

  const filteredMembers = useMemo(() => {
    const value = query.trim().toLocaleLowerCase()

    if (!value) return members

    return members.filter((member) =>
      (member.displayName?.trim() ?? '')
        .toLocaleLowerCase()
        .includes(value),
    )
  }, [members, query])

  const sections = useMemo(
    () => [
      {
        role: 'owner' as const,
        title: locale === 'ar' ? 'المالك' : 'Owner',
        members: filteredMembers.filter((member) => member.role === 'owner'),
      },
      {
        role: 'moderator' as const,
        title: locale === 'ar' ? 'المشرفون' : 'Moderators',
        members: filteredMembers.filter(
          (member) => member.role === 'moderator',
        ),
      },
      {
        role: 'member' as const,
        title: locale === 'ar' ? 'الأعضاء' : 'Members',
        members: filteredMembers.filter((member) => member.role === 'member'),
      },
    ],
    [filteredMembers, locale],
  )

  return (
    <section
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800 sm:text-lg">
              {locale === 'ar' ? 'أعضاء المجموعة' : 'Group Members'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {locale === 'ar'
                ? 'ابحث عن عضو وتصفح القائمة.'
                : 'Search and browse group members.'}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
            {filteredMembers.length}/{members.length}
          </span>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            locale === 'ar' ? 'بحث عن عضو...' : 'Search members...'
          }
          aria-label={
            locale === 'ar' ? 'بحث عن عضو' : 'Search members'
          }
          className="mt-4 min-h-11 w-full rounded-xl border border-gray-300 px-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          {locale === 'ar' ? 'لا يوجد أعضاء' : 'No members found'}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          {locale === 'ar' ? 'لا توجد نتائج' : 'No matching members'}
        </div>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
          <div className="space-y-4 p-2 sm:p-3">
            {sections.map((section) => {
              if (section.members.length === 0) return null

              return (
                <div key={section.role}>
                  <div className="sticky top-0 z-10 mb-2 flex items-center justify-between bg-white/95 px-2 py-2 backdrop-blur">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {section.title}
                    </h3>

                    <span className="text-xs text-gray-400">
                      {section.members.length}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    {section.members.map((member, index) => {
                      const name =
                        member.displayName?.trim() ||
                        (locale === 'ar' ? 'مستخدم' : 'User')

                      return (
                        <div
                          key={member.userId}
                          className={[
                            'flex min-w-0 items-center gap-3 px-3 py-3',
                            index > 0 ? 'border-t border-gray-100' : '',
                          ].join(' ')}
                        >
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {name}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {section.role === 'owner'
                                ? locale === 'ar' ? 'مالك المجموعة' : 'Group owner'
                                : section.role === 'moderator'
                                  ? locale === 'ar' ? 'مشرف' : 'Moderator'
                                  : locale === 'ar' ? 'عضو' : 'Member'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
