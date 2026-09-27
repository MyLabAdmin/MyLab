'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { joinGroup, leaveGroup } from '@/app/[locale]/actions/groups'
import { useToast } from '@/components/ui/Toast'

export default function GroupHeader({
  group,
  pendingCount,
}: {
  group: {
    id: string
    name: string
    description: string | null
    coverUrl: string | null
    privacy: 'public' | 'private'
    joinPolicy: 'instant' | 'approval'
    memberCount: number
    myStatus: string | null
    myRole: string | null
    moderatorPermissions: {
      canEditGroup: boolean
      canAddMembers: boolean
      canRemoveMembers: boolean
      canManageJoinRequests: boolean
      canManagePosts: boolean
      canDeletePosts: boolean
      canManageModerators: boolean
    } | null
  }
  pendingCount: number
}) {
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()
  const [status, setStatus] = useState(group.myStatus)

  useEffect(() => {
    setStatus(group.myStatus)
  }, [group.myStatus])
  const [submitting, setSubmitting] = useState(false)
  const canManageJoinRequests =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canManageJoinRequests === true

  const canManageGroup =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canEditGroup === true ||
    group.moderatorPermissions?.canAddMembers === true ||
    group.moderatorPermissions?.canRemoveMembers === true ||
    group.moderatorPermissions?.canManageJoinRequests === true ||
    group.moderatorPermissions?.canManageModerators === true
  const canManageModerators =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canManageModerators === true
  const canRemoveMembers =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canRemoveMembers === true


  async function handleJoin() {
    setSubmitting(true)

    try {
      const result = await joinGroup(group.id)

      if (!result.success) {
        alert(
          locale === 'ar'
            ? 'تعذر الانضمام إلى المجموعة'
            : 'Could not join the group',
        )
        return
      }

      if (!result.status) {
        alert(
          locale === 'ar'
            ? 'تعذر تحديد حالة الانضمام'
            : 'Could not determine the membership status',
        )
        return
      }

      setStatus(result.status)
      router.refresh()
    } catch {
      alert(
        locale === 'ar'
          ? 'حدث خطأ أثناء الانضمام إلى المجموعة'
          : 'An error occurred while joining the group',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLeave() {
    setSubmitting(true)

    try {
      const result = await leaveGroup(group.id)

      if (!result.success) {
        alert(
          locale === 'ar'
            ? 'تعذر مغادرة المجموعة'
            : 'Could not leave the group',
        )
        return
      }

      setStatus(null)
      router.refresh()
    } catch {
      alert(
        locale === 'ar'
          ? 'حدث خطأ أثناء مغادرة المجموعة'
          : 'An error occurred while leaving the group',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {group.coverUrl && <img src={group.coverUrl} alt="" className="w-full h-40 object-cover rounded-lg" />}

      <div>
        <h1 className="text-xl font-bold text-primary-700">{group.name}</h1>
        {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {group.memberCount} {locale === 'ar' ? 'عضو' : 'members'} ·{' '}
          {group.privacy === 'private' ? (locale === 'ar' ? 'خاصة' : 'Private') : (locale === 'ar' ? 'عامة' : 'Public')}
        </p>
      </div>

      <div className="flex gap-2">
        {status === 'active' ? (
          <button
            type="button"
            disabled={submitting}
            onClick={handleLeave}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm disabled:opacity-60"
          >
            {locale === 'ar' ? 'مغادرة المجموعة' : 'Leave Group'}
          </button>
        ) : status === 'pending' ? (
          <button type="button" disabled className="flex-1 bg-gray-100 text-gray-400 rounded-lg py-2 text-sm">
            {locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval'}
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleJoin}
            className="flex-1 btn-primary disabled:opacity-60"
          >
            {locale === 'ar' ? 'انضمام' : 'Join'}
          </button>
        )}

        {canManageGroup && (
          <button
            type="button"
            onClick={() =>
              router.push(`/community/groups/${group.id}/manage`)
            }
            aria-label={
              locale === 'ar'
                ? 'إدارة المجموعة'
                : 'Manage group'
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-lg text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}
