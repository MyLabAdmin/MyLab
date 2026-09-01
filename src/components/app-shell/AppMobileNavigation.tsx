'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { appNavigationItems } from './navigation'

export function AppMobileNavigation() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-app-navigation"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-primary-300 hover:text-primary-700"
      >
        {t('navigation')}
      </button>

      {open && (
        <nav
          id="mobile-app-navigation"
          aria-label={t('appName')}
          className="absolute end-0 top-full z-50 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
        >
          <ul className="space-y-1">
            {appNavigationItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={[
                      'block rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-neutral-900 hover:bg-neutral-50 hover:text-primary-800',
                    ].join(' ')}
                  >
                    {t(item.translationKey)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
