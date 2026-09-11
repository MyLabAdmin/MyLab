'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createGenericKnowledgeItemAction } from '@/app/[locale]/(app)/knowledge/actions'
import {
  GENERIC_KNOWLEDGE_ITEM_TYPES,
  type GenericKnowledgeItemType,
} from '@/lib/knowledge/types'
import type {
  KnowledgeCategory,
  KnowledgeCategoryOption,
} from '@/lib/knowledge/categories'
import {
  GenericKnowledgeForm,
  type GenericKnowledgeFormValues,
} from './GenericKnowledgeForm'

type Props = {
  parents: KnowledgeCategory[]
  subcategories: KnowledgeCategoryOption[]
}

export function CreateGenericKnowledgeItemForm({
  parents,
  subcategories,
}: Props) {
  const router = useRouter()
  const t = useTranslations('knowledge.new')
  const tTypes = useTranslations('knowledge.itemTypes')
  const tGeneric = useTranslations('knowledge.generic.sections')

  const [itemType, setItemType] =
    useState<GenericKnowledgeItemType>('test')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labels = useMemo(
    () => ({
      core: {
        sectionTitle: tGeneric('core.title'),
        sectionDescription: tGeneric('core.description'),
        title: tGeneric('core.titleLabel'),
        titlePlaceholder: tGeneric('core.titlePlaceholder'),
        summary: tGeneric('core.summary'),
        summaryPlaceholder: tGeneric('core.summaryPlaceholder'),
        content: tGeneric('core.content'),
        contentPlaceholder: tGeneric('core.contentPlaceholder'),
      },
      taxonomy: {
        sectionTitle: tGeneric('taxonomy.title'),
        sectionDescription: tGeneric('taxonomy.description'),
        primaryCategory: tGeneric('taxonomy.primaryCategory'),
        primaryCategoryPlaceholder: tGeneric(
          'taxonomy.primaryCategoryPlaceholder',
        ),
        subcategory: tGeneric('taxonomy.subcategory'),
        subcategoryPlaceholder: tGeneric(
          'taxonomy.subcategoryPlaceholder',
        ),
      },
      pathogen: {
        sectionTitle: tGeneric('pathogen.title'),
        sectionDescription: tGeneric('pathogen.description'),
        scientificName: tGeneric('pathogen.scientificName'),
        commonName: tGeneric('pathogen.commonName'),
        pathogenGroup: tGeneric('pathogen.pathogenGroup'),
        genus: tGeneric('pathogen.genus'),
        species: tGeneric('pathogen.species'),
        strainOrSerotype: tGeneric('pathogen.strainOrSerotype'),
      },
      equipment: {
        sectionTitle: tGeneric('equipment.title'),
        sectionDescription: tGeneric('equipment.description'),
        equipmentCode: tGeneric('equipment.equipmentCode'),
        manufacturer: tGeneric('equipment.manufacturer'),
        model: tGeneric('equipment.model'),
        equipmentType: tGeneric('equipment.equipmentType'),
        manufacturerPartNumber: tGeneric(
          'equipment.manufacturerPartNumber',
        ),
        description: tGeneric('equipment.description'),
        active: tGeneric('equipment.active'),
      },
      procedure: {
        sectionTitle: tGeneric('procedure.title'),
        sectionDescription: tGeneric('procedure.description'),
        procedureCode: tGeneric('procedure.procedureCode'),
      },
      reference: {
        sectionTitle: tGeneric('reference.title'),
        sectionDescription: tGeneric('reference.description'),
        referenceType: tGeneric('reference.referenceType'),
        citation: tGeneric('reference.citation'),
        url: tGeneric('reference.url'),
        referenceTypePlaceholder: tGeneric(
          'reference.referenceTypePlaceholder',
        ),
        types: {
          book: tGeneric('reference.types.book'),
          journal: tGeneric('reference.types.journal'),
          guideline: tGeneric('reference.types.guideline'),
          organization: tGeneric('reference.types.organization'),
          website: tGeneric('reference.types.website'),
          manual: tGeneric('reference.types.manual'),
          other: tGeneric('reference.types.other'),
        },
      },
      educational: {
        sectionTitle: tGeneric('educational.title'),
        sectionDescription: tGeneric('educational.description'),
      },
    }),
    [tGeneric],
  )

  async function handleSubmit(values: GenericKnowledgeFormValues) {
    if (loading) {
      return
    }

    setError(null)
    setLoading(true)

    try {
      await createGenericKnowledgeItemAction({
        itemType: values.itemType,
        title: values.core.title.trim(),
        summary: values.core.summary.trim() || null,
        content: values.core.content.trim() || null,
        primaryCategoryId: values.taxonomy.primaryCategoryId,
        subcategoryId: values.taxonomy.subcategoryId || null,
        specializedData: values.specializedData,
      })

      router.push('/knowledge?created=1')
      router.refresh()
    } catch {
      setError(t('errors.createFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
          className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60"
        >
          {GENERIC_KNOWLEDGE_ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {tTypes(type)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <GenericKnowledgeForm
        key={itemType}
        itemType={itemType}
        parents={parents}
        subcategories={subcategories}
        mode="create"
        labels={labels}
        onSubmit={handleSubmit}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push('/knowledge')}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
