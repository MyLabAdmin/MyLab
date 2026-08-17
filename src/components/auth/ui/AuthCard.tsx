import type { ReactNode } from 'react'

type AuthCardProps = {
  children: ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-md sm:p-8">
      {children}
    </section>
  )
}
