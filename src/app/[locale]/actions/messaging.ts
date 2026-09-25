'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

async function areAcceptedFriends(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
  userIds: string[],
) {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter((id) => id && id !== currentUserId)),
  )

  if (uniqueUserIds.length === 0) {
    return true
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(
      `requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`,
    )

  if (error) {
    throw new Error(error.message)
  }

  const friendIds = new Set(
    (data ?? []).map((friendship) =>
      friendship.requester_id === currentUserId
        ? friendship.addressee_id
        : friendship.requester_id,
    ),
  )

  return uniqueUserIds.every((userId) => friendIds.has(userId))
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (!otherUserId || otherUserId === user.id) {
    return { success: false as const, error: 'Invalid recipient' }
  }

  const isFriend = await areAcceptedFriends(
    supabase,
    user.id,
    [otherUserId],
  )

  if (!isFriend) {
    return {
      success: false as const,
      error: 'You can only message accepted friends',
    }
  }

  const directKey = makeDirectKey(user.id, otherUserId)

  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id, type, title, description, created_by, created_at, updated_at')
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
      role: 'member',
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
  description: string,
  memberIds: string[] = [],
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const cleanTitle = title.trim()
  const cleanDescription = description.trim()

  if (!cleanTitle) {
    return { success: false as const, error: 'Conversation title is required' }
  }

  const uniqueMemberIds = Array.from(
    new Set([user.id, ...memberIds.filter(Boolean)]),
  )

  const otherMemberIds = uniqueMemberIds.filter(
    (memberId) => memberId !== user.id,
  )

  const areFriends = await areAcceptedFriends(
    supabase,
    user.id,
    otherMemberIds,
  )

  if (!areFriends) {
    return {
      success: false as const,
      error: 'You can only add accepted friends to a group',
    }
  }

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
      description: cleanDescription || null,
      created_by: user.id,
    })
    .select('id, type, title, description, created_by, created_at, updated_at')
    .single()

  if (conversationError || !conversation) {
    if (
      conversationError?.code === '23505' &&
      conversationError.message.includes('conversations_group_title_uidx')
    ) {
      return {
        success: false as const,
        error: 'GROUP_TITLE_ALREADY_EXISTS',
      }
    }

    return {
      success: false as const,
      error: conversationError?.message ?? 'Failed to create conversation',
    }
  }

  const members = uniqueMemberIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
    role: userId === user.id ? 'owner' : 'member',
  }))

  const { error: creatorMemberError } = await supabase
    .from('conversation_members')
    .insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'owner',
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

  revalidatePath('/[locale]/community/messages', 'page')

  return {
    success: true as const,
    conversation,
  }
}

export async function updateGroupConversation(conversationId: string, title: string, description: string) {
  const result = await getCurrentUser()
  if (result.user === null) return { success: false as const, error: 'Not authenticated' }
  const cleanTitle = title.trim()
  const cleanDescription = description.trim()
  if (conversationId.length === 0) return { success: false as const, error: 'Conversation ID is required' }
  if (cleanTitle.length === 0) return { success: false as const, error: 'Conversation title is required' }
  const response = await result.supabase.from('conversations').update({ title: cleanTitle, description: cleanDescription || null }).eq('id', conversationId).eq('type', 'group').select('id, type, title, description, created_by, created_at, updated_at').single()
  if (response.error || response.data === null) return { success: false as const, error: response.error?.message ?? 'Failed to update conversation' }
  return { success: true as const, conversation: response.data }
}

export async function searchGroupMembers(conversationId: string, search: string) {
  const result = await getCurrentUser()

  if (result.user === null) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (conversationId.length === 0) {
    return { success: false as const, error: 'Conversation ID is required' }
  }

  const { data: conversation, error: conversationError } = await result.supabase
    .from('conversations')
    .select('id, type')
    .eq('id', conversationId)
    .eq('type', 'group')
    .maybeSingle()

  if (conversationError) {
    return { success: false as const, error: conversationError.message }
  }

  if (conversation === null) {
    return { success: false as const, error: 'Group conversation not found' }
  }

  const { data: currentMember, error: currentMemberError } = await result.supabase
    .from('conversation_members')
    .select('user_id, role')
    .eq('conversation_id', conversationId)
    .eq('user_id', result.user.id)
    .maybeSingle()

  if (currentMemberError) {
    return { success: false as const, error: currentMemberError.message }
  }

  if (currentMember === null) {
    return { success: false as const, error: 'You are not a member of this conversation' }
  }

  if (currentMember.role === 'moderator') {
    const { data: permission, error: permissionError } = await result.supabase
      .from('conversation_moderator_permissions')
      .select('can_add_members')
      .eq('conversation_id', conversationId)
      .eq('user_id', result.user.id)
      .maybeSingle()

    if (permissionError) {
      return { success: false as const, error: permissionError.message }
    }

    if (permission?.can_add_members !== true) {
      return { success: false as const, error: 'You do not have permission to add members' }
    }
  } else if (currentMember.role !== 'owner') {
    return { success: false as const, error: 'You do not have permission to add members' }
  }

  const cleanSearch = search.trim()

  if (cleanSearch.length < 2) {
    return { success: true as const, users: [] }
  }

  const { data: members, error: membersError } = await result.supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)

  if (membersError) {
    return { success: false as const, error: membersError.message }
  }

  const memberIds = (members ?? []).map((member) => member.user_id)

  let query = result.supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .ilike('display_name', '%' + cleanSearch + '%')
    .order('display_name', { ascending: true })
    .limit(20)

  if (memberIds.length > 0) {
    query = query.not('id', 'in', '(' + memberIds.join(',') + ')')
  }

  const { data: friendships, error: friendshipsError } =
    await result.supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(
        `requester_id.eq.${result.user.id},addressee_id.eq.${result.user.id}`,
      )

  if (friendshipsError) {
    return {
      success: false as const,
      error: friendshipsError.message,
    }
  }

  const friendIds = (friendships ?? []).map((friendship) =>
    friendship.requester_id === result.user.id
      ? friendship.addressee_id
      : friendship.requester_id,
  )

  const availableFriendIds = friendIds.filter(
    (friendId) => !memberIds.includes(friendId),
  )

  if (availableFriendIds.length === 0) {
    return { success: true as const, users: [] }
  }

  const { data: users, error } = await result.supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', availableFriendIds)
    .ilike('display_name', '%' + cleanSearch + '%')
    .order('display_name', { ascending: true })
    .limit(20)

  if (error) {
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    users: users ?? [],
  }
}

export async function addConversationMember(conversationId: string, userId: string) {
  const result = await getCurrentUser()
  if (result.user === null) return { success: false as const, error: 'Not authenticated' }
  if (conversationId.length === 0 || userId.length === 0) return { success: false as const, error: 'Conversation ID and user ID are required' }

  const isFriend = await areAcceptedFriends(
    result.supabase,
    result.user.id,
    [userId],
  )

  if (!isFriend) {
    return {
      success: false as const,
      error: 'You can only add accepted friends',
    }
  }

  const response = await result.supabase.from('conversation_members').insert({ conversation_id: conversationId, user_id: userId, role: 'member' }).select('conversation_id, user_id, role, joined_at').single()
  if (response.error || response.data === null) return { success: false as const, error: response.error?.message ?? 'Failed to add member' }
  return { success: true as const, member: response.data }
}

export async function removeConversationMember(conversationId: string, userId: string) {
  const result = await getCurrentUser()
  if (result.user === null) return { success: false as const, error: 'Not authenticated' }
  if (conversationId.length === 0 || userId.length === 0) return { success: false as const, error: 'Conversation ID and user ID are required' }
  const response = await result.supabase.from('conversation_members').delete().eq('conversation_id', conversationId).eq('user_id', userId).select('conversation_id, user_id, role').maybeSingle()
  if (response.error) return { success: false as const, error: response.error.message }
  if (response.data === null) return { success: false as const, error: 'Member could not be removed' }
  return { success: true as const, member: response.data }
}

export async function setConversationModerator(conversationId: string, userId: string, isModerator: boolean) {
  const result = await getCurrentUser()
  if (result.user === null) return { success: false as const, error: 'Not authenticated' }
  const response = await result.supabase.from('conversation_members').update({ role: isModerator ? 'moderator' : 'member' }).eq('conversation_id', conversationId).eq('user_id', userId).neq('role', 'owner').select('conversation_id, user_id, role').single()
  if (response.error || response.data === null) return { success: false as const, error: response.error?.message ?? 'Failed to update member role' }
  if (isModerator === false) {
    const { error: permissionsError } = await result.supabase
      .from('conversation_moderator_permissions')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    if (permissionsError) {
      return {
        success: false as const,
        error: permissionsError.message,
      }
    }
  }

  return { success: true as const, member: response.data }
}

export async function updateModeratorPermissions(conversationId: string, userId: string, permissions: { canEditInfo: boolean; canAddMembers: boolean; canRemoveMembers: boolean }) {
  const result = await getCurrentUser()
  if (result.user === null) return { success: false as const, error: 'Not authenticated' }
  const response = await result.supabase.from('conversation_moderator_permissions').upsert({ conversation_id: conversationId, user_id: userId, can_edit_info: permissions.canEditInfo, can_add_members: permissions.canAddMembers, can_remove_members: permissions.canRemoveMembers, updated_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' }).select('conversation_id, user_id, can_edit_info, can_add_members, can_remove_members, updated_at').single()
  if (response.error || response.data === null) return { success: false as const, error: response.error?.message ?? 'Failed to update moderator permissions' }
  return { success: true as const, permissions: response.data }
}

export async function getConversations() {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const { data: memberships, error } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      role,
      last_read_at,
      muted_at,
      conversations (
        id,
        type,
        title,
        description,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  const conversationIds = (memberships ?? []).map(
    (membership) => membership.conversation_id,
  )

  if (conversationIds.length === 0) {
    return {
      success: true as const,
      conversations: [],
    }
  }

  const { data: allMembers, error: membersError } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, role')
    .in('conversation_id', conversationIds)

  if (membersError) {
    return { success: false as const, error: membersError.message }
  }

  const userIds = Array.from(
    new Set((allMembers ?? []).map((member) => member.user_id)),
  )

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    return { success: false as const, error: profilesError.message }
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  const membersByConversation = new Map<
    string,
    Array<{
      userId: string
      role: string
      displayName: string | null
      avatarUrl: string | null
    }>
  >()

  for (const member of allMembers ?? []) {
    const profile = profileMap.get(member.user_id)

    const list = membersByConversation.get(member.conversation_id) ?? []

    list.push({
      userId: member.user_id,
      role: member.role,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    })

    membersByConversation.set(member.conversation_id, list)
  }

  const conversations = (memberships ?? [])
    .map((membership) => {
      const conversation = Array.isArray(membership.conversations)
        ? membership.conversations[0]
        : membership.conversations

      if (!conversation) return null

      const members = membersByConversation.get(conversation.id) ?? []

      const otherMembers = members.filter(
        (member) => member.userId !== user.id,
      )

      const otherUser =
        conversation.type === 'direct'
          ? otherMembers[0] ?? null
          : null

      return {
        ...conversation,
        role: membership.role,
        lastReadAt: membership.last_read_at,
        mutedAt: membership.muted_at,
        members,
        otherUser,
      }
    })
    .filter(
      (conversation): conversation is NonNullable<typeof conversation> =>
        conversation !== null,
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime(),
    )

  return {
    success: true as const,
    conversations,
  }
}

export async function transferConversationOwnership(
  conversationId: string,
  newOwnerId: string,
  previousOwnerRole: 'member' | 'moderator',
  permissions: {
    canEditInfo: boolean
    canAddMembers: boolean
    canRemoveMembers: boolean
  } = {
    canEditInfo: false,
    canAddMembers: false,
    canRemoveMembers: false,
  },
) {
  const { supabase, user } = await getCurrentUser()

  if (user === null) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (conversationId.length === 0 || newOwnerId.length === 0) {
    return { success: false as const, error: 'Conversation ID and new owner ID are required' }
  }

  const response = await supabase.rpc('transfer_conversation_ownership', {
    p_conversation_id: conversationId,
    p_new_owner_id: newOwnerId,
    p_previous_owner_role: previousOwnerRole,
    p_can_edit_info: permissions.canEditInfo,
    p_can_add_members: permissions.canAddMembers,
    p_can_remove_members: permissions.canRemoveMembers,
  })

  if (response.error || response.data === null) {
    return {
      success: false as const,
      error: response.error?.message ?? 'Failed to transfer conversation ownership',
    }
  }

  return {
    success: true as const,
    transfer: response.data[0] ?? null,
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
      description,
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

  const memberIds = conversation.conversation_members.map((member) => member.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds)

  if (profilesError) {
    return { success: false as const, error: profilesError.message }
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const { data: moderatorPermissions, error: permissionsError } = await supabase
    .from('conversation_moderator_permissions')
    .select(
      'user_id, can_edit_info, can_add_members, can_remove_members',
    )
    .eq('conversation_id', conversationId)
    .in('user_id', memberIds)

  if (permissionsError) {
    return { success: false as const, error: permissionsError.message }
  }

  const permissionsMap = new Map(
    (moderatorPermissions ?? []).map((permission) => [
      permission.user_id,
      permission,
    ]),
  )

  const members = conversation.conversation_members.map((member) => {
    const profile = profileMap.get(member.user_id)
    const permissions = permissionsMap.get(member.user_id)

    return {
      ...member,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      can_edit_info: permissions?.can_edit_info ?? false,
      can_add_members: permissions?.can_add_members ?? false,
      can_remove_members: permissions?.can_remove_members ?? false,
    }
  })

  return {
    success: true as const,
    currentUserId: user.id,
    conversation: { ...conversation, conversation_members: members },
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

  const senderIds = Array.from(
    new Set(messages.map((message) => message.sender_id)),
  )

  let profileMap = new Map<
    string,
    {
      display_name: string | null
      avatar_url: string | null
    }
  >()

  if (senderIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', senderIds)

    if (profilesError) {
      return { success: false as const, error: profilesError.message }
    }

    profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      ]),
    )
  }

  const messagesWithSenders = messages.map((message) => ({
    ...message,
    sender: profileMap.get(message.sender_id) ?? {
      display_name: null,
      avatar_url: null,
    },
  }))

  return {
    success: true as const,
    messages: messagesWithSenders,
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

export async function leaveConversation(conversationId: string) {
  const { supabase, user } = await getCurrentUser()

  if (user === null) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (conversationId.length === 0) {
    return { success: false as const, error: 'Conversation ID is required' }
  }

  const { error } = await supabase
.from('conversation_members')
.delete()
.eq('conversation_id', conversationId)
.eq('user_id', user.id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath('/[locale]/community/messages', 'page')

  return { success: true as const }
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
