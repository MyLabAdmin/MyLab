'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createKnowledgeItemAction } from '@/app/[locale]/(app)/knowledge/actions'
import {
  GENERIC_KNOWLEDGE_ITEM_TYPES,
  type GenericKnowledgeItemType,
} from '@/lib/knowledge/types'

export function CreateKnowledgeItemForm() {
  const router = useRouter()
  const t = useTranslations('knowledge.new')
  const tTypes = useTranslations('knowledge.itemTypes')

  const [itemType, setItemType] =
    useState<GenericKnowledgeItemType>('test')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) {
      return
    }

    setError(null)

    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      setError(t('validation.titleRequired'))
      return
    }

    setLoading(true)

    try {
      await createKnowledgeItemAction({
        itemType,
        title: normalizedTitle,
        summary: summary.trim() || null,
        content: content.trim() || null,
      })

      router.push('/knowledge?created=1')
      router.refresh()
    } catch {
      setError(t('errors.createFailed'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="knowledge-item-type"
          className="block text-sm font-medium text-neutral-900"
        >
          {t('itemType')}
        </label>

        <select
          id="knowledge-item-type"
          name="itemType"
          value={itemType}
          onChange={(event) =>
            setItemType(
              event.target.value as GenericKnowledgeItemType,
            )
          }
          disabled={loading}
          className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {GENERIC_KNOWLEDGE_ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {tTypes(type)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="knowledge-item-title"
          className="block text-sm font-medium text-neutral-900"
        >
          {t('titleLabel')}
        </label>

        <input
          id="knowledge-item-title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={loading}
          required
          maxLength={300}
          autoComplete="off"
          placeholder={t('titlePlaceholder')}
          className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="knowledge-item-summary"
          className="block text-sm font-medium text-neutral-900"
        >
          {t('summaryLabel')}
        </label>

        <textarea
          id="knowledge-item-summary"
          name="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          disabled={loading}
          maxLength={1000}
          rows={4}
          placeholder={t('summaryPlaceholder')}
          className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="knowledge-item-content"
          className="block text-sm font-medium text-neutral-900"
        >
          {t('contentLabel')}
        </label>

        <textarea
          id="knowledge-item-content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={loading}
          rows={10}
          placeholder={t('contentPlaceholder')}
          className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push('/knowledge')}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('cancel')}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('saving') : t('submit')}
        </button>
      </div>
    </form>
  )
}
