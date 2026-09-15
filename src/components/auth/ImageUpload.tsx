'use client'

import { useState } from 'react'
import { upload } from '@imagekit/next'
import { useTranslations } from 'next-intl'
import { getImagePreviewUrl } from '@/app/[locale]/actions/knowledge'
import { makeMediaRef } from '@/lib/storage'

const MAX_SIZE = 5 * 1024 * 1024

export default function ImageUpload({
  value,
  onChange,
  folder,
}: {
  value: string
  onChange: (ref: string) => void
  folder: string
}) {
  const t = useTranslations('KnowledgeAdmin')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  async function handleFile(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError(t('invalidFileType'))
      return
    }
    if (file.size > MAX_SIZE) {
      setError(t('fileTooLarge'))
      return
    }

    setUploading(true)
    try {
      const authRes = await fetch('/api/upload-auth/imagekit')
      if (!authRes.ok) throw new Error('Auth failed')
      const auth = await authRes.json()

      const result = await upload({
        file,
        fileName: file.name,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
        urlEndpoint: auth.urlEndpoint,
        folder,
        isPrivateFile: true,
        useUniqueFileName: true,
      })

      const path = result.filePath as string
      const preview = await getImagePreviewUrl(path)
      setPreviewUrl(preview)
      onChange(makeMediaRef('imagekit', path))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />
      {uploading && <p className="text-xs text-gray-500">...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {previewUrl && (
        <img src={previewUrl} alt="" className="w-full max-h-40 object-cover rounded-lg" />
      )}
      {value && !previewUrl && <p className="text-xs text-gray-400">{value}</p>}
    </div>
  )
}
