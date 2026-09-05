import { createClient } from '@/lib/supabase/server'

export type KnowledgeReviewQueueItem = {
  knowledge_item_version_id: string
  knowledge_item_id: string
  item_type: string
  title: string
  summary: string | null
  version_number: number
  created_by: string
  created_at: string
  review_updated_at: string | null
}

export async function getKnowledgeReviewQueue(): Promise<
  KnowledgeReviewQueueItem[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_knowledge_review_queue')

  if (error) {
    throw new Error(
      `Failed to load knowledge review queue: ${error.message}`,
    )
  }

  return (data ?? []) as KnowledgeReviewQueueItem[]
}
