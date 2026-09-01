import { createClient } from '@/lib/supabase/server'
import type {
  KnowledgeItem,
  KnowledgeItemVersion,
  PublishedKnowledgeItem,
} from './types'

type PublishedKnowledgeItemRow = KnowledgeItem & {
  knowledge_item_versions: KnowledgeItemVersion[]
}

export async function getPublishedKnowledgeItems(): Promise<
  PublishedKnowledgeItem[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_items')
    .select(`
      id,
      item_type,
      status,
      created_by,
      updated_by,
      created_at,
      updated_at,
      knowledge_item_versions!inner (
        id,
        knowledge_item_id,
        version_number,
        title,
        summary,
        content,
        status,
        created_by,
        created_at,
        published_at
      )
    `)
    .eq('status', 'published')
    .eq('knowledge_item_versions.status', 'published')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load published knowledge items: ${error.message}`)
  }

  return ((data ?? []) as PublishedKnowledgeItemRow[])
    .map((item) => {
      const version = item.knowledge_item_versions[0]

      if (!version) {
        return null
      }

      return {
        id: item.id,
        item_type: item.item_type,
        status: item.status,
        created_by: item.created_by,
        updated_by: item.updated_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        version,
      }
    })
    .filter((item): item is PublishedKnowledgeItem => item !== null)
}
