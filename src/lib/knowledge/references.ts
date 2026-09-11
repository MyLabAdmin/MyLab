import { createClient } from '@/lib/supabase/server'
import type { KnowledgeReferenceType } from './types'

export type KnowledgeReference = {
  id: string
  knowledge_item_id: string
  reference_type: KnowledgeReferenceType
  title: string
  authors: string | null
  publisher: string | null
  publication_year: number | null
  doi: string | null
  url: string | null
  citation_text: string | null
}

export async function getKnowledgeReferences(
  knowledgeItemId: string,
): Promise<KnowledgeReference[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_references')
    .select(`
      id,
      knowledge_item_id,
      reference_type,
      title,
      authors,
      publisher,
      publication_year,
      doi,
      url,
      citation_text
    `)
    .eq('knowledge_item_id', knowledgeItemId)
    .order('publication_year', { ascending: false, nullsFirst: false })
    .order('title', { ascending: true })

  if (error) {
    throw new Error(`Failed to load knowledge references: ${error.message}`)
  }

  return (data ?? []) as KnowledgeReference[]
}
