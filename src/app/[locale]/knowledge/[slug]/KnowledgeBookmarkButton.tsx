'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useToast } from '@/components/ui/Toast'
import { unsaveBookmark } from '@/app/[locale]/actions/community'
import { BookmarkIcon } from '@/components/community/ActionIcons'
import SaveModal from '@/app/[locale]/community/SaveModal'

export default function KnowledgeBookmarkButton({
  itemId,
  initialBookmarked,
}: {
  itemId: string
  initialBookmarked: boolean
}) {
  const locale = useLocale()
  const { showToast } = useToast()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [showSave, setShowSave] = useState(false)

  async function handleClick() {
    if (bookmarked) {
      const result = await unsaveBookmark('knowledge_item', itemId)

      if (!result.success) {
        showToast(
          locale === 'ar'
            ? 'تعذر إلغاء الحفظ'
            : 'Could not remove bookmark',
        )
        return
      }

      setBookmarked(false)
      showToast(locale === 'ar' ? 'تم إلغاء الحفظ' : 'Removed from saved')
      return
    }

    setShowSave(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          bookmarked
            ? 'text-primary-600'
            : 'text-gray-500 hover:text-primary-600'
        }
        aria-label={locale === 'ar' ? 'حفظ المعرفة' : 'Save knowledge'}
      >
        <BookmarkIcon className="w-5 h-5" filled={bookmarked} />
      </button>

      {showSave && (
        <SaveModal
          targetType="knowledge_item"
          targetId={itemId}
          onClose={() => setShowSave(false)}
          onSaved={() => setBookmarked(true)}
        />
      )}
    </>
  )
}
