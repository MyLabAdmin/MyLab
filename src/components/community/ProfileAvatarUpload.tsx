'use client'

import { useState } from 'react'
import MessageMediaLightbox from '@/app/[locale]/community/messages/[id]/MessageMediaLightbox'
import { useRouter } from 'next/navigation'
import { upload } from '@imagekit/next'
import {
  deleteProfileAvatar,
  updateProfileAvatar,
} from '@/app/[locale]/actions/profile'
import { makeMediaRef } from '@/lib/storage'

const MAX_SIZE = 5 * 1024 * 1024

export default function ProfileAvatarUpload({
  avatarUrl,
  avatarFileName = 'profile-avatar',
  isArabic = false,
}: {
  avatarUrl?: string | null
  avatarFileName?: string
  isArabic?: boolean
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showViewer, setShowViewer] = useState(false)

  const hasAvatar = Boolean(avatarUrl)

  async function handleFile(file: File) {
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setUploading(true)

    try {
      const authUrl = new URL(
        '/api/upload-auth/imagekit',
        window.location.origin,
      )
      authUrl.searchParams.set('feature', 'profile_avatar')

      const authRes = await fetch(authUrl.toString())

      if (!authRes.ok) {
        throw new Error('Upload authorization failed.')
      }

      const auth = await authRes.json()

      const result = await upload({
        file,
        fileName: file.name,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
        folder: '/profile-avatars',
        isPrivateFile: true,
        useUniqueFileName: true,
      })

      const path = result.filePath as string

      if (!path) {
        throw new Error('Upload did not return a file path.')
      }

      const mediaRef = makeMediaRef('imagekit', path)

      const saveResult = await updateProfileAvatar(mediaRef)

      if (!saveResult.success) {
        throw new Error(saveResult.error)
      }

      router.refresh()

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!hasAvatar || deleting) return

    const confirmed = window.confirm(
      isArabic
        ? 'هل تريد حذف صورة الملف الشخصي؟'
        : 'Do you want to delete your profile picture?',
    )

    if (!confirmed) return

    setError('')
    setDeleting(true)

    try {
      const result = await deleteProfileAvatar()

      if (!result.success) {
        throw new Error(result.error)
      }

      setShowMenu(false)
      router.refresh()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isArabic
            ? 'تعذر حذف الصورة.'
            : 'Failed to delete the image.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setShowMenu((current) => !current)}
        disabled={uploading || deleting}
        className="rounded-full border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={showMenu}
      >
        {deleting
          ? isArabic
            ? 'جارٍ الحذف...'
            : 'Deleting...'
          : uploading
            ? isArabic
              ? 'جارٍ الرفع...'
              : 'Uploading...'
            : isArabic
              ? 'تعديل الصورة'
              : 'Edit picture'}
      </button>

      {showMenu ? (
        <div
          role="menu"
          className="absolute top-full z-30 mt-2 min-w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!hasAvatar}
            onClick={() => {
              setShowMenu(false)
              setShowViewer(true)
            }}
            className="block w-full rounded-lg px-3 py-2 text-start transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isArabic ? 'عرض الصورة' : 'View picture'}
          </button>

          <label
            role="menuitem"
            className="block cursor-pointer rounded-lg px-3 py-2 text-start transition hover:bg-gray-50"
          >
            {isArabic ? 'تعديل الصورة' : 'Edit picture'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) {
                  setShowMenu(false)
                  void handleFile(file)
                }

                e.currentTarget.value = ''
              }}
              disabled={uploading || deleting}
              className="hidden"
            />
          </label>

          <button
            type="button"
            role="menuitem"
            disabled={!hasAvatar || deleting}
            onClick={() => void handleDelete()}
            className="block w-full rounded-lg px-3 py-2 text-start text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isArabic ? 'حذف الصورة' : 'Delete picture'}
          </button>
        </div>
      ) : null}

      {error && (
        <p className="text-center text-xs text-red-500">
          {error}
        </p>
      )}

      {showViewer && avatarUrl ? (
        <MessageMediaLightbox
          images={[
            {
              id: 'profile-avatar',
              url: avatarUrl,
              fileName: avatarFileName,
            },
          ]}
          initialIndex={0}
          isArabic={isArabic}
          onClose={() => setShowViewer(false)}
        />
      ) : null}
    </div>
  )
}
