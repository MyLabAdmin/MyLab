'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { getBookmarkFolders, createBookmarkFolder, saveBookmark } from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'

type TargetType = 'post' | 'comment' | 'reply'

export default function SaveModal({
  targetType,
  targetId,
  onClose,
  onSaved,
}: {
  targetType: TargetType
  targetId: string
  onClose: () => void
  onSaved: () => void
}) {
  const locale = useLocale()
  const { showToast } = useToast()
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getBookmarkFolders().then(setFolders)
  }, [])

  async function handlePick(folderId: string | null) {
    await saveBookmark(targetType, targetId, folderId)
    showToast(locale === 'ar' ? 'تم الحفظ ✅' : 'Saved ✅')
    onSaved()
    onClose()
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    setCreating(true)
    const result = await createBookmarkFolder(newFolderName)
    setCreating(false)
    if (result.success && result.folder) {
      await handlePick(result.folder.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-800">
          {locale === 'ar' ? 'حفظ في...' : 'Save to...'}
        </h3>

        <button
          type="button"
          onClick={() => handlePick(null)}
          className="text-start text-sm py-2 px-3 rounded-lg hover:bg-primary-50 border border-gray-200"
        >
          {locale === 'ar' ? 'منشورات المجتمع (افتراضي)' : 'Community Posts (default)'}
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handlePick(f.id)}
            className="text-start text-sm py-2 px-3 rounded-lg hover:bg-primary-50 border border-gray-200"
          >
            {f.name}
          </button>
        ))}

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={locale === 'ar' ? 'اسم مجلد جديد' : 'New folder name'}
            className="input flex-1 text-sm"
            dir="auto"
          />
          <button
            type="button"
            disabled={creating}
            onClick={handleCreateFolder}
            className="text-sm text-primary-600 font-medium px-3 disabled:opacity-60"
          >
            {locale === 'ar' ? 'إنشاء' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
