import type { ReactNode } from 'react'

type AppMainProps = {
  children: ReactNode
}

export function AppMain({ children }: AppMainProps) {
  return (
    <main className="min-w-0 flex-1">
      {children}
    </main>
  )
}
