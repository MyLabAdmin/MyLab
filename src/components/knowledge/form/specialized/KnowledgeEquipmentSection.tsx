'use client'

import type { ChangeEvent } from 'react'
import { KnowledgeFormSection } from '../KnowledgeFormSection'

export type KnowledgeEquipmentValues = {
  equipment_code: string
  manufacturer: string
  model: string
  equipment_type: string
  manufacturer_part_number: string
  description: string
  active: boolean
}

type Props = {
  values: KnowledgeEquipmentValues
  onChange: (
    field: keyof KnowledgeEquipmentValues,
    value: string | boolean,
  ) => void
  readOnly?: boolean
  disabled?: boolean
  labels: {
    sectionTitle: string
    sectionDescription: string
    equipmentCode: string
    manufacturer: string
    model: string
    equipmentType: string
    manufacturerPartNumber: string
    description: string
    active: string
  }
}

export function KnowledgeEquipmentSection({
  values,
  onChange,
  readOnly = false,
  disabled = false,
  labels,
}: Props) {
  const isDisabled = disabled || readOnly

  const textField =
    (name: keyof KnowledgeEquipmentValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, event.target.value)

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="equipment-code"
            label={labels.equipmentCode}
            value={values.equipment_code}
            onChange={textField('equipment_code')}
            disabled={isDisabled}
            required
          />
          <Field
            id="manufacturer"
            label={labels.manufacturer}
            value={values.manufacturer}
            onChange={textField('manufacturer')}
            disabled={isDisabled}
          />
          <Field
            id="model"
            label={labels.model}
            value={values.model}
            onChange={textField('model')}
            disabled={isDisabled}
          />
          <Field
            id="equipment-type"
            label={labels.equipmentType}
            value={values.equipment_type}
            onChange={textField('equipment_type')}
            disabled={isDisabled}
          />
          <Field
            id="manufacturer-part-number"
            label={labels.manufacturerPartNumber}
            value={values.manufacturer_part_number}
            onChange={textField('manufacturer_part_number')}
            disabled={isDisabled}
          />
        </div>

        <div>
          <label
            htmlFor="knowledge-equipment-description"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.description}
          </label>
          <textarea
            id="knowledge-equipment-description"
            value={values.description}
            onChange={textField('description')}
            disabled={isDisabled}
            readOnly={readOnly}
            rows={5}
            className="mt-2 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) =>
              onChange('active', event.target.checked)
            }
            disabled={isDisabled}
            className="h-4 w-4 rounded border-neutral-300"
          />
          {labels.active}
        </label>
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
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  disabled: boolean
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={`knowledge-equipment-${id}`}
        className="block text-sm font-medium text-neutral-900"
      >
        {label}
      </label>
      <input
        id={`knowledge-equipment-${id}`}
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
