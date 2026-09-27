'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import { parseMediaRef } from '@/lib/storage'

async function resolveMedia(ref: string | null) {
  if (!ref) return null
  const { provider, path } = parseMediaRef(ref)
  if (provider === 'imagekit') return getImagekitSignedUrl(path)
  return ref
}

export async function createGroup(input: {
  name: string
  description: string
  coverImageRef: string
  privacy: 'public' | 'private'
  joinPolicy: 'instant' | 'approval'
}) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: groupId, error } = await supabase.rpc('create_group', {
    p_name: input.name,
    p_description: input.description,
    p_cover_image_ref: input.coverImageRef || null,
    p_privacy: input.privacy,
    p_join_policy: input.joinPolicy,
  })

  if (error || !groupId) {
    return {
      success: false,
      error: error?.message ?? 'Failed to create group',
    }
  }

  return {
    success: true,
    groupId: groupId as string,
  }
}

export async function updateGroup(input: {
  groupId: string
  name: string
  description: string
  coverImageRef: string
  privacy: 'public' | 'private'
  joinPolicy: 'instant' | 'approval'
}) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const name = input.name.trim()
  const description = input.description.trim()

  if (!name) {
    return {
      success: false as const,
      error: 'GROUP_NAME_REQUIRED',
    }
  }

  if (name.length > 100) {
    return {
      success: false as const,
      error: 'GROUP_NAME_TOO_LONG',
    }
  }

  if (description.length > 500) {
    return {
      success: false as const,
      error: 'GROUP_DESCRIPTION_TOO_LONG',
    }
  }

  const { data: group, error } = await supabase
    .from('groups')
    .update({
      name,
      description: description || null,
      cover_image_ref: input.coverImageRef.trim() || null,
      privacy: input.privacy,
      join_policy: input.joinPolicy,
    })
    .eq('id', input.groupId)
    .select(
      'id, name, description, cover_image_ref, privacy, join_policy, created_by',
    )
    .single()

  if (error || !group) {
    return {
      success: false as const,
      error: error?.message ?? 'Failed to update group',
    }
  }

  revalidatePath('/[locale]/community/groups', 'page')
  revalidatePath(`/[locale]/community/groups/${input.groupId}`, 'page')
  revalidatePath(`/[locale]/community/groups/${input.groupId}/manage`, 'page')

  return {
    success: true as const,
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      coverUrl: await resolveMedia(group.cover_image_ref),
      privacy: group.privacy as 'public' | 'private',
      joinPolicy: group.join_policy as 'instant' | 'approval',
      createdBy: group.created_by,
    },
  }
}

export async function getGroups() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: groupsData, error: groupsError } = await supabase
    .from('groups')
    .select(
      'id, name, description, cover_image_ref, privacy, join_policy, created_at',
    )
    .order('created_at', { ascending: false })

  if (groupsError) {
    throw new Error(groupsError.message)
  }

  if (!groupsData?.length) return []

  const groupIds = groupsData.map((group) => group.id)

  const { data: countData, error: countError } = await supabase.rpc(
    'get_group_member_counts',
    { p_group_ids: groupIds },
  )

  if (countError) {
    throw new Error(countError.message)
  }

  const { data: myMemberships, error: membershipError } = currentUserId
    ? await supabase
        .from('group_members')
        .select('group_id, role, status')
        .eq('user_id', currentUserId)
    : { data: [], error: null }

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  const memberCounts = new Map<string, number>()

  for (const item of countData ?? []) {
    memberCounts.set(item.group_id, Number(item.member_count))
  }

  return Promise.all(
    groupsData.map(async (group) => {
      const membership = myMemberships?.find(
        (item) => item.group_id === group.id,
      )

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        coverUrl: await resolveMedia(group.cover_image_ref),
        privacy: group.privacy as 'public' | 'private',
        joinPolicy: group.join_policy as 'instant' | 'approval',
        memberCount: memberCounts.get(group.id) ?? 0,
        myStatus: membership?.status ?? null,
        myRole: membership?.role ?? null,
      }
    }),
  )
}

export async function getGroupManagementMembers(groupId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return []
  }

  const { data, error } = await supabase.rpc(
    'get_group_management_members',
    {
      p_group_id: groupId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((member: {
    user_id: string
    display_name: string | null
    avatar_url: string | null
    role: string
    joined_at: string
  }) => ({
    userId: member.user_id,
    displayName: member.display_name,
    avatarUrl: member.avatar_url,
    role: member.role as 'owner' | 'moderator' | 'member',
    joinedAt: member.joined_at,
  }))
}

export async function getGroupDetail(groupId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: group } = await supabase
    .from('groups')
    .select(
      'id, name, description, cover_image_ref, privacy, join_policy, created_by',
    )
    .eq('id', groupId)
    .single()

  if (!group) return null

  const { data: myMembership } = currentUserId
    ? await supabase
        .from('group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
        .maybeSingle()
    : { data: null }

  const { data: countData, error: countError } = await supabase.rpc(
    'get_group_member_counts',
    { p_group_ids: [groupId] },
  )

  if (countError) {
    throw new Error(countError.message)
  }

  const memberCount = Number(countData?.[0]?.member_count ?? 0)

  let moderatorPermissions: GroupModeratorPermissionSet | null = null

  if (myMembership?.role === 'owner') {
    moderatorPermissions = {
      canEditGroup: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canManageJoinRequests: true,
      canManagePosts: true,
      canDeletePosts: true,
      canManageModerators: true,
    }
  } else if (
    myMembership?.role === 'moderator' &&
    myMembership.status === 'active'
  ) {
    const { data: permissionRow } = await supabase
      .from('group_moderator_permissions')
      .select(
        'can_edit_group, can_add_members, can_remove_members, can_manage_join_requests, can_manage_posts, can_delete_posts, can_manage_moderators',
      )
      .eq('group_id', groupId)
      .eq('user_id', currentUserId ?? '')
      .maybeSingle()

    if (permissionRow) {
      moderatorPermissions = {
        canEditGroup: permissionRow.can_edit_group,
        canAddMembers: permissionRow.can_add_members,
        canRemoveMembers: permissionRow.can_remove_members,
        canManageJoinRequests: permissionRow.can_manage_join_requests,
        canManagePosts: permissionRow.can_manage_posts,
        canDeletePosts: permissionRow.can_delete_posts,
        canManageModerators: permissionRow.can_manage_moderators,
      }
    }
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    coverImageRef: group.cover_image_ref ?? '',
    coverUrl: await resolveMedia(group.cover_image_ref),
    privacy: group.privacy as 'public' | 'private',
    joinPolicy: group.join_policy as 'instant' | 'approval',
    memberCount,
    myStatus: myMembership?.status ?? null,
    myRole: myMembership?.role ?? null,
    moderatorPermissions,
  }
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('join_policy')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return { success: false, error: 'Group not found' }
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from('group_members')
    .select('status')
    .eq('group_id', groupId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (membershipError) {
    return {
      success: false,
      error: membershipError.message,
    }
  }

  if (existingMembership) {
    return {
      success: true,
      status: existingMembership.status,
    }
  }

  const status = group.join_policy === 'approval' ? 'pending' : 'active'

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userData.user.id,
    role: 'member',
    status,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/[locale]/community/groups', 'page')
  revalidatePath('/[locale]/community/groups/[id]', 'page')

  return {
    success: true,
    status,
  }
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
) {
  const supabase = await createClient()

  const { data: target } = await supabase
    .from('group_members')
    .select('id, role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!target) {
    return {
      success: false as const,
      error: 'MEMBER_NOT_FOUND',
    }
  }

  if (target.role === 'owner') {
    return {
      success: false as const,
      error: 'OWNER_CANNOT_BE_REMOVED',
    }
  }

  if (target.status !== 'active') {
    return {
      success: false as const,
      error: 'MEMBER_NOT_ACTIVE',
    }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('id', target.id)

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath('/[locale]/community/groups', 'page')
  revalidatePath(`/[locale]/community/groups/${groupId}`, 'page')

  return {
    success: true as const,
  }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (membershipError) {
    return {
      success: false,
      error: membershipError.message,
    }
  }

  if (!membership) {
    return {
      success: false,
      error: 'You are not a member of this group',
    }
  }

  if (membership.role === 'owner') {
    return {
      success: false,
      error: 'The group owner cannot leave the group',
    }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userData.user.id)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/[locale]/community/groups', 'page')
  revalidatePath('/[locale]/community/groups/[id]', 'page')

  return {
    success: true,
  }
}

export async function getPendingMembers(groupId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('group_members')
    .select('id, user_id, joined_at')
    .eq('group_id', groupId)
    .eq('status', 'pending')

  if (!data || data.length === 0) return []

  const userIds = data.map((member) => member.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)

  const nameOf = (id: string) =>
    profiles?.find((profile) => profile.id === id)?.display_name ?? '—'

  return data.map((member) => ({
    id: member.id,
    userId: member.user_id,
    name: nameOf(member.user_id),
  }))
}

export async function approveMember(memberRowId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('approve_group_member', {
    p_member_id: memberRowId,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    data,
  }
}

export async function rejectMember(memberRowId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('reject_group_member', {
    p_member_id: memberRowId,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    data,
  }
}

export type GroupModeratorPermissionSet = {
  canEditGroup: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canManageJoinRequests: boolean
  canManagePosts: boolean
  canDeletePosts: boolean
  canManageModerators: boolean
}

export async function setGroupModerator(
  groupId: string,
  userId: string,
  isModerator: boolean,
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('set_group_moderator', {
    p_group_id: groupId,
    p_user_id: userId,
    p_is_moderator: isModerator,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return { success: true }
}

export async function setGroupModeratorPermissions(
  groupId: string,
  userId: string,
  permissions: GroupModeratorPermissionSet,
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc(
    'set_group_moderator_permissions',
    {
      p_group_id: groupId,
      p_user_id: userId,
      p_can_edit_group: permissions.canEditGroup,
      p_can_add_members: permissions.canAddMembers,
      p_can_remove_members: permissions.canRemoveMembers,
      p_can_manage_join_requests: permissions.canManageJoinRequests,
      p_can_manage_posts: permissions.canManagePosts,
      p_can_delete_posts: permissions.canDeletePosts,
      p_can_manage_moderators: permissions.canManageModerators,
    },
  )

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return { success: true }
}

export type GroupModerator = {
  userId: string
  name: string
  role: 'moderator'
  permissions: GroupModeratorPermissionSet
}

export async function getGroupModerators(groupId: string) {
  const supabase = await createClient()

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId)
    .eq('role', 'moderator')
    .eq('status', 'active')

  if (membersError) {
    return {
      success: false as const,
      error: membersError.message,
      moderators: [] as GroupModerator[],
    }
  }

  if (!members || members.length === 0) {
    return {
      success: true as const,
      moderators: [] as GroupModerator[],
    }
  }

  const userIds = members.map((member) => member.user_id)

  const [{ data: profiles }, { data: permissionRows, error: permissionsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds),
      supabase
        .from('group_moderator_permissions')
        .select(
          'user_id, can_edit_group, can_add_members, can_remove_members, can_manage_join_requests, can_manage_posts, can_delete_posts, can_manage_moderators',
        )
        .eq('group_id', groupId)
        .in('user_id', userIds),
    ])

  if (permissionsError) {
    return {
      success: false as const,
      error: permissionsError.message,
      moderators: [] as GroupModerator[],
    }
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.display_name ?? '—',
    ]),
  )

  const permissionMap = new Map(
    (permissionRows ?? []).map((row) => [
      row.user_id,
      {
        canEditGroup: row.can_edit_group,
        canAddMembers: row.can_add_members,
        canRemoveMembers: row.can_remove_members,
        canManageJoinRequests: row.can_manage_join_requests,
        canManagePosts: row.can_manage_posts,
        canDeletePosts: row.can_delete_posts,
        canManageModerators: row.can_manage_moderators,
      },
    ]),
  )

  return {
    success: true as const,
    moderators: members.map((member) => ({
      userId: member.user_id,
      name: profileMap.get(member.user_id) ?? '—',
      role: 'moderator' as const,
      permissions: permissionMap.get(member.user_id) ?? {
        canEditGroup: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canManageJoinRequests: false,
        canManagePosts: false,
        canDeletePosts: false,
        canManageModerators: false,
      },
    })),
  }
}

export type GroupMember = {
  userId: string
  name: string
  avatarUrl: string | null
  role: string
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .neq('role', 'owner')
    .neq('role', 'moderator')
    .order('joined_at', { ascending: true })

  if (error || !members?.length) {
    return []
  }

  const userIds = members.map((member) => member.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        name: profile.display_name ?? '—',
        avatarUrl: profile.avatar_url ?? null,
      },
    ]),
  )

  return members.map((member) => {
    const profile = profileMap.get(member.user_id)

    return {
      userId: member.user_id,
      name: profile?.name ?? '—',
      avatarUrl: profile?.avatarUrl ?? null,
      role: member.role,
    }
  })
}

export async function transferGroupOwnership(
  groupId: string,
  newOwnerId: string,
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transfer_group_ownership', {
    p_group_id: groupId,
    p_new_owner_id: newOwnerId,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return { success: true }
}
