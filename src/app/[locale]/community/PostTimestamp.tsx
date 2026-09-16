'use client'

import { useLocale } from 'next-intl'

export default function PostTimestamp({ createdAt }: { createdAt: string }) {
  const locale = useLocale()
  const date = new Date(createdAt)

  const formatted = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

  return <span className="text-xs text-gray-400">{formatted}</span>
}
