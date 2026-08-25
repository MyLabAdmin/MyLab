'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { appNavigationItems } from './navigation'

export function AppNavigation() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('appName')}
      className="hidden w-60 shrink-0 border-e border-neutral-200 bg-neutral-50 lg:block"
    >
      <div className="p-4">
        <ul className="space-y-1">
          {appNavigationItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-700 hover:bg-white hover:text-primary-700',
                  ].join(' ')}
                >
                  {t(item.translationKey)}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
