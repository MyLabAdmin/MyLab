'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import ImageUpload from '@/components/auth/ImageUpload'
import { createGroup } from '@/app/[locale]/actions/groups'
import { useToast } from '@/components/ui/Toast'

export default function NewGroupForm() {
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverRef, setCoverRef] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [joinPolicy, setJoinPolicy] = useState<'instant' | 'approval'>('instant')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) {
      setError(locale === 'ar' ? 'اكتب اسم المجموعة' : 'Enter a group name')
      return
    }
    setSubmitting(true)
    setError('')

    const result = await createGroup({ name, description, coverImageRef: coverRef, privacy, joinPolicy })

    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Error')
      return
    }
    showToast(locale === 'ar' ? 'تم إنشاء المجموعة ✅' : 'Group created ✅')
    router.push(`/community/groups/${result.groupId}`)
  }

  return (
    <div className="max-w-md sm:max-w-lg mx-auto p-4 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-primary-700">
        {locale === 'ar' ? 'مجموعة جديدة' : 'New Group'}
      </h1>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={locale === 'ar' ? 'اسم المجموعة' : 'Group name'}
        className="input"
        dir="auto"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={locale === 'ar' ? 'وصف المجموعة' : 'Group description'}
        className="input min-h-24"
        dir="auto"
      />

      <div>
        <label className="text-sm font-medium text-gray-700">
          {locale === 'ar' ? 'صورة الغلاف' : 'Cover Image'}
        </label>
        <ImageUpload value={coverRef} onChange={setCoverRef} folder="/groups" scope="groups" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPrivacy('public')}
            className={`flex-1 rounded-lg py-2 text-sm ${privacy === 'public' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
          >
            {locale === 'ar' ? 'عامة' : 'Public'}
          </button>
          <button
            type="button"
            onClick={() => setPrivacy('private')}
            className={`flex-1 rounded-lg py-2 text-sm ${privacy === 'private' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
          >
            {locale === 'ar' ? 'خاصة' : 'Private'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {locale === 'ar' ? 'سياسة الانضمام' : 'Join Policy'}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJoinPolicy('instant')}
            className={`flex-1 rounded-lg py-2 text-sm ${joinPolicy === 'instant' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
          >
            {locale === 'ar' ? 'فوري' : 'Instant'}
          </button>
          <button
            type="button"
            onClick={() => setJoinPolicy('approval')}
            className={`flex-1 rounded-lg py-2 text-sm ${joinPolicy === 'approval' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
          >
            {locale === 'ar' ? 'يحتاج موافقة' : 'Requires approval'}
          </button>
        </div>
      </div>

      <button type="button" disabled={submitting} onClick={handleSubmit} className="btn-primary disabled:opacity-60">
        {locale === 'ar' ? 'إنشاء' : 'Create'}
      </button>
    </div>
  )
}
