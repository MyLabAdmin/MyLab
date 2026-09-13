'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const next = locale === 'en' ? 'ar' : 'en'
    router.replace(pathname, { locale: next })
  }

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-primary-600 border border-primary-200 rounded-full px-3 py-1 hover:bg-primary-50"
    >
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  )
}
