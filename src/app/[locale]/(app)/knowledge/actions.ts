'use server'

import {
  createKnowledgeItem,
  type CreateKnowledgeItemResult,
} from '@/lib/knowledge/authoring'
import {
  createLaboratoryTest,
  updateLaboratoryTestDraft,
  type CreateLaboratoryTestInput,
  type CreateLaboratoryTestResult,
} from '@/lib/knowledge/laboratory-test-authoring'

export async function createKnowledgeItemAction(
  input: unknown,
): Promise<CreateKnowledgeItemResult> {
  return createKnowledgeItem(input)
}

export async function createLaboratoryTestAction(
  input: CreateLaboratoryTestInput,
): Promise<CreateLaboratoryTestResult> {
  return createLaboratoryTest(input)
}


export async function updateLaboratoryTestDraftAction(
  input: unknown,
): Promise<CreateLaboratoryTestResult> {
  return updateLaboratoryTestDraft(input)
}
