'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toggleBookmark, toggleNotificationMute, reportContent, repostPost } from '@/app/[locale]/actions/community'

export default function PostActionsBar({
  postId,
  initialBookmarked,
  initialMuted,
}: {
  postId: string
  initialBookmarked: boolean
  initialMuted: boolean
}) {
  const locale = useLocale()
  const t = useTranslations('Community')
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [muted, setMuted] = useState(initialMuted)
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [message, setMessage] = useState('')

  async function handleBookmark() {
    setBookmarked(!bookmarked)
    await toggleBookmark('post', postId)
  }

  async function handleMute() {
    setMuted(!muted)
    await toggleNotificationMute(postId)
  }

  async function handleRepost() {
    await repostPost(postId)
    setShowShare(false)
    setMessage(t('reportSubmitted'))
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/${locale}/community#${postId}`
    navigator.clipboard.writeText(url)
    setMessage(t('linkCopied'))
    setShowShare(false)
  }

  async function handleReport() {
    await reportContent('post', postId, reportReason)
    setShowReport(false)
    setReportReason('')
    setMessage(t('reportSubmitted'))
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 relative">
      <button type="button" onClick={() => setShowShare(!showShare)} className="hover:text-primary-600">
        {t('shareButton')}
      </button>
      <button
        type="button"
        onClick={handleBookmark}
        className={bookmarked ? 'text-primary-600' : 'hover:text-primary-600'}
      >
        {bookmarked ? t('savedButton') : t('saveButton')}
      </button>
      <button
        type="button"
        onClick={handleMute}
        className={muted ? 'text-primary-600' : 'hover:text-primary-600'}
      >
        {muted ? t('mutedButton') : t('muteButton')}
      </button>
      <button type="button" onClick={() => setShowReport(!showReport)} className="hover:text-red-500">
        {t('reportButton')}
      </button>

      {message && <span className="text-primary-600">{message}</span>}

      {showShare && (
        <div className="absolute top-full mt-1 start-0 bg-white border border-gray-200 rounded-lg shadow-md p-2 flex flex-col gap-1 z-10 w-48">
          <button type="button" onClick={handleRepost} className="text-start text-sm py-1 hover:text-primary-600">
            {t('repostButton')}
          </button>
          <button type="button" onClick={handleCopyLink} className="text-start text-sm py-1 hover:text-primary-600">
            {t('copyLinkButton')}
          </button>
        </div>
      )}

      {showReport && (
        <div className="absolute top-full mt-1 start-0 bg-white border border-gray-200 rounded-lg shadow-md p-3 flex flex-col gap-2 z-10 w-64">
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t('reportReasonPlaceholder')}
            className="input text-sm min-h-16"
            dir="auto"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowReport(false)} className="flex-1 text-sm py-1 border border-gray-300 rounded-lg">
              {t('cancel')}
            </button>
            <button type="button" onClick={handleReport} className="flex-1 text-sm py-1 bg-red-500 text-white rounded-lg">
              {t('submitReport')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
