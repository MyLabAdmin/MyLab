'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import MultiImageUpload from '../MultiImageUpload'
import { createPost } from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'

export default function NewPostForm({ canAddImage, groupId }: { canAddImage: boolean; groupId?: string }) {
  const locale = useLocale()
  const t = useTranslations('KnowledgeAdmin')
  const router = useRouter()
  const { showToast } = useToast()

  const [content, setContent] = useState('')
  const [imageRefs, setImageRefs] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!content.trim()) {
      setError(locale === 'ar' ? 'اكتب محتوى المنشور' : 'Write something first')
      return
    }
    setSubmitting(true)
    setError('')

    const media = imageRefs.map((ref) => ({ type: 'image' as const, ref }))
    const result = await createPost(content, media, groupId ?? null)

    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Error')
      return
    }
    showToast(locale === 'ar' ? 'تم النشر ✅' : 'Posted ✅')
    router.push(groupId ? `/community/groups/${groupId}` : '/community')
  }

  return (
    <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-4 h-screen flex flex-col gap-3 overflow-hidden">
      <h1 className="text-lg font-bold text-primary-700">
        {locale === 'ar' ? 'منشور جديد' : 'New Post'}
      </h1>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={locale === 'ar' ? 'شارك حاجة مع المجتمع...' : 'Share something with the community...'}
        className="input flex-1 resize-none"
        dir="auto"
        autoFocus
      />

      {canAddImage ? (
        <MultiImageUpload refs={imageRefs} onChange={setImageRefs} folder="/community" scope="community" />
      ) : (
        <span className="text-sm text-gray-400">{t('imageIsPaidFeature')}</span>
      )}

      <button type="button" disabled={submitting} onClick={handleSubmit} className="btn-primary disabled:opacity-60">
        {locale === 'ar' ? 'نشر' : 'Post'}
      </button>
    </div>
  )
}
