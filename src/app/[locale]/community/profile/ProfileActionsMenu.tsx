'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/Toast'
import { reportContent } from '@/app/[locale]/actions/community'
import { blockUser } from '@/app/[locale]/actions/friends'
import { DotsIcon, FlagIcon } from '@/components/community/ActionIcons'

export default function ProfileActionsMenu({
  userId,
}: {
  userId: string
}) {
  const locale = useLocale()
  const t = useTranslations('Community')
  const { showToast } = useToast()
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleReport() {
    setIsPending(true)

    try {
      const result = await reportContent('profile', userId, reportReason)

      if (!result.success) {
        showToast(
          locale === 'ar'
            ? 'تعذر إرسال البلاغ'
            : 'Could not submit report',
        )
        return
      }

      setShowReport(false)
      setShowMenu(false)
      setReportReason('')
      showToast(t('reportSubmitted'))
    } finally {
      setIsPending(false)
    }
  }

  async function handleBlock() {
    const confirmed = window.confirm(
      locale === 'ar'
        ? 'هل تريد حظر هذا الشخص؟'
        : 'Do you want to block this person?',
    )

    if (!confirmed) return

    setIsPending(true)

    try {
      const result = await blockUser(userId)

      if (!result.success) {
        showToast(
          locale === 'ar'
            ? 'تعذر حظر هذا الشخص'
            : 'Could not block this person',
        )
        return
      }

      window.location.href = '/' + locale + '/community/friends'
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setShowMenu(!showMenu)}
        aria-label={locale === 'ar' ? 'المزيد' : 'More'}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        <DotsIcon className="h-5 w-5" />
      </button>

      {showMenu ? (
        <div className="absolute end-0 top-full z-20 mt-1 flex w-48 flex-col gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
          <button
            type="button"
            onClick={() => {
              setShowMenu(false)
              setShowReport(true)
            }}
            className="flex items-center gap-2 rounded px-2 py-2 text-start text-sm text-red-500 hover:bg-red-50"
          >
            <FlagIcon className="h-4 w-4" />
            {t('reportButton')}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleBlock}
            className="flex items-center gap-2 rounded px-2 py-2 text-start text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            {locale === 'ar' ? 'حظر' : 'Block'}
          </button>
        </div>
      ) : null}

      {showReport ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setShowReport(false)}
        >
          <div
            className="flex w-full flex-col gap-2 rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t('reportReasonPlaceholder')}
              className="input min-h-20 text-sm"
              dir="auto"
              disabled={isPending}
            />

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm disabled:opacity-50"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleReport}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm text-white disabled:opacity-50"
              >
                {t('submitReport')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
