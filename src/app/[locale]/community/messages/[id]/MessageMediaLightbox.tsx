'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'

export type MessageMediaLightboxImage = {
  id: string
  url: string
  fileName: string
}

export default function MessageMediaLightbox({
  images,
  initialIndex = 0,
  isArabic,
  onClose,
}: {
  images: MessageMediaLightboxImage[]
  initialIndex?: number
  isArabic: boolean
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        scrollToIndex(currentIndex - 1)
      } else if (event.key === 'ArrowRight') {
        scrollToIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    requestAnimationFrame(() => {
      el.scrollTo({
        left: initialIndex * el.clientWidth,
        behavior: 'auto',
      })
    })
  }, [initialIndex])

  function scrollToIndex(index: number) {
    const nextIndex = Math.max(0, Math.min(index, images.length - 1))
    const el = scrollRef.current

    if (!el) return

    el.scrollTo({
      left: nextIndex * el.clientWidth,
      behavior: 'smooth',
    })
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return

    const index = Math.round(el.scrollLeft / el.clientWidth)
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)))
  }

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'عارض الصور' : 'Image viewer'}
    >
      <div className="flex items-center justify-between px-3 py-3 text-white sm:px-5">
        <span className="text-sm text-gray-300">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          <a
            href={currentImage.url}
            download={currentImage.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? 'تحميل' : 'Download'}
            </span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        dir="ltr"
        onScroll={handleScroll}
        className="relative flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="flex h-full w-full shrink-0 snap-center items-center justify-center px-3 sm:px-10"
          >
            <img
              src={image.url}
              alt={image.fileName}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}

        {images.length > 1 && currentIndex > 0 && (
          <button
            type="button"
            onClick={() => scrollToIndex(currentIndex - 1)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label={isArabic ? 'الصورة السابقة' : 'Previous image'}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {images.length > 1 && currentIndex < images.length - 1 && (
          <button
            type="button"
            onClick={() => scrollToIndex(currentIndex + 1)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label={isArabic ? 'الصورة التالية' : 'Next image'}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 px-3 pb-3 pt-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={[
                'h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'w-5 bg-white'
                  : 'w-1.5 bg-white/40 hover:bg-white/70',
              ].join(' ')}
              aria-label={
                isArabic
                  ? `الانتقال إلى الصورة ${index + 1}`
                  : `Go to image ${index + 1}`
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
