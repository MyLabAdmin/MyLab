import { createClient } from '@/lib/supabase/server'

import type {
  LaboratoryTestInterpretationInput,
  LaboratoryTestMethodInput,
  LaboratoryTestReferenceRangeInput,
  LaboratoryTestSpecimenInput,
} from '@/lib/knowledge/laboratory-test-authoring'

export type LaboratoryTestDraft = {
  knowledge_item_id: string
  knowledge_item_version_id: string
  laboratory_test_id: string
  laboratory_test_version_id: string
  version_number: number
  title: string
  subtitle: string | null
  summary: string | null
  content: string | null
  pre_test_preparation: string | null
  test_code: string
  loinc_code: string | null
  category_id: string | null
  primary_category_id: string | null
  specimens: LaboratoryTestSpecimenInput[]
  methods: LaboratoryTestMethodInput[]
  interpretations: LaboratoryTestInterpretationInput[]
  reference_ranges: LaboratoryTestReferenceRangeInput[]
}

export async function getLaboratoryTestDraft(
  laboratoryTestId: string,
): Promise<LaboratoryTestDraft> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_laboratory_test_draft',
    {
      p_laboratory_test_id: laboratoryTestId,
    },
  )

  if (error) {
    throw new Error(
      `Failed to load laboratory test draft: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(
      'Laboratory test draft was not found.',
    )
  }

  return data as LaboratoryTestDraft
}
