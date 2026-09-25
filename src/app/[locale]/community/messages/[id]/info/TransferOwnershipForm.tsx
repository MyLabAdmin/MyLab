'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { transferConversationOwnership } from '@/app/[locale]/actions/messaging'

type Member = {
  user_id: string
  role: string
  display_name: string | null
  avatar_url: string | null
}

type Props = {
  conversationId: string
  locale: string
  currentUserId: string
  members: Member[]
}

export default function TransferOwnershipForm({
  conversationId,
  locale,
  currentUserId,
  members,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newOwnerId, setNewOwnerId] = useState('')
  const [previousOwnerRole, setPreviousOwnerRole] = useState<'member' | 'moderator'>('member')
  const [canEditInfo, setCanEditInfo] = useState(false)
  const [canAddMembers, setCanAddMembers] = useState(false)
  const [canRemoveMembers, setCanRemoveMembers] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const candidates = members.filter(
    (member) => member.user_id !== currentUserId && member.role !== 'owner',
  )

  const isArabic = locale === 'ar'

  function handleTransfer() {
    if (!newOwnerId) {
      setError(isArabic ? 'اختر العضو الجديد أولاً.' : 'Choose the new owner first.')
      return
    }

    const confirmed = window.confirm(
      isArabic
        ? 'هل أنت متأكد من نقل ملكية المجموعة؟ لن تعود مالك المجموعة بعد هذه العملية.'
        : 'Are you sure you want to transfer ownership? You will no longer be the group owner.',
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    startTransition(async () => {
      const result = await transferConversationOwnership(
        conversationId,
        newOwnerId,
        previousOwnerRole,
        {
          canEditInfo,
          canAddMembers,
          canRemoveMembers,
        },
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess(
        isArabic
          ? 'تم نقل ملكية المجموعة بنجاح.'
          : 'Group ownership transferred successfully.',
      )
      setNewOwnerId('')
      router.refresh()
    })
  }

  return (
    <section className='mt-4 rounded-2xl border border-gray-200 bg-white p-4'>
      <div className='mb-4'>
        <h2 className='text-base font-bold text-gray-900'>
          {isArabic ? 'نقل ملكية المجموعة' : 'Transfer group ownership'}
        </h2>
        <p className='mt-1 text-sm leading-6 text-gray-500'>
          {isArabic
            ? 'اختر عضواً لنقل الملكية إليه، ثم حدد دورك بعد النقل.'
            : 'Choose a member to become the new owner, then choose your role after the transfer.'}
        </p>
      </div>

      <label className='block'>
        <span className='mb-2 block text-sm font-medium text-gray-700'>
          {isArabic ? 'المالك الجديد' : 'New owner'}
        </span>

        <select
          value={newOwnerId}
          onChange={(event) => setNewOwnerId(event.target.value)}
          disabled={isPending || candidates.length === 0}
          className='w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-primary-500'
        >
          <option value=''>
            {isArabic ? 'اختر عضواً' : 'Select a member'}
          </option>

          {candidates.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name || (isArabic ? 'مستخدم' : 'User')}
              {member.role === 'moderator'
                ? isArabic
                  ? ' — مشرف'
                  : ' — Moderator'
                : ''}
            </option>
          ))}
        </select>
      </label>

      <div className='mt-4'>
        <p className='mb-2 text-sm font-medium text-gray-700'>
          {isArabic ? 'دورك بعد نقل الملكية' : 'Your role after transfer'}
        </p>

        <div className='grid gap-2 sm:grid-cols-2'>
          <label className='flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3'>
            <input
              type='radio'
              name='previous-owner-role'
              value='member'
              checked={previousOwnerRole === 'member'}
              onChange={() => setPreviousOwnerRole('member')}
              disabled={isPending}
            />
            <span className='text-sm text-gray-800'>
              {isArabic ? 'عضو' : 'Member'}
            </span>
          </label>

          <label className='flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3'>
            <input
              type='radio'
              name='previous-owner-role'
              value='moderator'
              checked={previousOwnerRole === 'moderator'}
              onChange={() => setPreviousOwnerRole('moderator')}
              disabled={isPending}
            />
            <span className='text-sm text-gray-800'>
              {isArabic ? 'مشرف' : 'Moderator'}
            </span>
          </label>
        </div>
      </div>

      {previousOwnerRole === 'moderator' ? (
        <div className='mt-4 space-y-2 rounded-xl bg-gray-50 p-3'>
          <p className='mb-2 text-sm font-medium text-gray-700'>
            {isArabic ? 'صلاحياتك كمشرف' : 'Your moderator permissions'}
          </p>

          <label className='flex cursor-pointer items-center gap-3 rounded-lg bg-white p-2'>
            <input
              type='checkbox'
              checked={canEditInfo}
              onChange={(event) => setCanEditInfo(event.target.checked)}
              disabled={isPending}
            />
            <span className='text-sm text-gray-700'>
              {isArabic ? 'تعديل معلومات المجموعة' : 'Edit group info'}
            </span>
          </label>

          <label className='flex cursor-pointer items-center gap-3 rounded-lg bg-white p-2'>
            <input
              type='checkbox'
              checked={canAddMembers}
              onChange={(event) => setCanAddMembers(event.target.checked)}
              disabled={isPending}
            />
            <span className='text-sm text-gray-700'>
              {isArabic ? 'إضافة أعضاء' : 'Add members'}
            </span>
          </label>

          <label className='flex cursor-pointer items-center gap-3 rounded-lg bg-white p-2'>
            <input
              type='checkbox'
              checked={canRemoveMembers}
              onChange={(event) => setCanRemoveMembers(event.target.checked)}
              disabled={isPending}
            />
            <span className='text-sm text-gray-700'>
              {isArabic ? 'إزالة أعضاء' : 'Remove members'}
            </span>
          </label>
        </div>
      ) : null}

      {error ? (
        <p className='mt-3 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700'>
          {error}
        </p>
      ) : null}

      <button
        type='button'
        onClick={handleTransfer}
        disabled={isPending || !newOwnerId || candidates.length === 0}
        className='mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {isPending
          ? isArabic
            ? 'جاري نقل الملكية...'
            : 'Transferring ownership...'
          : isArabic
            ? 'نقل الملكية'
            : 'Transfer ownership'}
      </button>
    </section>
  )
}
