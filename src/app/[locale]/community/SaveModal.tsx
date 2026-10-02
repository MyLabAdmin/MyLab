'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import {
  createBookmarkFolder,
  getBookmarkFolders,
  saveBookmark,
  type BookmarkFolder,
} from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'

type TargetType = 'post' | 'comment' | 'reply' | 'knowledge_item'

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
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [hasCustomFolderAccess, setHasCustomFolderAccess] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getBookmarkFolders().then((result) => {
      setFolders(result.folders)
      setHasCustomFolderAccess(result.hasCustomFolderAccess)
    })
  }, [])

  const defaultKind =
    targetType === 'knowledge_item'
      ? 'knowledge_default'
      : 'community_default'

  const defaultFolder = folders.find(
    (folder) => folder.folder_kind === defaultKind,
  )

  const customFolders = folders.filter(
    (folder) => folder.folder_kind === 'custom',
  )

  async function handlePick(folderId: string) {
    const result = await saveBookmark(targetType, targetId, folderId)

    if (!result.success) {
      showToast(
        locale === 'ar'
          ? 'تعذر حفظ العنصر'
          : 'Unable to save this item',
      )
      return
    }

    showToast(locale === 'ar' ? 'تم الحفظ ✅' : 'Saved ✅')
    onSaved()
    onClose()
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || creating) return

    setCreating(true)

    const result = await createBookmarkFolder(newFolderName)

    setCreating(false)

    if (!result.success || !result.folder) {
      showToast(
        locale === 'ar'
          ? 'لا تملك صلاحية استخدام المجلدات الإضافية'
          : 'Additional bookmark folders are not available',
      )
      return
    }

    await handlePick(result.folder.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-800">
          {locale === 'ar' ? 'حفظ في...' : 'Save to...'}
        </h3>

        {defaultFolder && (
          <button
            type="button"
            onClick={() => handlePick(defaultFolder.id)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-start text-sm hover:bg-primary-50"
          >
            {locale === 'ar'
              ? `${defaultFolder.name === 'Knowledge' ? 'المعرفة' : 'منشورات المجتمع'} (افتراضي)`
              : `${defaultFolder.name} (default)`}
          </button>
        )}

        {customFolders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => handlePick(folder.id)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-start text-sm hover:bg-primary-50"
          >
            {folder.name}
          </button>
        ))}

        {hasCustomFolderAccess && (
          <div className="flex gap-2 border-t border-gray-100 pt-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={
                locale === 'ar' ? 'اسم مجلد جديد' : 'New folder name'
              }
              className="input min-w-0 flex-1 text-sm"
              dir="auto"
            />

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateFolder}
              className="px-3 text-sm font-medium text-primary-600 disabled:opacity-60"
            >
              {locale === 'ar' ? 'إنشاء' : 'Create'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
