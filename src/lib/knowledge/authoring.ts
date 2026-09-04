import { createClient } from '@/lib/supabase/server'
import {
  KNOWLEDGE_ITEM_TYPES,
  type KnowledgeItemType,
} from './types'

export type CreateKnowledgeItemInput = {
  itemType: KnowledgeItemType
  title: string
  summary?: string | null
  content?: string | null
}

export type CreateKnowledgeItemResult = {
  knowledge_item_id: string
  knowledge_item_version_id: string
  version_number: number
}

function isKnowledgeItemType(value: unknown): value is KnowledgeItemType {
  return (
    typeof value === 'string' &&
    (KNOWLEDGE_ITEM_TYPES as readonly string[]).includes(value)
  )
}

function validateCreateKnowledgeItemInput(
  input: unknown,
): CreateKnowledgeItemInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid knowledge item input')
  }

  const value = input as Record<string, unknown>

  if (!isKnowledgeItemType(value.itemType)) {
    throw new Error('Invalid knowledge item type')
  }

  if (typeof value.title !== 'string') {
    throw new Error('Knowledge item title is required')
  }

  const title = value.title.trim()

  if (!title) {
    throw new Error('Knowledge item title is required')
  }

  if (
    value.summary !== undefined &&
    value.summary !== null &&
    typeof value.summary !== 'string'
  ) {
    throw new Error('Invalid knowledge item summary')
  }

  if (
    value.content !== undefined &&
    value.content !== null &&
    typeof value.content !== 'string'
  ) {
    throw new Error('Invalid knowledge item content')
  }

  return {
    itemType: value.itemType,
    title,
    summary: typeof value.summary === 'string'
      ? value.summary.trim() || null
      : null,
    content: typeof value.content === 'string'
      ? value.content.trim() || null
      : null,
  }
}

export async function createKnowledgeItem(
  input: unknown,
): Promise<CreateKnowledgeItemResult> {
  const validated = validateCreateKnowledgeItemInput(input)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('create_knowledge_item', {
    p_item_type: validated.itemType,
    p_title: validated.title,
    p_summary: validated.summary,
    p_content: validated.content,
  })

  if (error) {
    throw new Error(`Failed to create knowledge item: ${error.message}`)
  }

  return data as CreateKnowledgeItemResult
}
