'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function PostComposerTrigger({ canAddImage, groupId }: { canAddImage: boolean; groupId?: string }) {
  const locale = useLocale()
  const href = groupId ? `/community/new?group=${groupId}` : '/community/new'

  return (
    <Link
      href={href}
      className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-primary-300 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
        ✎
      </div>
      <span className="text-gray-400 text-sm flex-1">
        {locale === 'ar' ? 'شارك حاجة مع المجتمع...' : 'Share something with the community...'}
      </span>
    </Link>
  )
}
