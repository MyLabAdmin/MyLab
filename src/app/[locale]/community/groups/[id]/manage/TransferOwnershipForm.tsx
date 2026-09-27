'use client'

import { useEffect, useState } from 'react'

import {
  getGroupMembers,
  transferGroupOwnership,
} from '@/app/[locale]/actions/groups'

type Member = {
  userId: string
  name: string
  avatarUrl: string | null
  role: string
}

export default function TransferOwnershipForm({
  groupId,
  locale,
  onClose,
}: {
  groupId: string
  locale: string
  onClose: () => void
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getGroupMembers(groupId)

        if (!cancelled) {
          setMembers(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : locale === 'ar'
                ? 'تعذر تحميل الأعضاء'
                : 'Failed to load members',
          )
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
  }, [groupId, locale])

  async function handleTransfer() {
    if (!selectedUserId || submitting) return

    const confirmed = window.confirm(
      locale === 'ar'
        ? 'هل أنت متأكد من نقل ملكية المجموعة؟ لن تعود مالكًا للمجموعة بعد النقل.'
        : 'Are you sure you want to transfer ownership? You will no longer be the group owner.',
    )

    if (!confirmed) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await transferGroupOwnership(
        groupId,
        selectedUserId,
      )

      if (!result.success) {
        setError(result.error ?? (locale === 'ar' ? 'تعذر نقل الملكية' : 'Failed to transfer ownership'))
        return
      }

      onClose()
      window.location.reload()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : locale === 'ar'
            ? 'تعذر نقل الملكية'
            : 'Failed to transfer ownership',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <p className="mb-4 text-sm text-gray-500">
        {locale === 'ar'
          ? 'اختر عضوًا نشطًا لنقل ملكية المجموعة إليه.'
          : 'Choose an active member to become the new group owner.'}
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
          {locale === 'ar'
            ? 'لا يوجد أعضاء متاحون لنقل الملكية إليهم.'
            : 'No eligible members are available.'}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {locale === 'ar' ? 'المالك الجديد' : 'New owner'}
          </label>

          <select
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(event.target.value)
            }
            disabled={submitting}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary-500"
          >
            <option value="">
              {locale === 'ar' ? 'اختر عضوًا' : 'Select a member'}
            </option>

            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleTransfer}
            disabled={!selectedUserId || submitting}
            className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? locale === 'ar'
                ? 'جارٍ النقل...'
                : 'Transferring...'
              : locale === 'ar'
                ? 'نقل الملكية'
                : 'Transfer ownership'}
          </button>
        </div>
      )}
    </div>
  )
}
