'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGroupConversation } from '@/app/[locale]/actions/messaging'

type Props = {
  conversationId: string
  initialTitle: string
  initialDescription: string
  locale: string
}

export default function GroupInfoForm({
  conversationId,
  initialTitle,
  initialDescription,
  locale,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isArabic = locale === 'ar'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateGroupConversation(
        conversationId,
        title,
        description,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      setTitle(result.conversation.title ?? '')
      setDescription(result.conversation.description ?? '')
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4'
    >
      <div className='mb-4'>
        <h2 className='font-semibold text-gray-900'>
          {isArabic ? 'معلومات المجموعة' : 'Group information'}
        </h2>
        <p className='mt-1 text-xs text-gray-500'>
          {isArabic
            ? 'يمكنك تعديل اسم ووصف المجموعة.'
            : 'Update the group name and description.'}
        </p>
      </div>

      <label className='block'>
        <span className='text-sm font-medium text-gray-700'>
          {isArabic ? 'اسم المجموعة' : 'Group name'}
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          disabled={isPending}
          required
          className='mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60'
        />
      </label>

      <label className='mt-4 block'>
        <span className='text-sm font-medium text-gray-700'>
          {isArabic ? 'وصف المجموعة' : 'Group description'}
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={4}
          disabled={isPending}
          className='mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60'
        />
      </label>

      {error ? (
        <p className='mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className='mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700'>
          {isArabic ? 'تم حفظ التغييرات.' : 'Changes saved.'}
        </p>
      ) : null}

      <button
        type='submit'
        disabled={isPending}
        className='mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isPending
          ? isArabic
            ? 'جارٍ الحفظ...'
            : 'Saving...'
          : isArabic
            ? 'حفظ التغييرات'
            : 'Save changes'}
      </button>
    </form>
  )
}
