'use client'

import { useState } from 'react'
import { getFriends } from '@/app/[locale]/actions/friends'
import NewConversationForm from './new/NewConversationForm'

type Friend = {
  id: string
  user_id: string
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function NewConversationButton({
  locale,
}: {
  locale: string
}) {
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isArabic = locale === 'ar'

  async function openComposer() {
    setOpen(true)

    if (friends.length > 0 || loadingFriends) {
      return
    }

    setLoadingFriends(true)
    setLoadError(null)

    try {
      const result = await getFriends()

      if (!result.success) {
        setLoadError(result.error)
        return
      }

      setFriends(result.friends)
    } catch {
      setLoadError(
        isArabic
          ? 'تعذر تحميل قائمة الأصدقاء'
          : 'Failed to load friends',
      )
    } finally {
      setLoadingFriends(false)
    }
  }

  function closeComposer() {
    if (loadingFriends) return

    setOpen(false)
    setLoadError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={openComposer}
        aria-label={isArabic ? 'محادثة جديدة' : 'New conversation'}
        className={[
          'fixed bottom-5 z-40 flex h-14 items-center gap-2 rounded-full',
          'bg-primary-600 px-5 text-sm font-semibold text-white shadow-lg',
          'transition hover:bg-primary-700 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
          isArabic ? 'left-5' : 'right-5',
          'sm:bottom-6',
        ].join(' ')}
      >
        <span
          className="text-xl leading-none"
          aria-hidden="true"
        >
          +
        </span>

        <span className="hidden sm:inline">
          {isArabic ? 'محادثة جديدة' : 'New conversation'}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/30 sm:items-end sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeComposer()
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-conversation-title"
            dir={isArabic ? 'rtl' : 'ltr'}
            className={[
              'w-full overflow-hidden bg-white shadow-2xl',
              'rounded-t-3xl',
              'max-h-[88vh]',
              isArabic ? 'sm:mr-auto sm:max-w-md sm:rounded-2xl' : 'sm:ml-auto sm:max-w-md sm:rounded-2xl',
              'sm:max-h-[min(760px,calc(100vh-3rem))]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="new-conversation-title"
                  className="text-lg font-bold text-primary-700"
                >
                  {isArabic ? 'محادثة جديدة' : 'New conversation'}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  {isArabic
                    ? 'ابدأ محادثة مع أصدقائك'
                    : 'Start a conversation with your friends'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeComposer}
                disabled={loadingFriends}
                aria-label={isArabic ? 'إغلاق' : 'Close'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {loadingFriends ? (
              <div className="flex min-h-56 items-center justify-center px-5 py-8">
                <p className="text-sm text-gray-500">
                  {isArabic
                    ? 'جارٍ تحميل الأصدقاء...'
                    : 'Loading friends...'}
                </p>
              </div>
            ) : loadError ? (
              <div className="p-5 sm:p-6">
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
                >
                  {loadError}
                </div>

                <button
                  type="button"
                  onClick={openComposer}
                  className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {isArabic ? 'إعادة المحاولة' : 'Try again'}
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto">
                <NewConversationForm
                  locale={locale}
                  initialType="direct"
                  friends={friends}
                  embedded
                  onClose={closeComposer}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
