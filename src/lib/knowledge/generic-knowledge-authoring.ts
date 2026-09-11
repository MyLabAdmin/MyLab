import { createClient } from '@/lib/supabase/server'
import type {
  GenericKnowledgeItemType,
} from './types'

export type GenericKnowledgeSpecializedData = Record<string, unknown>

export type CreateGenericKnowledgeItemInput = {
  itemType: GenericKnowledgeItemType
  title: string
  summary?: string | null
  content?: string | null
  primaryCategoryId: string
  subcategoryId?: string | null
  specializedData?: GenericKnowledgeSpecializedData
}

export type UpdateGenericKnowledgeDraftInput =
  CreateGenericKnowledgeItemInput & {
    knowledgeItemVersionId: string
  }

export type GenericKnowledgeAuthoringResult = {
  knowledge_item_id: string
  knowledge_item_version_id: string
  version_number: number
  knowledge_code?: string
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid optional text value')
  }

  return value.trim() || null
}

function normalizeSpecializedData(
  value: unknown,
): GenericKnowledgeSpecializedData {
  if (value === undefined || value === null) {
    return {}
  }

  if (
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error('Invalid specialized knowledge data')
  }

  return value as GenericKnowledgeSpecializedData
}

function validateCreateInput(
  input: unknown,
): CreateGenericKnowledgeItemInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid generic knowledge item input')
  }

  const value = input as Record<string, unknown>

  if (
    typeof value.itemType !== 'string' ||
    ![
      'test',
      'pathogen',
      'procedure',
      'equipment',
      'reference',
      'educational',
    ].includes(value.itemType)
  ) {
    throw new Error('Invalid generic knowledge item type')
  }

  if (typeof value.title !== 'string' || !value.title.trim()) {
    throw new Error('Knowledge item title is required')
  }

  if (
    typeof value.primaryCategoryId !== 'string' ||
    !value.primaryCategoryId
  ) {
    throw new Error('Knowledge primary category is required')
  }

  if (
    value.subcategoryId !== undefined &&
    value.subcategoryId !== null &&
    typeof value.subcategoryId !== 'string'
  ) {
    throw new Error('Invalid knowledge subcategory')
  }

  return {
    itemType: value.itemType as GenericKnowledgeItemType,
    title: value.title.trim(),
    summary: normalizeOptionalText(value.summary),
    content: normalizeOptionalText(value.content),
    primaryCategoryId: value.primaryCategoryId,
    subcategoryId:
      typeof value.subcategoryId === 'string'
        ? value.subcategoryId
        : null,
    specializedData: normalizeSpecializedData(
      value.specializedData,
    ),
  }
}

function validateUpdateInput(
  input: unknown,
): UpdateGenericKnowledgeDraftInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid generic knowledge draft input')
  }

  const value = input as Record<string, unknown>

  if (
    typeof value.knowledgeItemVersionId !== 'string' ||
    !value.knowledgeItemVersionId
  ) {
    throw new Error('Knowledge item version is required')
  }

  const validated = validateCreateInput(value)

  return {
    ...validated,
    knowledgeItemVersionId:
      value.knowledgeItemVersionId,
  }
}

export async function createGenericKnowledgeItem(
  input: unknown,
): Promise<GenericKnowledgeAuthoringResult> {
  const validated = validateCreateInput(input)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'create_generic_knowledge_item',
    {
      p_item_type: validated.itemType,
      p_title: validated.title,
      p_summary: validated.summary,
      p_content: validated.content,
      p_primary_category_id:
        validated.primaryCategoryId,
      p_subcategory_id:
        validated.subcategoryId,
      p_specialized_data:
        validated.specializedData,
    },
  )

  if (error) {
    throw new Error(
      `Failed to create generic knowledge item: ${error.message}`,
    )
  }

  return data as GenericKnowledgeAuthoringResult
}

export async function updateGenericKnowledgeDraft(
  input: unknown,
): Promise<GenericKnowledgeAuthoringResult> {
  const validated = validateUpdateInput(input)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'update_generic_knowledge_draft',
    {
      p_knowledge_item_version_id:
        validated.knowledgeItemVersionId,
      p_title: validated.title,
      p_summary: validated.summary,
      p_content: validated.content,
      p_primary_category_id:
        validated.primaryCategoryId,
      p_subcategory_id:
        validated.subcategoryId,
      p_specialized_data:
        validated.specializedData,
    },
  )

  if (error) {
    throw new Error(
      `Failed to update generic knowledge draft: ${error.message}`,
    )
  }

  return data as GenericKnowledgeAuthoringResult
}
