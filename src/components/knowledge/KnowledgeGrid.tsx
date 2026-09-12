import type { ReactNode } from 'react'

type KnowledgeGridProps = {
  children: ReactNode
}

export function KnowledgeGrid({ children }: KnowledgeGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  )
}
