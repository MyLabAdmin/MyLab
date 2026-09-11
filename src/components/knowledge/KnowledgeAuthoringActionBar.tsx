'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

export type KnowledgeAuthoringState =
  | 'draft'
  | 'rejected'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'superseded'
  | 'archived'

type Props = {
  state: KnowledgeAuthoringState
  submitting?: boolean
  onCancel: () => void
  onSubmit: () => void
  children?: ReactNode
}

export function KnowledgeAuthoringActionBar({
  state,
  submitting = false,
  onCancel,
  onSubmit,
  children,
}: Props) {
  const t = useTranslations(
    'knowledge.laboratoryTest',
  )

  const canEdit =
    state === 'draft' || state === 'rejected'

  if (!canEdit) {
    return null
  }

  const submitLabel =
    state === 'rejected'
      ? t('actions.resubmitForReview')
      : t('actions.submitForReview')

  return (
    <div className="border-t border-neutral-200 pt-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {t('actions.cancel')}
        </button>

        {children}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting
            ? t('actions.saving')
            : submitLabel}
        </button>
      </div>
    </div>
  )
}
