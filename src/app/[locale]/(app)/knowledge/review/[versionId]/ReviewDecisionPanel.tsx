'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  approveKnowledgeVersionAction,
  publishKnowledgeVersionAction,
  rejectKnowledgeVersionAction,
} from '@/app/[locale]/(app)/knowledge/actions'

type ReviewDecisionPanelProps = {
  locale: string
  versionId: string
  reviewStatus: string
  approveLabel: string
  rejectLabel: string
  publishLabel: string
  rejectReasonLabel: string
  rejectReasonPlaceholder: string
  approveNoteLabel: string
  approveNotePlaceholder: string
  confirmApproveLabel: string
  confirmRejectLabel: string
  confirmPublishLabel: string
  cancelLabel: string
  requiredReasonMessage: string
  genericErrorMessage: string
}

export default function ReviewDecisionPanel({
  locale,
  versionId,
  reviewStatus,
  approveLabel,
  rejectLabel,
  publishLabel,
  rejectReasonLabel,
  rejectReasonPlaceholder,
  approveNoteLabel,
  approveNotePlaceholder,
  confirmApproveLabel,
  confirmRejectLabel,
  confirmPublishLabel,
  cancelLabel,
  requiredReasonMessage,
  genericErrorMessage,
}: ReviewDecisionPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject' | 'publish'>(
    'idle',
  )
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  function reset() {
    setMode('idle')
    setNote('')
    setError('')
  }

  function handleApprove() {
    setError('')

    startTransition(async () => {
      try {
        await approveKnowledgeVersionAction(versionId, note)
        router.replace(`/${locale}/knowledge/review`)
      } catch {
        setError(genericErrorMessage)
      }
    })
  }

  function handleReject() {
    const trimmedNote = note.trim()

    if (!trimmedNote) {
      setError(requiredReasonMessage)
      return
    }

    setError('')

    startTransition(async () => {
      try {
        await rejectKnowledgeVersionAction(versionId, trimmedNote)
        router.replace(`/${locale}/knowledge/review`)
      } catch {
        setError(genericErrorMessage)
      }
    })
  }

  function handlePublish() {
    setError('')

    startTransition(async () => {
      try {
        await publishKnowledgeVersionAction(versionId)
        router.replace(`/${locale}/knowledge/review`)
      } catch {
        setError(genericErrorMessage)
      }
    })
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        {mode === 'reject'
          ? rejectLabel
          : mode === 'publish'
            ? publishLabel
            : approveLabel}
      </h2>

      {mode === 'idle' && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {reviewStatus === 'pending_review' && (
            <>
              <button
                type="button"
                onClick={() => setMode('approve')}
                disabled={isPending}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {approveLabel}
              </button>

              <button
                type="button"
                onClick={() => setMode('reject')}
                disabled={isPending}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
              >
                {rejectLabel}
              </button>
            </>
          )}

          {reviewStatus === 'approved' && (
            <button
              type="button"
              onClick={() => setMode('publish')}
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {publishLabel}
            </button>
          )}
        </div>
      )}

      {mode === 'approve' && (
        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="approve-note"
              className="block text-sm font-medium text-neutral-900"
            >
              {approveNoteLabel}
            </label>
            <textarea
              id="approve-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={approveNotePlaceholder}
              disabled={isPending}
              className="mt-2 min-h-28 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? '...' : confirmApproveLabel}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}

      {mode === 'reject' && (
        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-sm font-medium text-neutral-900"
            >
              {rejectReasonLabel}
            </label>
            <textarea
              id="reject-reason"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={rejectReasonPlaceholder}
              required
              disabled={isPending}
              className="mt-2 min-h-28 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? '...' : confirmRejectLabel}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}

      {mode === 'publish' && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-neutral-700">
            {publishLabel}
          </p>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? '...' : confirmPublishLabel}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
