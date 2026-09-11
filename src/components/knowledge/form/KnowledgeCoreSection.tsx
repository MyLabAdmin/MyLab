'use client'

import type { ChangeEvent } from 'react'
import { KnowledgeFormSection } from './KnowledgeFormSection'

export type KnowledgeCoreValues = {
  title: string
  summary: string
  content: string
}

type KnowledgeCoreSectionProps = {
  values: KnowledgeCoreValues
  onChange: (
    field: keyof KnowledgeCoreValues,
    value: string,
  ) => void
  labels: {
    title: string
    titlePlaceholder: string
    summary: string
    summaryPlaceholder: string
    content: string
    contentPlaceholder: string
    sectionTitle: string
    sectionDescription: string
  }
  readOnly?: boolean
  disabled?: boolean
}

export function KnowledgeCoreSection({
  values,
  onChange,
  labels,
  readOnly = false,
  disabled = false,
}: KnowledgeCoreSectionProps) {
  const isDisabled = disabled || readOnly

  const handleChange =
    (field: keyof KnowledgeCoreValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(field, event.target.value)
    }

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="knowledge-core-title"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.title}
          </label>

          <input
            id="knowledge-core-title"
            name="title"
            type="text"
            value={values.title}
            onChange={handleChange('title')}
            disabled={isDisabled}
            readOnly={readOnly}
            required
            maxLength={300}
            autoComplete="off"
            placeholder={labels.titlePlaceholder}
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="knowledge-core-summary"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.summary}
          </label>

          <textarea
            id="knowledge-core-summary"
            name="summary"
            value={values.summary}
            onChange={handleChange('summary')}
            disabled={isDisabled}
            readOnly={readOnly}
            maxLength={1000}
            rows={4}
            placeholder={labels.summaryPlaceholder}
            className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="knowledge-core-content"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.content}
          </label>

          <textarea
            id="knowledge-core-content"
            name="content"
            value={values.content}
            onChange={handleChange('content')}
            disabled={isDisabled}
            readOnly={readOnly}
            rows={12}
            placeholder={labels.contentPlaceholder}
            className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          />
        </div>
      </div>
    </KnowledgeFormSection>
  )
}
