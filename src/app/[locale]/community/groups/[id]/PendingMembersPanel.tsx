'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { getPendingMembers, approveMember, rejectMember } from '@/app/[locale]/actions/groups'
import { useToast } from '@/components/ui/Toast'
import Avatar from '@/components/community/Avatar'

export default function PendingMembersPanel({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const locale = useLocale()
  const { showToast } = useToast()
  const [members, setMembers] = useState<{ id: string; userId: string; name: string }[]>([])

  useEffect(() => {
    getPendingMembers(groupId).then(setMembers)
  }, [groupId])

  async function handleApprove(id: string) {
    await approveMember(id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
    showToast(locale === 'ar' ? 'تم القبول ✅' : 'Approved ✅')
  }

  async function handleReject(id: string) {
    await rejectMember(id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
    showToast(locale === 'ar' ? 'تم الرفض' : 'Rejected')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{locale === 'ar' ? 'طلبات الانضمام' : 'Join Requests'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl w-7 h-7">×</button>
        </div>

        {members.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">{locale === 'ar' ? 'لا توجد طلبات' : 'No pending requests'}</p>
        )}

        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <Avatar name={m.name} size="sm" />
            <span className="text-sm text-gray-700 flex-1">{m.name}</span>
            <button type="button" onClick={() => handleApprove(m.id)} className="text-xs text-primary-600 font-medium px-2">
              {locale === 'ar' ? 'قبول' : 'Approve'}
            </button>
            <button type="button" onClick={() => handleReject(m.id)} className="text-xs text-red-500 font-medium px-2">
              {locale === 'ar' ? 'رفض' : 'Reject'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
