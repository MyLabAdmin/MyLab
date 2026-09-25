'use client'

import { leaveConversation } from '@/app/[locale]/actions/messaging'
import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'

export default function LeaveConversationButton({
  conversationId,
  locale,
  isOwner,
}: {
  conversationId: string
  locale: string
  isOwner: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isOwner) return null

  async function handleLeave() {
    const confirmed = window.confirm(locale === 'ar' ? 'هل تريد مغادرة هذه المجموعة؟' : 'Do you want to leave this group?')
    if (confirmed === false) return
    setLoading(true)
    setError(null)
    const result = await leaveConversation(conversationId)
    if (result.success === true) {
      router.push('/community/messages')
      router.refresh()
      return
    }
    setError(result.error)
    setLoading(false)
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
      <button type="button" onClick={handleLeave} disabled={loading} className="w-full rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? (locale === 'ar' ? 'جارٍ المغادرة...' : 'Leaving...') : (locale === 'ar' ? 'مغادرة المجموعة' : 'Leave group')}
      </button>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  )
}