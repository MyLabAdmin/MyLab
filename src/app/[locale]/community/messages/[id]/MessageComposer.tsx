'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/app/[locale]/actions/messaging'

export default function MessageComposer({
  conversationId,
  locale,
}: {
  conversationId: string
  locale: string
}) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const isArabic = locale === 'ar'

  function submit() {
    const value = body.trim()

    if (!value || isPending) return

    const clientMessageId = crypto.randomUUID()

    startTransition(async () => {
      const result = await sendMessage(
        conversationId,
        value,
        clientMessageId,
      )

      if (result.success) {
        setBody('')
        router.refresh()
        textareaRef.current?.focus()
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={1}
          dir={isArabic ? 'rtl' : 'ltr'}
          placeholder={
            isArabic ? 'اكتب رسالة...' : 'Write a message...'
          }
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60 sm:text-base"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || isPending}
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? isArabic
              ? '...'
              : '...'
            : isArabic
              ? 'إرسال'
              : 'Send'}
        </button>
      </div>

      <p
        className={
          'mt-1.5 px-1 text-[10px] text-gray-400 sm:text-xs ' +
          (isArabic ? 'text-right' : 'text-left')
        }
      >
        {isArabic
          ? 'Enter للإرسال • Shift + Enter لسطر جديد'
          : 'Enter to send • Shift + Enter for a new line'}
      </p>
    </div>
  )
}
