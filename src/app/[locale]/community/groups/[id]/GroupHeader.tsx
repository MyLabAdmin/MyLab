'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { joinGroup, leaveGroup } from '@/app/[locale]/actions/groups'
import { useToast } from '@/components/ui/Toast'
import PendingMembersPanel from './PendingMembersPanel'
import ModeratorManagementPanel from './ModeratorManagementPanel'
import GroupMembersPanel from './GroupMembersPanel'

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
  const [showPending, setShowPending] = useState(false)
  const [showModerators, setShowModerators] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const isManager = group.myRole === 'owner' || group.myRole === 'moderator'
  const canManageJoinRequests =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canManageJoinRequests === true
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

        {canManageJoinRequests && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowPending(true)}
            className="flex-1 border border-primary-300 text-primary-700 rounded-lg py-2 text-sm"
          >
            {locale === 'ar'
              ? `طلبات (${pendingCount})`
              : `Requests (${pendingCount})`}
          </button>
        )}

        {canRemoveMembers && (
          <button
            type="button"
            onClick={() => setShowMembers(true)}
            className="flex-1 border border-primary-300 text-primary-700 rounded-lg py-2 text-sm"
          >
            {locale === 'ar' ? 'الأعضاء' : 'Members'}
          </button>
        )}

        {canManageModerators && (
          <button
            type="button"
            onClick={() => setShowModerators(true)}
            className="flex-1 border border-primary-300 text-primary-700 rounded-lg py-2 text-sm"
          >
            {locale === 'ar' ? 'المشرفون' : 'Moderators'}
          </button>
        )}
      </div>

      {showPending && (
        <PendingMembersPanel
          groupId={group.id}
          onClose={() => setShowPending(false)}
        />
      )}

      {showModerators && (
        <ModeratorManagementPanel
          groupId={group.id}
          locale={locale}
          onClose={() => setShowModerators(false)}
        />
      )}

      {showMembers && (
        <GroupMembersPanel
          groupId={group.id}
          locale={locale}
          canRemoveMembers={canRemoveMembers}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  )
}
