import { createClient } from '@/lib/supabase/server'

export type KnowledgeReviewActionResult = {
  success: boolean
  knowledge_item_id?: string
  knowledge_item_version_id?: string
  review_status?: string
  message?: string
}

export async function submitKnowledgeVersionForReview(
  knowledgeItemVersionId: string,
): Promise<KnowledgeReviewActionResult> {
  const normalizedVersionId = knowledgeItemVersionId.trim()

  if (!normalizedVersionId) {
    throw new Error('Knowledge version id is required.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'submit_knowledge_version_for_review',
    {
      p_knowledge_item_version_id: normalizedVersionId,
    },
  )

  if (error) {
    throw new Error(
      `Failed to submit knowledge version for review: ${error.message}`,
    )
  }

  return (data ?? {
    success: true,
    knowledge_item_version_id: normalizedVersionId,
    review_status: 'pending_review',
  }) as KnowledgeReviewActionResult
}

export async function approveKnowledgeVersion(
  knowledgeItemVersionId: string,
  note?: string,
): Promise<KnowledgeReviewActionResult> {
  const normalizedVersionId = knowledgeItemVersionId.trim()

  if (!normalizedVersionId) {
    throw new Error('Knowledge version id is required.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'approve_knowledge_version',
    {
      p_knowledge_item_version_id: normalizedVersionId,
      p_note: note?.trim() || null,
    },
  )

  if (error) {
    throw new Error(
      `Failed to approve knowledge version: ${error.message}`,
    )
  }

  return (data ?? {
    success: true,
    knowledge_item_version_id: normalizedVersionId,
    review_status: 'approved',
  }) as KnowledgeReviewActionResult
}

export async function rejectKnowledgeVersion(
  knowledgeItemVersionId: string,
  note: string,
): Promise<KnowledgeReviewActionResult> {
  const normalizedVersionId = knowledgeItemVersionId.trim()
  const trimmedNote = note.trim()

  if (!normalizedVersionId) {
    throw new Error('Knowledge version id is required.')
  }

  if (!trimmedNote) {
    throw new Error('A rejection reason is required.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'reject_knowledge_version',
    {
      p_knowledge_item_version_id: normalizedVersionId,
      p_note: trimmedNote,
    },
  )

  if (error) {
    throw new Error(
      `Failed to reject knowledge version: ${error.message}`,
    )
  }

  return (data ?? {
    success: true,
    knowledge_item_version_id: normalizedVersionId,
    review_status: 'rejected',
  }) as KnowledgeReviewActionResult
}

export async function publishKnowledgeVersion(
  knowledgeItemVersionId: string,
): Promise<KnowledgeReviewActionResult> {
  const normalizedVersionId = knowledgeItemVersionId.trim()

  if (!normalizedVersionId) {
    throw new Error('Knowledge version id is required.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'publish_knowledge_version',
    {
      p_knowledge_item_version_id: normalizedVersionId,
    },
  )

  if (error) {
    throw new Error(
      `Failed to publish knowledge version: ${error.message}`,
    )
  }

  return (data ?? {
    success: true,
    knowledge_item_version_id: normalizedVersionId,
    review_status: 'approved',
  }) as KnowledgeReviewActionResult
}
