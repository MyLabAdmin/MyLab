'use client'

import type { ChangeEvent } from 'react'
import { KnowledgeFormSection } from '../KnowledgeFormSection'

export type KnowledgePathogenValues = {
  scientific_name: string
  common_name: string
  pathogen_group: string
  genus: string
  species: string
  strain_or_serotype: string
}

type Props = {
  values: KnowledgePathogenValues
  onChange: (field: keyof KnowledgePathogenValues, value: string) => void
  readOnly?: boolean
  disabled?: boolean
  labels: {
    sectionTitle: string
    sectionDescription: string
    scientificName: string
    commonName: string
    pathogenGroup: string
    genus: string
    species: string
    strainOrSerotype: string
  }
}

export function KnowledgePathogenSection({
  values,
  onChange,
  readOnly = false,
  disabled = false,
  labels,
}: Props) {
  const isDisabled = disabled || readOnly

  const field =
    (name: keyof KnowledgePathogenValues) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      onChange(name, event.target.value)

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="scientific-name"
          label={labels.scientificName}
          value={values.scientific_name}
          onChange={field('scientific_name')}
          disabled={isDisabled}
          required
        />
        <Field
          id="common-name"
          label={labels.commonName}
          value={values.common_name}
          onChange={field('common_name')}
          disabled={isDisabled}
        />
        <Field
          id="pathogen-group"
          label={labels.pathogenGroup}
          value={values.pathogen_group}
          onChange={field('pathogen_group')}
          disabled={isDisabled}
          required
        />
        <Field
          id="genus"
          label={labels.genus}
          value={values.genus}
          onChange={field('genus')}
          disabled={isDisabled}
        />
        <Field
          id="species"
          label={labels.species}
          value={values.species}
          onChange={field('species')}
          disabled={isDisabled}
        />
        <Field
          id="strain-or-serotype"
          label={labels.strainOrSerotype}
          value={values.strain_or_serotype}
          onChange={field('strain_or_serotype')}
          disabled={isDisabled}
        />
      </div>
    </KnowledgeFormSection>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
  required = false,
}: {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={`knowledge-pathogen-${id}`}
        className="block text-sm font-medium text-neutral-900"
      >
        {label}
      </label>
      <input
        id={`knowledge-pathogen-${id}`}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={disabled}
        required={required}
        className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
      />
    </div>
  )
}
