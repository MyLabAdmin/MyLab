'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/Toast'
import {
  toggleNotificationMute,
  reportContent,
  unsaveBookmark,
  deletePost,
} from '@/app/[locale]/actions/community'
import { BookmarkIcon, LinkIcon, FlagIcon, BellIcon, EditIcon, TrashIcon, CommentIcon, DotsIcon, RepostIcon } from '@/components/community/ActionIcons'
import SaveModal from './SaveModal'
import ShareModal from './ShareModal'

export default function PostActionsBar({
  postId,
  authorId,
  currentUserId,
  isAdmin,
  initialBookmarked,
  initialMuted,
  commentCount,
  onToggleComments,
  onEditRequest,
  onDeleted,
}: {
  postId: string
  authorId: string
  currentUserId?: string
  isAdmin: boolean
  initialBookmarked: boolean
  initialMuted: boolean
  commentCount: number
  onToggleComments: () => void
  onEditRequest: () => void
  onDeleted: () => void
}) {
  const locale = useLocale()
  const t = useTranslations('Community')
  const { showToast } = useToast()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [muted, setMuted] = useState(initialMuted)
  const [showSave, setShowSave] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const isOwner = currentUserId === authorId
  const canManage = isOwner || isAdmin

  async function handleSaveClick() {
    if (bookmarked) {
      await unsaveBookmark('post', postId)
      setBookmarked(false)
      showToast(locale === 'ar' ? 'تم إلغاء الحفظ' : 'Removed from saved')
    } else {
      setShowSave(true)
    }
  }

  async function handleMute() {
    setMuted(!muted)
    setShowMenu(false)
    await toggleNotificationMute(postId)
    showToast(!muted ? t('mutedButton') : (locale === 'ar' ? 'تم إلغاء الكتم' : 'Unmuted'))
  }

  function handleCopyLink() {
    setShowMenu(false)
    const url = `${window.location.origin}/${locale}/community/post/${postId}`
    navigator.clipboard.writeText(url)
    showToast(t('linkCopied'))
  }

  async function handleReport() {
    await reportContent('post', postId, reportReason)
    setShowReport(false)
    setShowMenu(false)
    setReportReason('')
    showToast(t('reportSubmitted'))
  }

  async function handleDelete() {
    setShowMenu(false)
    await deletePost(postId)
    onDeleted()
  }

  return (
    <div className="flex items-center gap-4 relative">
      <button type="button" onClick={onToggleComments} className="flex items-center gap-1 text-gray-500 hover:text-primary-600">
        <CommentIcon className="w-5 h-5" />
        {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
      </button>

      <button
        type="button"
        onClick={handleSaveClick}
        className={bookmarked ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'}
      >
        <BookmarkIcon className="w-5 h-5" filled={bookmarked} />
      </button>

      <button type="button" onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-primary-600 ms-auto">
        <DotsIcon className="w-5 h-5" />
      </button>

      {showMenu && (
        <div className="absolute top-full end-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md p-1 flex flex-col gap-0.5 z-10 w-48">
          <button
            type="button"
            onClick={() => { setShowMenu(false); setShowShare(true) }}
            className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-primary-50 text-start"
          >
            <RepostIcon className="w-4 h-4" /> {t('repostButton')}
          </button>
          <button type="button" onClick={handleCopyLink} className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-primary-50 text-start">
            <LinkIcon className="w-4 h-4" /> {t('copyLinkButton')}
          </button>
          <button type="button" onClick={handleMute} className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-primary-50 text-start">
            <BellIcon className="w-4 h-4" muted={muted} /> {muted ? t('mutedButton') : t('muteButton')}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => { setShowMenu(false); onEditRequest() }}
              className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-primary-50 text-start"
            >
              <EditIcon className="w-4 h-4" /> {locale === 'ar' ? 'تعديل' : 'Edit'}
            </button>
          )}
          {canManage && (
            <button type="button" onClick={handleDelete} className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-red-50 text-red-500 text-start">
              <TrashIcon className="w-4 h-4" /> {locale === 'ar' ? 'حذف' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowMenu(false); setShowReport(true) }}
            className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-red-50 text-red-500 text-start"
          >
            <FlagIcon className="w-4 h-4" /> {t('reportButton')}
          </button>
        </div>
      )}

      {showSave && (
        <SaveModal
          targetType="post"
          targetId={postId}
          onClose={() => setShowSave(false)}
          onSaved={() => setBookmarked(true)}
        />
      )}

      {showShare && <ShareModal postId={postId} onClose={() => setShowShare(false)} />}

      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t('reportReasonPlaceholder')}
              className="input text-sm min-h-20"
              dir="auto"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReport(false)} className="flex-1 text-sm py-2 border border-gray-300 rounded-lg">
                {t('cancel')}
              </button>
              <button type="button" onClick={handleReport} className="flex-1 text-sm py-2 bg-red-500 text-white rounded-lg">
                {t('submitReport')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
