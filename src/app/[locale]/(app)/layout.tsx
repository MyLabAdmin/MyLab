import type { ReactNode } from 'react'
import { ApplicationShell } from '@/components/app-shell/ApplicationShell'

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return <ApplicationShell>{children}</ApplicationShell>
}
