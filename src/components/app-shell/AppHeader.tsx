import { Logo } from '@/components/brand/Logo'
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher'
import { AppMobileNavigation } from './AppMobileNavigation'

export function AppHeader() {
  return (
    <header className="relative flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center">
        <Logo size="sm" priority />
      </div>

      <div className="flex items-center gap-2">
        <AppMobileNavigation />
        <LocaleSwitcher />
      </div>
    </header>
  )
}
