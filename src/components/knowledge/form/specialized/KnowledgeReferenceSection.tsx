'use client'

import type { ChangeEvent } from 'react'
import { KnowledgeFormSection } from '../KnowledgeFormSection'

export type KnowledgeReferenceValues = {
  referenceType: string
  citation: string
  url: string
}

type Props = {
  values: KnowledgeReferenceValues
  onChange: (
    field: keyof KnowledgeReferenceValues,
    value: string,
  ) => void
  readOnly?: boolean
  disabled?: boolean
  labels: {
    sectionTitle: string
    sectionDescription: string
    referenceType: string
    citation: string
    url: string
    referenceTypePlaceholder: string
    types: {
      book: string
      journal: string
      guideline: string
      organization: string
      website: string
      manual: string
      other: string
    }
  }
}

export function KnowledgeReferenceSection({
  values,
  onChange,
  readOnly = false,
  disabled = false,
  labels,
}: Props) {
  const isDisabled = disabled || readOnly

  const change =
    (field: keyof KnowledgeReferenceValues) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      onChange(field, event.target.value)

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="knowledge-reference-type"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.referenceType}
          </label>
          <select
            id="knowledge-reference-type"
            value={values.referenceType}
            onChange={(event) =>
              onChange('referenceType', event.target.value)
            }
            disabled={isDisabled}
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          >
            <option value="">{labels.referenceTypePlaceholder}</option>
            <option value="book">{labels.types.book}</option>
            <option value="journal">{labels.types.journal}</option>
            <option value="guideline">{labels.types.guideline}</option>
            <option value="organization">{labels.types.organization}</option>
            <option value="website">{labels.types.website}</option>
            <option value="manual">{labels.types.manual}</option>
            <option value="other">{labels.types.other}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="knowledge-reference-citation"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.citation}
          </label>
          <textarea
            id="knowledge-reference-citation"
            value={values.citation}
            onChange={change('citation')}
            disabled={isDisabled}
            readOnly={readOnly}
            rows={5}
            className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="knowledge-reference-url"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.url}
          </label>
          <input
            id="knowledge-reference-url"
            type="url"
            value={values.url}
            onChange={change('url')}
            disabled={isDisabled}
            readOnly={readOnly}
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          />
        </div>
      </div>
    </KnowledgeFormSection>
  )
}
