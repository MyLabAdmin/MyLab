'use client'

import type { ChangeEvent } from 'react'
import { KnowledgeFormSection } from '../KnowledgeFormSection'

export type KnowledgeProcedureValues = {
  procedure_code: string
}

type Props = {
  values: KnowledgeProcedureValues
  onChange: (field: keyof KnowledgeProcedureValues, value: string) => void
  readOnly?: boolean
  disabled?: boolean
  labels: {
    sectionTitle: string
    sectionDescription: string
    procedureCode: string
  }
}

export function KnowledgeProcedureSection({
  values,
  onChange,
  readOnly = false,
  disabled = false,
  labels,
}: Props) {
  const isDisabled = disabled || readOnly

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div>
        <label
          htmlFor="knowledge-procedure-code"
          className="block text-sm font-medium text-neutral-900"
        >
          {labels.procedureCode}
        </label>
        <input
          id="knowledge-procedure-code"
          type="text"
          value={values.procedure_code}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange('procedure_code', event.target.value)
          }
          disabled={isDisabled}
          readOnly={readOnly}
          required
          className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
        />
      </div>
    </KnowledgeFormSection>
  )
}
