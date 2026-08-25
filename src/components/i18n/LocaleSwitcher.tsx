'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations('common')
  const pathname = usePathname()
  const router = useRouter()

  const nextLocale = locale === 'en' ? 'ar' : 'en'
  const nextLocaleLabel =
    nextLocale === 'ar' ? t('arabic') : t('english')

  function handleChange() {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      aria-label={nextLocaleLabel}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-primary-300 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      {nextLocaleLabel}
    </button>
  )
}
