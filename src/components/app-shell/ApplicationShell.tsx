import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { AppNavigation } from './AppNavigation'
import { AppMain } from './AppMain'

type ApplicationShellProps = {
  children: ReactNode
}

export function ApplicationShell({
  children,
}: ApplicationShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <AppNavigation />

        <AppMain>{children}</AppMain>
      </div>
    </div>
  )
}
