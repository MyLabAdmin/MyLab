'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  removeConversationMember,
  setConversationModerator,
} from '@/app/[locale]/actions/messaging'

type Props = {
  conversationId: string
  memberId: string
  isModerator: boolean
  locale: string
  canManageModerators: boolean
}

export default function GroupMemberActions({
  conversationId,
  memberId,
  isModerator,
  locale,
  canManageModerators,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const isArabic = locale === 'ar'

  function handleModeratorChange() {
    const nextIsModerator = !isModerator
    const confirmed = window.confirm(
      isArabic
        ? nextIsModerator
          ? 'هل تريد تعيين هذا العضو كمشرف؟'
          : 'هل تريد إزالة صلاحية الإشراف من هذا العضو؟'
        : nextIsModerator
          ? 'Make this member a moderator?'
          : 'Remove moderator privileges from this member?',
    )

    if (!confirmed) return

    setError('')

    startTransition(async () => {
      const result = await setConversationModerator(
        conversationId,
        memberId,
        nextIsModerator,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  function handleRemove() {
    const confirmed = window.confirm(
      isArabic
        ? 'هل أنت متأكد من إزالة هذا العضو من المجموعة؟'
        : 'Are you sure you want to remove this member from the group?',
    )

    if (!confirmed) return

    setError('')

    startTransition(async () => {
      const result = await removeConversationMember(
        conversationId,
        memberId,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className='mt-2 flex flex-wrap gap-2'>
      {canManageModerators ? (
        <button
          type='button'
          onClick={handleModeratorChange}
          disabled={isPending}
          className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isModerator
            ? isArabic
              ? 'إزالة الإشراف'
              : 'Remove moderator'
            : isArabic
              ? 'تعيين مشرف'
              : 'Make moderator'}
        </button>
      ) : null}

      <button
        type='button'
        onClick={handleRemove}
        disabled={isPending}
        className='rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {isArabic ? 'إزالة العضو' : 'Remove member'}
      </button>

      {error ? (
        <p className='basis-full text-xs text-red-600'>{error}</p>
      ) : null}
    </div>
  )
}
