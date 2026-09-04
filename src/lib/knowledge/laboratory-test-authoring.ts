import { createClient } from '@/lib/supabase/server'

export type LaboratoryTestSpecimenInput = {
  specimen_type: string
  container?: string | null
  handling_instructions?: string | null
}

export type LaboratoryTestMethodInput = {
  method_name: string
  description?: string | null
}

export type LaboratoryTestInterpretationInput = {
  condition: string
  interpretation: string
  clinical_significance?: string | null
  notes?: string | null
}

export type LaboratoryTestReferenceRangeInput = {
  specimen_type?: string | null
  method_name?: string | null
  population_label: string
  age_min?: number | null
  age_max?: number | null
  age_unit?: string | null
  sex?: string | null
  lower_value?: number | null
  upper_value?: number | null
  unit: string
  notes?: string | null
}

export type CreateLaboratoryTestInput = {
  title: string
  subtitle?: string | null
  summary?: string | null
  content?: string | null
  pre_test_preparation?: string | null
  test_code: string
  loinc_code?: string | null
  primary_category_id: string
  subcategory_id: string
  specimens: LaboratoryTestSpecimenInput[]
  methods?: LaboratoryTestMethodInput[]
  interpretations?: LaboratoryTestInterpretationInput[]
  reference_ranges?: LaboratoryTestReferenceRangeInput[]
}


export type UpdateLaboratoryTestDraftInput =
  CreateLaboratoryTestInput & {
    laboratory_test_id: string
  }

export type CreateLaboratoryTestResult = {
  knowledge_item_id: string
  knowledge_item_version_id: string
  laboratory_test_id: string
  laboratory_test_version_id: string
  version_number: number
  category_id: string
  primary_category_id: string
}

function normalizeRequiredText(
  value: unknown,
  field: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} is required`)
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${field} is required`)
  }

  return normalized
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid text value')
  }

  return value.trim() || null
}

function normalizeArray<T>(
  value: unknown,
  field: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`)
  }

  return value as T[]
}

function validateInput(
  input: unknown,
): CreateLaboratoryTestInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid laboratory test input')
  }

  const value = input as Record<string, unknown>

  const specimens = normalizeArray<LaboratoryTestSpecimenInput>(
    value.specimens,
    'Specimens',
  )

  if (specimens.length === 0) {
    throw new Error('At least one specimen is required')
  }

  return {
    title: normalizeRequiredText(value.title, 'Test name'),
    subtitle: normalizeOptionalText(value.subtitle),
    summary: normalizeOptionalText(value.summary),
    content: normalizeOptionalText(value.content),
    pre_test_preparation: normalizeOptionalText(
      value.pre_test_preparation,
    ),
    test_code: normalizeRequiredText(value.test_code, 'Test code'),
    loinc_code: normalizeOptionalText(value.loinc_code),
    primary_category_id: normalizeRequiredText(
      value.primary_category_id,
      'Primary category',
    ),
    subcategory_id: normalizeRequiredText(
      value.subcategory_id,
      'Subcategory',
    ),
    specimens,
    methods: normalizeArray<LaboratoryTestMethodInput>(
      value.methods ?? [],
      'Methods',
    ),
    interpretations: normalizeArray<LaboratoryTestInterpretationInput>(
      value.interpretations ?? [],
      'Interpretations',
    ),
    reference_ranges: normalizeArray<LaboratoryTestReferenceRangeInput>(
      value.reference_ranges ?? [],
      'Reference ranges',
    ),
  }
}

export async function createLaboratoryTest(
  input: unknown,
): Promise<CreateLaboratoryTestResult> {
  const validated = validateInput(input)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'create_laboratory_test',
    {
      p_title: validated.title,
      p_subtitle: validated.subtitle,
      p_summary: validated.summary,
      p_content: validated.content,
      p_pre_test_preparation:
        validated.pre_test_preparation,
      p_test_code: validated.test_code,
      p_loinc_code: validated.loinc_code,
      p_primary_category_id:
        validated.primary_category_id,
      p_subcategory_id:
        validated.subcategory_id,
      p_specimens: validated.specimens,
      p_methods: validated.methods,
      p_interpretations:
        validated.interpretations,
      p_reference_ranges:
        validated.reference_ranges,
    },
  )

  if (error) {
    throw new Error(
      `Failed to create laboratory test: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(
      'Failed to create laboratory test: no result returned',
    )
  }

  return data as CreateLaboratoryTestResult
}


function validateUpdateInput(
  input: unknown,
): UpdateLaboratoryTestDraftInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid laboratory test draft input')
  }

  const value = input as Record<string, unknown>

  return {
    ...validateInput(value),
    laboratory_test_id: normalizeRequiredText(
      value.laboratory_test_id,
      'Laboratory test ID',
    ),
  }
}

export async function updateLaboratoryTestDraft(
  input: unknown,
): Promise<CreateLaboratoryTestResult> {
  const validated = validateUpdateInput(input)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'update_laboratory_test_draft',
    {
      p_laboratory_test_id: validated.laboratory_test_id,
      p_title: validated.title,
      p_subtitle: validated.subtitle,
      p_summary: validated.summary,
      p_content: validated.content,
      p_pre_test_preparation: validated.pre_test_preparation,
      p_test_code: validated.test_code,
      p_loinc_code: validated.loinc_code,
      p_primary_category_id: validated.primary_category_id,
      p_subcategory_id: validated.subcategory_id,
      p_specimens: validated.specimens,
      p_methods: validated.methods,
      p_interpretations: validated.interpretations,
      p_reference_ranges: validated.reference_ranges,
    },
  )

  if (error) {
    throw new Error(
      `Failed to update laboratory test draft: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(
      'Failed to update laboratory test draft: no result returned',
    )
  }

  return data as CreateLaboratoryTestResult
}
