'use client'

import { Image as ImageIcon } from 'lucide-react'

export type MessageMediaGridItem = {
  id: string
  url: string | null
  fileName: string
  loading?: boolean
}

export default function MessageMediaGrid({
  items,
  isArabic,
  onOpen,
}: {
  items: MessageMediaGridItem[]
  isArabic: boolean
  onOpen: (id: string) => void
}) {
  if (items.length === 0) return null

  const visible = items.slice(0, 4)
  const extraCount = Math.max(0, items.length - 4)

  function renderItem(item: MessageMediaGridItem, index: number, className = '') {
    const canOpen = Boolean(item.url) && !item.loading

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => canOpen && onOpen(item.id)}
        disabled={!canOpen}
        className={[
          'group relative min-h-0 overflow-hidden rounded-xl bg-black/5 text-left',
          canOpen ? 'cursor-pointer' : 'cursor-default',
          className,
        ].join(' ')}
        aria-label={
          canOpen
            ? isArabic
              ? `فتح الصورة ${index + 1}`
              : `Open image ${index + 1}`
            : undefined
        }
      >
        {item.url ? (
          <img
            src={item.url}
            alt={item.fileName}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-xs opacity-60">
              <ImageIcon className="h-5 w-5" />
              <span>
                {item.loading
                  ? isArabic
                    ? 'جاري التحميل...'
                    : 'Loading...'
                  : isArabic
                    ? 'تعذر تحميل الصورة'
                    : 'Unable to load image'}
              </span>
            </div>
          </div>
        )}

        {index === 3 && extraCount > 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-semibold text-white">
            +{extraCount}
          </span>
        )}
      </button>
    )
  }

  if (items.length === 1) {
    const item = items[0]

    return (
      <div className="mb-2 max-w-full overflow-hidden rounded-xl">
        {renderItem(item, 0, 'max-h-80')}
      </div>
    )
  }

  if (items.length === 2) {
    return (
      <div className="mb-2 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
        {visible.map((item, index) =>
          renderItem(item, index, 'aspect-square'),
        )}
      </div>
    )
  }

  if (items.length === 3) {
    return (
      <div className="mb-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
        {renderItem(visible[0], 0, 'row-span-2 aspect-[1/2]')}
        {renderItem(visible[1], 1, 'aspect-square')}
        {renderItem(visible[2], 2, 'aspect-square')}
      </div>
    )
  }

  return (
    <div className="mb-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
      {visible.map((item, index) =>
        renderItem(item, index, 'aspect-square'),
      )}
    </div>
  )
}
