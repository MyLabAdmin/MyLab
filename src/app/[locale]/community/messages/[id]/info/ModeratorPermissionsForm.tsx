'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateModeratorPermissions } from '@/app/[locale]/actions/messaging'

type Props = {
  conversationId: string
  memberId: string
  initialPermissions: {
    canEditInfo: boolean
    canAddMembers: boolean
    canRemoveMembers: boolean
  }
  locale: string
}

export default function ModeratorPermissionsForm({
  conversationId,
  memberId,
  initialPermissions,
  locale,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [permissions, setPermissions] = useState(initialPermissions)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isArabic = locale === 'ar'

  function handleSave() {
    setError('')
    setSuccess('')

    startTransition(async () => {
      const result = await updateModeratorPermissions(
        conversationId,
        memberId,
        permissions,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess(isArabic ? 'تم حفظ الصلاحيات' : 'Permissions saved')
      router.refresh()
    })
  }

  return (
    <div className='mt-3 rounded-2xl border border-gray-200 bg-white p-3'>
      <p className='mb-2 text-sm font-semibold text-gray-800'>
        {isArabic ? 'صلاحيات المشرف' : 'Moderator permissions'}
      </p>

      <div className='space-y-2'>
        <label className='flex items-center gap-2 text-sm text-gray-700'>
          <input
            type='checkbox'
            checked={permissions.canEditInfo}
            onChange={(event) =>
              setPermissions((current) => ({
                ...current,
                canEditInfo: event.target.checked,
              }))
            }
            disabled={isPending}
          />
          {isArabic ? 'تعديل معلومات المجموعة' : 'Edit group info'}
        </label>

        <label className='flex items-center gap-2 text-sm text-gray-700'>
          <input
            type='checkbox'
            checked={permissions.canAddMembers}
            onChange={(event) =>
              setPermissions((current) => ({
                ...current,
                canAddMembers: event.target.checked,
              }))
            }
            disabled={isPending}
          />
          {isArabic ? 'إضافة أعضاء' : 'Add members'}
        </label>

        <label className='flex items-center gap-2 text-sm text-gray-700'>
          <input
            type='checkbox'
            checked={permissions.canRemoveMembers}
            onChange={(event) =>
              setPermissions((current) => ({
                ...current,
                canRemoveMembers: event.target.checked,
              }))
            }
            disabled={isPending}
          />
          {isArabic ? 'إزالة أعضاء' : 'Remove members'}
        </label>
      </div>

      <button
        type='button'
        onClick={handleSave}
        disabled={isPending}
        className='mt-3 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {isPending
          ? isArabic
            ? 'جارٍ الحفظ...'
            : 'Saving...'
          : isArabic
            ? 'حفظ الصلاحيات'
            : 'Save permissions'}
      </button>

      {error ? (
        <p className='mt-2 text-xs text-red-600'>{error}</p>
      ) : null}

      {success ? (
        <p className='mt-2 text-xs text-green-600'>{success}</p>
      ) : null}
    </div>
  )
}
