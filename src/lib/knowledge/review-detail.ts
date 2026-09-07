import { createClient } from '@/lib/supabase/server'

import type {
  LaboratoryTestInterpretationInput,
  LaboratoryTestMethodInput,
  LaboratoryTestReferenceRangeInput,
  LaboratoryTestSpecimenInput,
} from '@/lib/knowledge/laboratory-test-authoring'

export type KnowledgeReviewDetail = {
  knowledge_item_id: string
  knowledge_item_version_id: string
  item_type: string
  laboratory_test_id: string | null
  laboratory_test_version_id: string | null
  version_number: number
  review_status: string
  title: string
  subtitle: string | null
  summary: string | null
  content: string | null
  pre_test_preparation: string | null
  test_code: string | null
  loinc_code: string | null
  category_id: string | null
  primary_category_id: string | null
  specimens: LaboratoryTestSpecimenInput[]
  methods: LaboratoryTestMethodInput[]
  interpretations: LaboratoryTestInterpretationInput[]
  reference_ranges: LaboratoryTestReferenceRangeInput[]
}

export async function getKnowledgeReviewDetail(
  knowledgeItemVersionId: string,
): Promise<KnowledgeReviewDetail> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_knowledge_review_detail',
    {
      p_knowledge_item_version_id: knowledgeItemVersionId,
    },
  )

  if (error) {
    throw new Error(
      `Failed to load knowledge review detail: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(
      'Knowledge review version was not found or is no longer available.',
    )
  }

  return data as KnowledgeReviewDetail
}
