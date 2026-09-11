import type { KnowledgeItemType } from './types'

export type KnowledgeFormKind =
  | 'generic'
  | 'laboratory_test'

export type KnowledgeDetailKind =
  | 'generic'
  | 'laboratory_test'

export type KnowledgeSpecializedEntity =
  | 'none'
  | 'laboratory_test'
  | 'pathogen'
  | 'procedure'
  | 'equipment'

export type KnowledgeTaxonomyKind =
  | 'category_subcategory'
  | 'none'

export type KnowledgeSection =
  | 'core'
  | 'taxonomy'
  | 'content'
  | 'images'
  | 'references'
  | 'translations'
  | 'access'
  | 'pre_test_preparation'
  | 'pathogen'
  | 'procedure'
  | 'equipment'
  | 'specimens'
  | 'reference_ranges'
  | 'methods'
  | 'interpretations'

export type KnowledgeTypeConfig = {
  type: KnowledgeItemType
  labelKey: string
  descriptionKey: string
  form: KnowledgeFormKind
  detail: KnowledgeDetailKind
  specializedEntity: KnowledgeSpecializedEntity
  taxonomy: KnowledgeTaxonomyKind

  supportsImages: boolean
  supportsReferences: boolean
  supportsTranslations: boolean
  supportsCategories: boolean
  supportsAccessPolicy: boolean
  supportsPreTestPreparation: boolean

  sections: readonly KnowledgeSection[]
}

const SHARED_GENERIC_SECTIONS = [
  'core',
  'taxonomy',
  'content',
  'images',
  'references',
  'translations',
  'access',
] as const satisfies readonly KnowledgeSection[]

const SHARED_LABORATORY_TEST_SECTIONS = [
  'core',
  'taxonomy',
  'content',
  'pre_test_preparation',
  'specimens',
  'reference_ranges',
  'methods',
  'interpretations',
  'images',
  'references',
  'translations',
  'access',
] as const satisfies readonly KnowledgeSection[]

export const KNOWLEDGE_TYPE_CONFIG: Record<
  KnowledgeItemType,
  KnowledgeTypeConfig
> = {
  test: {
    type: 'test',
    labelKey: 'test',
    descriptionKey: 'testDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'none',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: SHARED_GENERIC_SECTIONS,
  },

  laboratory_test: {
    type: 'laboratory_test',
    labelKey: 'laboratoryTest',
    descriptionKey: 'laboratoryTestDescription',
    form: 'laboratory_test',
    detail: 'laboratory_test',
    specializedEntity: 'laboratory_test',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: true,
    sections: SHARED_LABORATORY_TEST_SECTIONS,
  },

  pathogen: {
    type: 'pathogen',
    labelKey: 'pathogen',
    descriptionKey: 'pathogenDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'pathogen',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: [
      ...SHARED_GENERIC_SECTIONS,
      'pathogen',
    ],
  },

  procedure: {
    type: 'procedure',
    labelKey: 'procedure',
    descriptionKey: 'procedureDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'procedure',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: [
      ...SHARED_GENERIC_SECTIONS,
      'procedure',
    ],
  },

  equipment: {
    type: 'equipment',
    labelKey: 'equipment',
    descriptionKey: 'equipmentDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'equipment',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: [
      ...SHARED_GENERIC_SECTIONS,
      'equipment',
    ],
  },

  reference: {
    type: 'reference',
    labelKey: 'reference',
    descriptionKey: 'referenceDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'none',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: SHARED_GENERIC_SECTIONS,
  },

  educational: {
    type: 'educational',
    labelKey: 'educational',
    descriptionKey: 'educationalDescription',
    form: 'generic',
    detail: 'generic',
    specializedEntity: 'none',
    taxonomy: 'category_subcategory',
    supportsImages: true,
    supportsReferences: true,
    supportsTranslations: true,
    supportsCategories: true,
    supportsAccessPolicy: true,
    supportsPreTestPreparation: false,
    sections: SHARED_GENERIC_SECTIONS,
  },
}

export function getKnowledgeTypeConfig(
  type: KnowledgeItemType,
): KnowledgeTypeConfig {
  return KNOWLEDGE_TYPE_CONFIG[type]
}
