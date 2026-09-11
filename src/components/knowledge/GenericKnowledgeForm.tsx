'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { KnowledgeFormShell } from './form/KnowledgeFormShell'
import {
  KnowledgeCoreSection,
  type KnowledgeCoreValues,
} from './form/KnowledgeCoreSection'
import {
  KnowledgeTaxonomySection,
  type KnowledgeTaxonomyValues,
} from './form/KnowledgeTaxonomySection'
import {
  KnowledgeEducationalSection,
  KnowledgeEquipmentSection,
  KnowledgePathogenSection,
  KnowledgeProcedureSection,
  KnowledgeReferenceSection,
  type KnowledgeEquipmentValues,
  type KnowledgePathogenValues,
  type KnowledgeProcedureValues,
  type KnowledgeReferenceValues,
} from './form/specialized'
import type {
  KnowledgeCategory,
  KnowledgeCategoryOption,
} from '@/lib/knowledge/categories'
import type { GenericKnowledgeItemType } from '@/lib/knowledge/types'

type Props = {
  itemType: GenericKnowledgeItemType
  parents: KnowledgeCategory[]
  subcategories: KnowledgeCategoryOption[]
  mode?: 'create' | 'edit' | 'readOnly'
  initialValues?: {
    core?: Partial<KnowledgeCoreValues>
    taxonomy?: Partial<KnowledgeTaxonomyValues>
    specializedData?: Record<string, unknown>
  }
  onSubmit?: (values: GenericKnowledgeFormValues) => void | Promise<void>
  labels: GenericKnowledgeFormLabels
}

export type GenericKnowledgeFormValues = {
  itemType: GenericKnowledgeItemType
  core: KnowledgeCoreValues
  taxonomy: KnowledgeTaxonomyValues
  specializedData: Record<string, unknown>
}

export type GenericKnowledgeFormLabels = {
  core: {
    sectionTitle: string
    sectionDescription: string
    title: string
    titlePlaceholder: string
    summary: string
    summaryPlaceholder: string
    content: string
    contentPlaceholder: string
  }
  taxonomy: {
    sectionTitle: string
    sectionDescription: string
    primaryCategory: string
    primaryCategoryPlaceholder: string
    subcategory: string
    subcategoryPlaceholder: string
  }
  pathogen: {
    sectionTitle: string
    sectionDescription: string
    scientificName: string
    commonName: string
    pathogenGroup: string
    genus: string
    species: string
    strainOrSerotype: string
  }
  equipment: {
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
  procedure: {
    sectionTitle: string
    sectionDescription: string
    procedureCode: string
  }
  reference: {
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
  educational: {
    sectionTitle: string
    sectionDescription: string
  }
}

const EMPTY_CORE: KnowledgeCoreValues = {
  title: '',
  summary: '',
  content: '',
}

const EMPTY_TAXONOMY: KnowledgeTaxonomyValues = {
  primaryCategoryId: '',
  subcategoryId: '',
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function GenericKnowledgeForm({
  itemType,
  parents,
  subcategories,
  mode = 'create',
  initialValues,
  onSubmit,
  labels,
}: Props) {
  const readOnly = mode === 'readOnly'

  const [core, setCore] = useState<KnowledgeCoreValues>({
    ...EMPTY_CORE,
    ...initialValues?.core,
  })

  const [taxonomy, setTaxonomy] =
    useState<KnowledgeTaxonomyValues>({
      ...EMPTY_TAXONOMY,
      ...initialValues?.taxonomy,
    })

  const [specializedData, setSpecializedData] =
    useState<Record<string, unknown>>(
      initialValues?.specializedData ?? {},
    )

  const pathogen = useMemo<KnowledgePathogenValues>(
    () => ({
      scientific_name: toStringValue(
        specializedData.scientific_name,
      ),
      common_name: toStringValue(
        specializedData.common_name,
      ),
      pathogen_group: toStringValue(
        specializedData.pathogen_group,
      ),
      genus: toStringValue(specializedData.genus),
      species: toStringValue(specializedData.species),
      strain_or_serotype: toStringValue(
        specializedData.strain_or_serotype,
      ),
    }),
    [specializedData],
  )

  const equipment = useMemo<KnowledgeEquipmentValues>(
    () => ({
      equipment_code: toStringValue(
        specializedData.equipment_code,
      ),
      manufacturer: toStringValue(
        specializedData.manufacturer,
      ),
      model: toStringValue(specializedData.model),
      equipment_type: toStringValue(
        specializedData.equipment_type,
      ),
      manufacturer_part_number: toStringValue(
        specializedData.manufacturer_part_number,
      ),
      description: toStringValue(
        specializedData.description,
      ),
      active: toBooleanValue(
        specializedData.active,
        true,
      ),
    }),
    [specializedData],
  )

  const procedure = useMemo<KnowledgeProcedureValues>(
    () => ({
      procedure_code: toStringValue(
        specializedData.procedure_code,
      ),
    }),
    [specializedData],
  )

  const reference = useMemo<KnowledgeReferenceValues>(
    () => ({
      referenceType: toStringValue(
        specializedData.referenceType,
      ),
      citation: toStringValue(
        specializedData.citation,
      ),
      url: toStringValue(specializedData.url),
    }),
    [specializedData],
  )

  function updateCore(
    field: keyof KnowledgeCoreValues,
    value: string,
  ) {
    setCore((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateTaxonomy(
    field: keyof KnowledgeTaxonomyValues,
    value: string,
  ) {
    setTaxonomy((current) => ({
      ...current,
      [field]: value,
      ...(field === 'primaryCategoryId'
        ? { subcategoryId: '' }
        : {}),
    }))
  }

  function updateSpecialized(
    field: string,
    value: string | boolean,
  ) {
    setSpecializedData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (readOnly || !onSubmit) {
      return
    }

    await onSubmit({
      itemType,
      core,
      taxonomy,
      specializedData,
    })
  }

  return (
    <KnowledgeFormShell
      itemType={itemType}
      mode={mode}
      onSubmit={handleSubmit}
    >
      <KnowledgeCoreSection
        values={core}
        onChange={updateCore}
        labels={labels.core}
        readOnly={readOnly}
      />

      <KnowledgeTaxonomySection
        values={taxonomy}
        parents={parents}
        subcategories={subcategories}
        onChange={updateTaxonomy}
        labels={labels.taxonomy}
        readOnly={readOnly}
      />

      {itemType === 'pathogen' ? (
        <KnowledgePathogenSection
          values={pathogen}
          onChange={updateSpecialized}
          labels={labels.pathogen}
          readOnly={readOnly}
        />
      ) : null}

      {itemType === 'equipment' ? (
        <KnowledgeEquipmentSection
          values={equipment}
          onChange={updateSpecialized}
          labels={labels.equipment}
          readOnly={readOnly}
        />
      ) : null}

      {itemType === 'procedure' ? (
        <KnowledgeProcedureSection
          values={procedure}
          onChange={updateSpecialized}
          labels={labels.procedure}
          readOnly={readOnly}
        />
      ) : null}

      {itemType === 'reference' ? (
        <KnowledgeReferenceSection
          values={reference}
          onChange={updateSpecialized}
          labels={labels.reference}
          readOnly={readOnly}
        />
      ) : null}

      {itemType === 'educational' ? (
        <KnowledgeEducationalSection
          labels={labels.educational}
        />
      ) : null}
    </KnowledgeFormShell>
  )
}
