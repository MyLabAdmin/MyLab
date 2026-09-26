'use client'

import { useEffect, useState } from 'react'
import Avatar from '@/components/community/Avatar'
import {
  getGroupMembers,
  removeGroupMember,
  type GroupMember,
} from '@/app/[locale]/actions/groups'

type Props = {
  groupId: string
  locale: string
  canRemoveMembers: boolean
  onClose: () => void
}

export default function GroupMembersPanel({
  groupId,
  locale,
  canRemoveMembers,
  onClose,
}: Props) {
  const isArabic = locale === 'ar'
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    setError(null)

    try {
      const result = await getGroupMembers(groupId)
      setMembers(result)
    } catch {
      setError(isArabic ? 'تعذر تحميل الأعضاء' : 'Could not load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMembers()
  }, [groupId])

  async function handleRemove(member: GroupMember) {
    const confirmed = window.confirm(
      isArabic
        ? `هل تريد إزالة "${member.name}" من المجموعة؟`
        : `Remove "${member.name}" from the group?`,
    )

    if (!confirmed) return

    setBusyUserId(member.userId)
    setError(null)

    try {
      const result = await removeGroupMember(groupId, member.userId)

      if (!result.success) {
        const messages: Record<string, string> = {
          MEMBER_NOT_FOUND: isArabic
            ? 'العضو غير موجود'
            : 'Member not found',
          OWNER_CANNOT_BE_REMOVED: isArabic
            ? 'لا يمكن إزالة مالك المجموعة'
            : 'The group owner cannot be removed',
          MEMBER_NOT_ACTIVE: isArabic
            ? 'العضو ليس نشطًا'
            : 'Member is not active',
        }

        setError(
          messages[result.error] ??
            (isArabic ? 'تعذر إزالة العضو' : 'Could not remove member'),
        )
        return
      }

      setMembers((current) =>
        current.filter((item) => item.userId !== member.userId),
      )
    } catch {
      setError(isArabic ? 'تعذر إزالة العضو' : 'Could not remove member')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <section className="w-full sm:max-w-lg max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-950 shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {isArabic ? 'أعضاء المجموعة' : 'Group members'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {members.length}{' '}
              {isArabic ? 'عضو نشط' : 'active members'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </header>

        <div className="max-h-[65vh] overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {isArabic ? 'جاري التحميل...' : 'Loading...'}
            </p>
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {isArabic ? 'لا يوجد أعضاء آخرون' : 'No other members'}
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const busy = busyUserId === member.userId

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                  >
                    <Avatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'moderator'
                          ? isArabic
                            ? 'مشرف'
                            : 'Moderator'
                          : isArabic
                            ? 'عضو'
                            : 'Member'}
                      </p>
                    </div>

                    {canRemoveMembers && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleRemove(member)}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                      >
                        {busy
                          ? isArabic
                            ? 'جاري...'
                            : 'Removing...'
                          : isArabic
                            ? 'إزالة'
                            : 'Remove'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
