'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@imagekit/next'
import { updateProfileAvatar } from '@/app/[locale]/actions/profile'
import { makeMediaRef } from '@/lib/storage'

const MAX_SIZE = 5 * 1024 * 1024

export default function ProfileAvatarUpload() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="flex flex-col items-center gap-3">
      <label className="cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50">
        {uploading ? 'Uploading...' : 'Change profile picture'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              void handleFile(file)
            }
            e.currentTarget.value = ''
          }}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && (
        <p className="text-center text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
