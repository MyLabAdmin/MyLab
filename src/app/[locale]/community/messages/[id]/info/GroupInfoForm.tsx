'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGroupConversation } from '@/app/[locale]/actions/messaging'
import Avatar from '@/components/community/Avatar'
import { createClient } from '@/lib/supabase/client'

type Props = {
  conversationId: string
  initialTitle: string
  initialDescription: string
  initialAvatarUrl: string | null
  locale: string
}

const BUCKET = 'group-avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])

export default function GroupInfoForm({
  conversationId,
  initialTitle,
  initialDescription,
  initialAvatarUrl,
  locale,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isArabic = locale === 'ar'

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    setError(null)
    setSaved(false)
    setSelectedFileName(null)

    if (!file) {
      return
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError(
        isArabic
          ? 'الصورة يجب أن تكون PNG أو JPEG أو WebP.'
          : 'Image must be PNG, JPEG, or WebP.',
      )
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        isArabic
          ? 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت.'
          : 'Image size must not exceed 5 MB.',
      )
      event.target.value = ''
      return
    }

    setSelectedFileName(file.name)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      let uploadedPath: string | null = null
      let nextAvatarUrl = avatarUrl

      try {
        const file = fileInputRef.current?.files?.[0]

        if (file) {
          setUploading(true)

          const extension =
            file.type === 'image/png'
              ? 'png'
              : file.type === 'image/webp'
                ? 'webp'
                : 'jpg'

          const path =
            conversationId + '/' + crypto.randomUUID() + '.' + extension

          const supabase = createClient()

          const upload = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false,
            })

          if (upload.error) {
            throw new Error(upload.error.message)
          }

          uploadedPath = path

          const publicUrl = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path)

          nextAvatarUrl = publicUrl.data.publicUrl
        }

        const result = await updateGroupConversation(
          conversationId,
          title,
          description,
          nextAvatarUrl ?? undefined,
        )

        if (!result.success) {
          if (uploadedPath) {
            const supabase = createClient()
            await supabase.storage
              .from(BUCKET)
              .remove([uploadedPath])
          }

          setError(result.error)
          return
        }

        const oldAvatarUrl = avatarUrl

        setTitle(result.conversation.title ?? '')
        setDescription(result.conversation.description ?? '')
        setAvatarUrl(result.conversation.avatar_url ?? null)
        setSelectedFileName(null)
        setSaved(true)

        if (
          uploadedPath &&
          oldAvatarUrl &&
          oldAvatarUrl !== result.conversation.avatar_url
        ) {
          try {
            const oldUrl = new URL(oldAvatarUrl)
            const marker =
              '/storage/v1/object/public/' + BUCKET + '/'

            const markerIndex = oldUrl.pathname.indexOf(marker)

            if (markerIndex !== -1) {
              const oldPath = decodeURIComponent(
                oldUrl.pathname.slice(
                  markerIndex + marker.length,
                ),
              )

              if (oldPath) {
                const supabase = createClient()
                await supabase.storage
                  .from(BUCKET)
                  .remove([oldPath])
              }
            }
          } catch {
            // The new image and database update already succeeded.
          }
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        router.refresh()
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : isArabic
              ? 'تعذر رفع صورة المجموعة.'
              : 'Failed to upload the group image.',
        )
      } finally {
        setUploading(false)
      }
    })
  }

  const busy = isPending || uploading

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
            ? 'يمكنك تعديل اسم ووصف وصورة المجموعة.'
            : 'Update the group name, description, and image.'}
        </p>
      </div>

      <div className='mb-4 flex items-center gap-4 rounded-2xl bg-white p-3'>
        <Avatar
          name={title || (isArabic ? 'محادثة جماعية' : 'Group conversation')}
          avatarUrl={avatarUrl}
          size='lg'
        />

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-gray-800'>
            {isArabic ? 'صورة المجموعة' : 'Group image'}
          </p>

          <p className='mt-1 text-xs leading-5 text-gray-500'>
            {isArabic
              ? 'PNG أو JPEG أو WebP، بحد أقصى 5 ميجابايت.'
              : 'PNG, JPEG, or WebP, up to 5 MB.'}
          </p>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/png,image/jpeg,image/webp'
            onChange={handleFileChange}
            disabled={busy}
            className='mt-3 block w-full text-xs text-gray-500 file:me-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:font-medium file:text-primary-700 hover:file:bg-primary-100'
          />

          {selectedFileName ? (
            <p className='mt-2 truncate text-xs text-gray-500'>
              {selectedFileName}
            </p>
          ) : null}
        </div>
      </div>

      <label className='block'>
        <span className='text-sm font-medium text-gray-700'>
          {isArabic ? 'اسم المجموعة' : 'Group name'}
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          disabled={busy}
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
          disabled={busy}
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
        disabled={busy}
        className='mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {busy
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
