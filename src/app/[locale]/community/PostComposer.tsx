'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import ImageUpload from '@/components/auth/ImageUpload'
import { createPost } from '@/app/[locale]/actions/community'

export default function PostComposer({ canAddImage }: { canAddImage: boolean }) {
  const locale = useLocale()
  const t = useTranslations('KnowledgeAdmin')
  const router = useRouter()
  const [content, setContent] = useState('')
  const [imageRef, setImageRef] = useState('')
  const [showImage, setShowImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!content.trim()) {
      setError(locale === 'ar' ? 'اكتب محتوى المنشور' : 'Write something first')
      return
    }
    setSubmitting(true)
    setError('')

    const media = imageRef ? [{ type: 'image' as const, ref: imageRef }] : []
    const result = await createPost(content, media)

    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Error')
      return
    }
    setContent('')
    setImageRef('')
    setShowImage(false)
    router.refresh()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={locale === 'ar' ? 'شارك حاجة مع المجتمع...' : 'Share something with the community...'}
        className="input min-h-20" dir="auto"
      />

      {showImage && canAddImage && (
        <ImageUpload value={imageRef} onChange={setImageRef} folder="/community" scope="community" />
      )}

      <div className="flex justify-between items-center">
        {canAddImage ? (
          <button type="button" onClick={() => setShowImage(!showImage)} className="text-sm text-primary-600">
            {showImage ? (locale === 'ar' ? 'إخفاء الصورة' : 'Hide image') : (locale === 'ar' ? '+ صورة' : '+ Image')}
          </button>
        ) : (
          <span className="text-sm text-gray-400">{t('imageIsPaidFeature')}</span>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="btn-primary w-auto px-6 disabled:opacity-60"
        >
          {locale === 'ar' ? 'نشر' : 'Post'}
        </button>
      </div>
    </div>
  )
}
