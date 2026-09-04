export const KNOWLEDGE_ITEM_TYPES = [
  'test',
  'laboratory_test',
  'procedure',
  'equipment',
  'reference',
  'educational',
] as const

export type KnowledgeItemType = (typeof KNOWLEDGE_ITEM_TYPES)[number]

export const GENERIC_KNOWLEDGE_ITEM_TYPES = [
  'test',
  'procedure',
  'equipment',
  'reference',
  'educational',
] as const

export type GenericKnowledgeItemType =
  (typeof GENERIC_KNOWLEDGE_ITEM_TYPES)[number]

export const KNOWLEDGE_ITEM_STATUSES = [
  'draft',
  'published',
  'archived',
] as const

export type KnowledgeItemStatus = (typeof KNOWLEDGE_ITEM_STATUSES)[number]

export const KNOWLEDGE_VERSION_STATUSES = [
  'draft',
  'published',
  'superseded',
] as const

export type KnowledgeVersionStatus =
  (typeof KNOWLEDGE_VERSION_STATUSES)[number]

export const KNOWLEDGE_REFERENCE_TYPES = [
  'book',
  'journal',
  'guideline',
  'organization',
  'website',
  'manual',
  'other',
] as const

export type KnowledgeReferenceType =
  (typeof KNOWLEDGE_REFERENCE_TYPES)[number]

export type KnowledgeItemVersion = {
  id: string
  knowledge_item_id: string
  version_number: number
  title: string
  subtitle: string | null
  summary: string | null
  content: string | null
  pre_test_preparation: string | null
  status: KnowledgeVersionStatus
  created_by: string
  created_at: string
  published_at: string | null
}

export type KnowledgeItem = {
  id: string
  item_type: KnowledgeItemType
  status: KnowledgeItemStatus
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type PublishedKnowledgeItem = KnowledgeItem & {
  version: KnowledgeItemVersion
}
