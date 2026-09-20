'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

export default function ExpandableText({ text, maxLength }: { text: string; maxLength: number }) {
  const locale = useLocale()
  const [expanded, setExpanded] = useState(false)

  if (text.length <= maxLength) {
    return <span dir="auto">{text}</span>
  }

  return (
    <span dir="auto">
      {expanded ? text : text.slice(0, maxLength) + '...'}{' '}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-primary-600 text-sm font-medium"
      >
        {expanded ? (locale === 'ar' ? 'عرض أقل' : 'See less') : (locale === 'ar' ? 'عرض المزيد' : 'See more')}
      </button>
    </span>
  )
}
