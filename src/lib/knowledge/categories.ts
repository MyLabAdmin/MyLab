import { createClient } from '@/lib/supabase/server'

export type KnowledgeCategory = {
  id: string
  code: string
  name: string
  description: string | null
  parent_id: string | null
}

export async function getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_categories')
    .select(`
      id,
      code,
      name,
      description,
      parent_id
    `)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to load knowledge categories: ${error.message}`)
  }

  return data ?? []
}
