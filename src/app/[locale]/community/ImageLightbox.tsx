'use client'

import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import ReactionPicker from './ReactionPicker'
import type { ReactionKey } from '@/components/community/ReactionIcons'

export default function ImageLightbox({
  images,
  initialIndex = 0,
  postId,
  reactionCounts,
  myReaction,
  commentCount,
  onOpenComments,
  onClose,
}: {
  images: string[]
  initialIndex?: number
  postId: string
  reactionCounts: Record<string, number>
  myReaction: ReactionKey | null
  commentCount: number
  onOpenComments: () => void
  onClose: () => void
}) {
  const locale = useLocale()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setCurrentIndex(index)
  }

  function scrollTo(index: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm text-gray-300">{currentIndex + 1} / {images.length}</span>
        <div className="flex items-center gap-4">
          <a
            href={images[currentIndex]}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            {locale === 'ar' ? 'تحميل' : 'Download'}
          </a>
          <button type="button" onClick={onClose} className="text-2xl w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((src, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
            <img src={src} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 p-3 bg-black/60 text-white">
        <div className="text-white [&_button]:text-white [&_span]:text-white">
          <ReactionPicker targetType="post" targetId={postId} counts={reactionCounts} myReaction={myReaction} />
        </div>
        <button
          type="button"
          onClick={() => { onClose(); onOpenComments() }}
          className="text-sm text-gray-200"
        >
          {locale === 'ar' ? `تعليقات (${commentCount})` : `Comments (${commentCount})`}
        </button>
      </div>
    </div>
  )
}
