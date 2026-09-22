'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { joinGroup, leaveGroup } from '@/app/[locale]/actions/groups'
import { useToast } from '@/components/ui/Toast'
import PendingMembersPanel from './PendingMembersPanel'

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
  }
  pendingCount: number
}) {
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()
  const [status, setStatus] = useState(group.myStatus)
  const [submitting, setSubmitting] = useState(false)
  const [showPending, setShowPending] = useState(false)

  const isManager = group.myRole === 'owner' || group.myRole === 'moderator'

  async function handleJoin() {
    setSubmitting(true)
    const result = await joinGroup(group.id)
    setSubmitting(false)
    if (result.success) {
      setStatus(result.status ?? 'active')
      showToast(
        result.status === 'pending'
          ? (locale === 'ar' ? 'طلبك بانتظار الموافقة' : 'Your request is pending approval')
          : (locale === 'ar' ? 'تم الانضمام ✅' : 'Joined ✅')
      )
    }
  }

  async function handleLeave() {
    setSubmitting(true)
    await leaveGroup(group.id)
    setSubmitting(false)
    setStatus(null)
    showToast(locale === 'ar' ? 'تم مغادرة المجموعة' : 'Left the group')
    router.push('/community/groups')
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

        {isManager && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowPending(true)}
            className="flex-1 border border-primary-300 text-primary-700 rounded-lg py-2 text-sm"
          >
            {locale === 'ar' ? `طلبات (${pendingCount})` : `Requests (${pendingCount})`}
          </button>
        )}
      </div>

      {showPending && <PendingMembersPanel groupId={group.id} onClose={() => setShowPending(false)} />}
    </div>
  )
}
