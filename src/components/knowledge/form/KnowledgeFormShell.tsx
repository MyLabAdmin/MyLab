'use client'

import type { ReactNode } from 'react'
import type { KnowledgeItemType } from '@/lib/knowledge/types'

export type KnowledgeFormMode =
  | 'create'
  | 'edit'
  | 'readOnly'

type KnowledgeFormShellProps = {
  itemType: KnowledgeItemType
  mode?: KnowledgeFormMode
  children: ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  className?: string
}

export function KnowledgeFormShell({
  itemType,
  mode = 'create',
  children,
  onSubmit,
  className = '',
}: KnowledgeFormShellProps) {

  return (
    <form
      onSubmit={onSubmit}
      data-knowledge-type={itemType}
      data-knowledge-mode={mode}
      className={[
        'space-y-6',
        className,
      ].join(' ')}
    >
      {children}
    </form>
  )
}
