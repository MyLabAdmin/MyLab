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
import {
  approveKnowledgeVersion,
  rejectKnowledgeVersion,
  publishKnowledgeVersion,
  type KnowledgeReviewActionResult,
} from '@/lib/knowledge/review-actions'

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


export async function approveKnowledgeVersionAction(
  knowledgeItemVersionId: string,
  note?: string,
): Promise<KnowledgeReviewActionResult> {
  return approveKnowledgeVersion(knowledgeItemVersionId, note)
}

export async function rejectKnowledgeVersionAction(
  knowledgeItemVersionId: string,
  note: string,
): Promise<KnowledgeReviewActionResult> {
  return rejectKnowledgeVersion(knowledgeItemVersionId, note)
}


export async function publishKnowledgeVersionAction(
  knowledgeItemVersionId: string,
): Promise<KnowledgeReviewActionResult> {
  return publishKnowledgeVersion(knowledgeItemVersionId)
}
