'use client'

import { useEffect, useState } from 'react'
import Avatar from '@/components/community/Avatar'
import {
  getGroupMembers,
  getGroupModerators,
  setGroupModerator,
  setGroupModeratorPermissions,
  type GroupMember,
  type GroupModerator,
  type GroupModeratorPermissionSet,
} from '@/app/[locale]/actions/groups'

type Props = {
  groupId: string
  locale: string
  onClose: () => void
}

const permissionKeys: Array<{
  key: keyof GroupModeratorPermissionSet
  ar: string
  en: string
}> = [
  { key: 'canEditGroup', ar: 'تعديل المجموعة', en: 'Edit group' },
  { key: 'canAddMembers', ar: 'إضافة أعضاء', en: 'Add members' },
  { key: 'canRemoveMembers', ar: 'إزالة أعضاء', en: 'Remove members' },
  {
    key: 'canManageJoinRequests',
    ar: 'إدارة طلبات الانضمام',
    en: 'Join requests',
  },
  { key: 'canManagePosts', ar: 'إدارة المنشورات', en: 'Manage posts' },
  { key: 'canDeletePosts', ar: 'حذف المنشورات', en: 'Delete posts' },
  {
    key: 'canManageModerators',
    ar: 'إدارة المشرفين',
    en: 'Manage moderators',
  },
]

const emptyPermissions: GroupModeratorPermissionSet = {
  canEditGroup: false,
  canAddMembers: false,
  canRemoveMembers: false,
  canManageJoinRequests: false,
  canManagePosts: false,
  canDeletePosts: false,
  canManageModerators: false,
}

export default function ModeratorManagementPanel({
  groupId,
  locale,
  onClose,
}: Props) {
  const isArabic = locale === 'ar'

  const [moderators, setModerators] = useState<GroupModerator[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const [moderatorsResult, membersResult] = await Promise.all([
      getGroupModerators(groupId),
      getGroupMembers(groupId),
    ])

    if (!moderatorsResult.success) {
      setError(moderatorsResult.error)
      setLoading(false)
      return
    }

    setModerators(moderatorsResult.moderators)
    setMembers(membersResult)
    setSelectedMemberId((current) => {
      if (membersResult.some((member) => member.userId === current)) {
        return current
      }

      return membersResult[0]?.userId ?? ''
    })
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [groupId])

  const addModerator = async () => {
    if (!selectedMemberId) return

    setAdding(true)
    setError(null)

    const result = await setGroupModerator(
      groupId,
      selectedMemberId,
      true,
    )

    if (!result.success) {
      setError(result.error ?? (isArabic ? 'حدث خطأ' : 'Something went wrong'))
      setAdding(false)
      return
    }

    setSelectedMemberId('')
    await loadData()
    setAdding(false)
  }

  const removeModerator = async (userId: string) => {
    setBusyUserId(userId)
    setError(null)

    const result = await setGroupModerator(groupId, userId, false)

    if (!result.success) {
      setError(result.error ?? (isArabic ? 'حدث خطأ' : 'Something went wrong'))
      setBusyUserId(null)
      return
    }

    await loadData()
    setBusyUserId(null)
  }

  const updatePermission = async (
    moderator: GroupModerator,
    key: keyof GroupModeratorPermissionSet,
    value: boolean,
  ) => {
    setBusyUserId(moderator.userId)
    setError(null)

    const permissions = {
      ...moderator.permissions,
      [key]: value,
    }

    const result = await setGroupModeratorPermissions(
      groupId,
      moderator.userId,
      permissions,
    )

    if (!result.success) {
      setError(result.error ?? (isArabic ? 'حدث خطأ' : 'Something went wrong'))
      setBusyUserId(null)
      return
    }

    setModerators((current) =>
      current.map((item) =>
        item.userId === moderator.userId
          ? { ...item, permissions }
          : item,
      ),
    )

    setBusyUserId(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isArabic ? 'إدارة المشرفين' : 'Manage moderators'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
            {error}
          </p>
        )}

        <div className="mb-6 rounded-xl border p-4 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-medium">
            {isArabic ? 'إضافة مشرف' : 'Add moderator'}
          </h3>

          {members.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={selectedMemberId}
                onChange={(event) =>
                  setSelectedMemberId(event.target.value)
                }
                disabled={adding || loading}
                className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700"
              >
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addModerator}
                disabled={!selectedMemberId || adding || loading}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {adding
                  ? isArabic
                    ? 'جارٍ...'
                    : 'Adding...'
                  : isArabic
                    ? 'إضافة'
                    : 'Add'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isArabic
                ? 'لا يوجد أعضاء يمكن ترقيتهم حاليًا.'
                : 'There are no members available to promote.'}
            </p>
          )}
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">
            {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        ) : moderators.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            {isArabic ? 'لا يوجد مشرفون.' : 'No moderators yet.'}
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {moderators.map((moderator) => {
              const busy = busyUserId === moderator.userId

              return (
                <div
                  key={moderator.userId}
                  className="rounded-xl border p-4 dark:border-gray-700"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar
                      name={moderator.name}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {moderator.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isArabic ? 'مشرف' : 'Moderator'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeModerator(moderator.userId)}
                      disabled={busy}
                      className="rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                    >
                      {isArabic ? 'إزالة' : 'Remove'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {permissionKeys.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={moderator.permissions[permission.key]}
                          disabled={busy}
                          onChange={(event) =>
                            void updatePermission(
                              moderator,
                              permission.key,
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4"
                        />

                        <span className="text-sm">
                          {isArabic ? permission.ar : permission.en}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
