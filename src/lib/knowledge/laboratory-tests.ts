import { createClient } from '@/lib/supabase/server'

export type LaboratoryTest = {
  id: string
  knowledge_item_id: string
  test_code: string
  loinc_code: string | null
  test_type: string | null
}

export async function getPublishedLaboratoryTests(): Promise<LaboratoryTest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('laboratory_tests')
    .select(`
      id,
      knowledge_item_id,
      test_code,
      loinc_code,
      test_type,
      knowledge_items!inner (
        id,
        knowledge_item_versions!inner (
          id,
          status
        )
      )
    `)
    .eq('knowledge_items.knowledge_item_versions.status', 'published')
    .order('test_code', { ascending: true })

  if (error) {
    throw new Error(`Failed to load published laboratory tests: ${error.message}`)
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    knowledge_item_id: item.knowledge_item_id,
    test_code: item.test_code,
    loinc_code: item.loinc_code,
    test_type: item.test_type,
  }))
}
