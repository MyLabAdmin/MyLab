'use client'

import { KnowledgeFormSection } from './KnowledgeFormSection'
import type {
  KnowledgeCategory,
  KnowledgeCategoryOption,
} from '@/lib/knowledge/categories'

export type KnowledgeTaxonomyValues = {
  primaryCategoryId: string
  subcategoryId: string
}

type KnowledgeTaxonomySectionProps = {
  values: KnowledgeTaxonomyValues
  parents: KnowledgeCategory[]
  subcategories: KnowledgeCategoryOption[]
  onChange: (
    field: keyof KnowledgeTaxonomyValues,
    value: string,
  ) => void
  labels: {
    sectionTitle: string
    sectionDescription: string
    primaryCategory: string
    primaryCategoryPlaceholder: string
    subcategory: string
    subcategoryPlaceholder: string
  }
  readOnly?: boolean
  disabled?: boolean
}

export function KnowledgeTaxonomySection({
  values,
  parents,
  subcategories,
  onChange,
  labels,
  readOnly = false,
  disabled = false,
}: KnowledgeTaxonomySectionProps) {
  const isDisabled = disabled || readOnly

  const availableSubcategories = values.primaryCategoryId
    ? subcategories.filter(
        (category) =>
          category.parent_id === values.primaryCategoryId,
      )
    : []

  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="knowledge-primary-category"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.primaryCategory}
          </label>

          <select
            id="knowledge-primary-category"
            name="primaryCategoryId"
            value={values.primaryCategoryId}
            onChange={(event) =>
              onChange(
                'primaryCategoryId',
                event.target.value,
              )
            }
            disabled={isDisabled}
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          >
            <option value="">
              {labels.primaryCategoryPlaceholder}
            </option>

            {parents.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="knowledge-subcategory"
            className="block text-sm font-medium text-neutral-900"
          >
            {labels.subcategory}
          </label>

          <select
            id="knowledge-subcategory"
            name="subcategoryId"
            value={values.subcategoryId}
            onChange={(event) =>
              onChange(
                'subcategoryId',
                event.target.value,
              )
            }
            disabled={
              isDisabled ||
              !values.primaryCategoryId
            }
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70"
          >
            <option value="">
              {labels.subcategoryPlaceholder}
            </option>

            {availableSubcategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </KnowledgeFormSection>
  )
}
