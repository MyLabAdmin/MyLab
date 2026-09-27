'use client'

import { useState } from 'react'
import PostMediaCapacity from '../../PostMediaCapacity'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import MultiImageUpload from '../../MultiImageUpload'
import { editPost } from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'

export default function EditPostForm({
  postId,
  initialContent,
  initialImageRefs,
}: {
  postId: string
  initialContent: string
  initialImageRefs: string[]
}) {
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()

  const [content, setContent] = useState(initialContent)
  const [imageRefs, setImageRefs] = useState<string[]>(initialImageRefs)
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
    const result = await editPost(postId, content, media)

    setSubmitting(false)
    if (!result.success) {
      setError(locale === 'ar' ? 'حدث خطأ' : 'Something went wrong')
      return
    }
    showToast(locale === 'ar' ? 'تم حفظ التعديل ✅' : 'Changes saved ✅')
    router.push('/community')
  }

  return (
    <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-4 h-screen flex flex-col gap-3 overflow-hidden">
      <h1 className="text-lg font-bold text-primary-700">
        {locale === 'ar' ? 'تعديل المنشور' : 'Edit Post'}
      </h1>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input flex-1 resize-none"
        dir="auto"
        autoFocus
      />

      <PostMediaCapacity />

      <MultiImageUpload
        refs={imageRefs}
        onChange={setImageRefs}
        folder="/community"
        scope="community"
      />

      <button type="button" disabled={submitting} onClick={handleSubmit} className="btn-primary disabled:opacity-60">
        {locale === 'ar' ? 'حفظ التعديل' : 'Save Changes'}
      </button>
    </div>
  )
}
