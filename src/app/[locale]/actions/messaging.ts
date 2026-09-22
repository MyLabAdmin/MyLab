'use server'

import { createClient } from '@/lib/supabase/server'

type ConversationType = 'direct' | 'group'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return { supabase, user: null }
  return { supabase, user: data.user }
}

function makeDirectKey(userA: string, userB: string) {
  return [userA, userB].sort().join(':')
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (!otherUserId || otherUserId === user.id) {
    return { success: false as const, error: 'Invalid recipient' }
  }

  const directKey = makeDirectKey(user.id, otherUserId)

  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id, type, title, created_by, created_at, updated_at')
    .eq('type', 'direct')
    .eq('direct_key', directKey)
    .maybeSingle()

  if (findError) {
    return { success: false as const, error: findError.message }
  }

  if (existing) {
    return { success: true as const, conversation: existing }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct' as ConversationType,
      direct_key: directKey,
      created_by: user.id,
    })
    .select('id, type, title, created_by, created_at, updated_at')
    .single()

  if (conversationError || !conversation) {
    // Another request may have created it concurrently.
    const { data: concurrent } = await supabase
      .from('conversations')
      .select('id, type, title, created_by, created_at, updated_at')
      .eq('type', 'direct')
      .eq('direct_key', directKey)
      .maybeSingle()

    if (concurrent) {
      return { success: true as const, conversation: concurrent }
    }

    return {
      success: false as const,
      error: conversationError?.message ?? 'Failed to create conversation',
    }
  }

  const { error: creatorMemberError } = await supabase
    .from('conversation_members')
    .insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'admin',
    })

  if (creatorMemberError) {
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id)

    return {
      success: false as const,
      error: creatorMemberError.message,
    }
  }

  const { error: otherMemberError } = await supabase
    .from('conversation_members')
    .insert({
      conversation_id: conversation.id,
      user_id: otherUserId,
      role: 'member',
    })

  if (otherMemberError) {
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id)

    return {
      success: false as const,
      error: otherMemberError.message,
    }
  }

  return {
    success: true as const,
    conversation,
  }
}

export async function createGroupConversation(
  title: string,
  memberIds: string[] = [],
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const cleanTitle = title.trim()

  if (!cleanTitle) {
    return { success: false as const, error: 'Conversation title is required' }
  }

  const uniqueMemberIds = Array.from(
    new Set([user.id, ...memberIds.filter(Boolean)]),
  )

  if (uniqueMemberIds.length > 100) {
    return {
      success: false as const,
      error: 'A group conversation can have a maximum of 100 members',
    }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: 'group' as ConversationType,
      title: cleanTitle,
      created_by: user.id,
    })
    .select('id, type, title, created_by, created_at, updated_at')
    .single()

  if (conversationError || !conversation) {
    return {
      success: false as const,
      error: conversationError?.message ?? 'Failed to create conversation',
    }
  }

  const members = uniqueMemberIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
    role: userId === user.id ? 'admin' : 'member',
  }))

  const { error: creatorMemberError } = await supabase
    .from('conversation_members')
    .insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'admin',
    })

  if (creatorMemberError) {
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id)

    return {
      success: false as const,
      error: creatorMemberError.message,
    }
  }

  const otherMembers = members.filter((member) => member.user_id !== user.id)

  if (otherMembers.length > 0) {
    const { error: otherMembersError } = await supabase
      .from('conversation_members')
      .insert(otherMembers)

    if (otherMembersError) {
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id)

      return {
        success: false as const,
        error: otherMembersError.message,
      }
    }
  }

  return {
    success: true as const,
    conversation,
  }
}

export async function getConversation(conversationId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (!conversationId) {
    return { success: false as const, error: 'Conversation ID is required' }
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(`
      id,
      type,
      title,
      created_by,
      created_at,
      updated_at,
      conversation_members (
        user_id,
        role,
        joined_at,
        last_read_at,
        muted_at
      )
    `)
    .eq('id', conversationId)
    .single()

  if (error || !conversation) {
    return {
      success: false as const,
      error: error?.message ?? 'Conversation not found',
    }
  }

  return {
    success: true as const,
    conversation,
  }
}

export async function getMessages(
  conversationId: string,
  limit = 30,
  before?: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (!conversationId) {
    return { success: false as const, error: 'Conversation ID is required' }
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50)

  let query = supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      client_message_id,
      body,
      created_at,
      edited_at,
      deleted_at
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(safeLimit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    return { success: false as const, error: error.message }
  }

  const messages = [...(data ?? [])].reverse()

  return {
    success: true as const,
    messages,
    hasMore: (data?.length ?? 0) === safeLimit,
  }
}

export async function sendMessage(
  conversationId: string,
  body: string,
  clientMessageId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const cleanBody = body.trim()

  if (!conversationId) {
    return { success: false as const, error: 'Conversation ID is required' }
  }

  if (!cleanBody) {
    return { success: false as const, error: 'Message cannot be empty' }
  }

  if (!clientMessageId) {
    return { success: false as const, error: 'Client message ID is required' }
  }

  const { data: existing } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      client_message_id,
      body,
      created_at,
      edited_at,
      deleted_at
    `)
    .eq('sender_id', user.id)
    .eq('client_message_id', clientMessageId)
    .maybeSingle()

  if (existing) {
    return {
      success: true as const,
      message: existing,
      duplicate: true as const,
    }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      client_message_id: clientMessageId,
      body: cleanBody,
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      client_message_id,
      body,
      created_at,
      edited_at,
      deleted_at
    `)
    .single()

  if (error || !message) {
    return {
      success: false as const,
      error: error?.message ?? 'Failed to send message',
    }
  }

  return {
    success: true as const,
    message,
    duplicate: false as const,
  }
}

export async function markConversationAsRead(
  conversationId: string,
  readAt?: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const timestamp = readAt ?? new Date().toISOString()

  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: timestamp })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    lastReadAt: timestamp,
  }
}

export async function editMessage(
  messageId: string,
  body: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const cleanBody = body.trim()

  if (!cleanBody) {
    return { success: false as const, error: 'Message cannot be empty' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .update({
      body: cleanBody,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .select(`
      id,
      conversation_id,
      sender_id,
      client_message_id,
      body,
      created_at,
      edited_at,
      deleted_at
    `)
    .single()

  if (error || !message) {
    return {
      success: false as const,
      error: error?.message ?? 'Message not found',
    }
  }

  return {
    success: true as const,
    message,
  }
}

export async function deleteMessage(messageId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .select(`
      id,
      conversation_id,
      sender_id,
      client_message_id,
      body,
      created_at,
      edited_at,
      deleted_at
    `)
    .single()

  if (error || !message) {
    return {
      success: false as const,
      error: error?.message ?? 'Message not found',
    }
  }

  return {
    success: true as const,
    message,
  }
}
