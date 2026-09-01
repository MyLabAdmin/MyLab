'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

type KnowledgeErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function KnowledgeError({
  error,
  reset,
}: KnowledgeErrorProps) {
  const t = useTranslations('knowledge')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6">
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <h1 className="text-lg font-semibold text-red-900">
          {t('loadError')}
        </h1>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
