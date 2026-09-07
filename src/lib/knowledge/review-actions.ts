import { createClient } from '@/lib/supabase/server'

export type KnowledgeReviewActionResult = {
  success: boolean
  knowledge_item_version_id?: string
  review_status?: string
  message?: string
}

export async function approveKnowledgeVersion(
  knowledgeItemVersionId: string,
  note?: string,
): Promise<KnowledgeReviewActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'approve_knowledge_version',
    {
      p_knowledge_item_version_id: knowledgeItemVersionId,
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
    knowledge_item_version_id: knowledgeItemVersionId,
    review_status: 'approved',
  }) as KnowledgeReviewActionResult
}

export async function rejectKnowledgeVersion(
  knowledgeItemVersionId: string,
  note: string,
): Promise<KnowledgeReviewActionResult> {
  const trimmedNote = note.trim()

  if (!trimmedNote) {
    throw new Error('A rejection reason is required.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'reject_knowledge_version',
    {
      p_knowledge_item_version_id: knowledgeItemVersionId,
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
    knowledge_item_version_id: knowledgeItemVersionId,
    review_status: 'rejected',
  }) as KnowledgeReviewActionResult
}


export async function publishKnowledgeVersion(
  knowledgeItemVersionId: string,
): Promise<KnowledgeReviewActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'publish_knowledge_version',
    {
      p_knowledge_item_version_id: knowledgeItemVersionId,
    },
  )

  if (error) {
    throw new Error(
      `Failed to publish knowledge version: ${error.message}`,
    )
  }

  return (data ?? {
    success: true,
    knowledge_item_version_id: knowledgeItemVersionId,
    review_status: 'approved',
  }) as KnowledgeReviewActionResult
}
