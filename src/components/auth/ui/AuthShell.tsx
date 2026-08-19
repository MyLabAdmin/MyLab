import type { ReactNode } from 'react'
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher'

type AuthShellProps = {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center">
        <div className="mb-4 flex w-full justify-end">
          <LocaleSwitcher />
        </div>

        {children}
      </div>
    </main>
  )
}
