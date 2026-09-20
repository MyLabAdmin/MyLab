'use client'

import { useState } from 'react'
import { upload } from '@imagekit/next'
import { getImagePreviewUrl } from '@/app/[locale]/actions/knowledge'
import { saveToMediaLibrary } from '@/app/[locale]/actions/media-library'
import { makeMediaRef } from '@/lib/storage'

const MAX_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 4

export default function MultiImageUpload({
  refs,
  onChange,
  folder,
  scope = 'community',
}: {
  refs: string[]
  onChange: (refs: string[]) => void
  folder: string
  scope?: string
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList) {
    setError('')
    const remaining = MAX_IMAGES - refs.length
    const selected = Array.from(files).slice(0, remaining)
    if (selected.length === 0) return

    setUploading(true)
    const newRefs: string[] = []

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type')
        continue
      }
      if (file.size > MAX_SIZE) {
        setError('File too large (max 5MB)')
        continue
      }

      try {
        const authRes = await fetch('/api/upload-auth/imagekit')
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
        const ref = makeMediaRef('imagekit', path)

        setPreviews((p) => ({ ...p, [ref]: preview }))
        newRefs.push(ref)

        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        await saveToMediaLibrary(path, nameWithoutExt, [], scope)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      }
    }

    onChange([...refs, ...newRefs])
    setUploading(false)
  }

  function removeAt(ref: string) {
    onChange(refs.filter((r) => r !== ref))
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {refs.map((ref) => (
          <div key={ref} className="relative w-20 h-20">
            {previews[ref] && (
              <img src={previews[ref]} alt="" className="w-20 h-20 object-cover rounded-lg" />
            )}
            <button
              type="button"
              onClick={() => removeAt(ref)}
              className="absolute -top-1.5 -end-1.5 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
        {refs.length < MAX_IMAGES && (
          <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-2xl cursor-pointer">
            +
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        )}
      </div>
      {uploading && <p className="text-xs text-gray-500">...</p>}
    </div>
  )
}
