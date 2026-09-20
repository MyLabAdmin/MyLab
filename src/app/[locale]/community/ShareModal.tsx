'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { repostPost } from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'

export default function ShareModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const locale = useLocale()
  const { showToast } = useToast()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleShare() {
    setSubmitting(true)
    await repostPost(postId, text)
    setSubmitting(false)
    showToast(locale === 'ar' ? 'تم إعادة النشر ✅' : 'Reposted ✅')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-800">{locale === 'ar' ? 'مشاركة' : 'Share'}</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={locale === 'ar' ? 'أضف تعليقك (اختياري)...' : 'Add your thoughts (optional)...'}
          className="input min-h-20"
          dir="auto"
        />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 text-sm py-2 border border-gray-300 rounded-lg">
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleShare}
            className="flex-1 text-sm py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60"
          >
            {locale === 'ar' ? 'نشر' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}
