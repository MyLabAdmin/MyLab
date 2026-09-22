'use server'

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
  if (!userData.user) return { success: false, error: 'Not authenticated' }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: input.name,
      description: input.description,
      cover_image_ref: input.coverImageRef || null,
      privacy: input.privacy,
      join_policy: input.joinPolicy,
      created_by: userData.user.id,
    })
    .select('id')
    .single()

  if (error || !group) return { success: false, error: error?.message }

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userData.user.id,
    role: 'owner',
    status: 'active',
  })

  return { success: true, groupId: group.id }
}

export async function getGroups() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, description, cover_image_ref, privacy, join_policy, created_at')
    .order('created_at', { ascending: false })

  if (!groupsData) return []

  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id, role, status')
    .eq('user_id', currentUserId ?? '')

  return Promise.all(
    groupsData.map(async (g) => {
      const membership = myMemberships?.find((m) => m.group_id === g.id)
      const { count } = await supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', g.id)
        .eq('status', 'active')

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        coverUrl: await resolveMedia(g.cover_image_ref),
        privacy: g.privacy as 'public' | 'private',
        joinPolicy: g.join_policy as 'instant' | 'approval',
        memberCount: count ?? 0,
        myStatus: membership?.status ?? null,
        myRole: membership?.role ?? null,
      }
    })
  )
}

export async function getGroupDetail(groupId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: g } = await supabase
    .from('groups')
    .select('id, name, description, cover_image_ref, privacy, join_policy, created_by')
    .eq('id', groupId)
    .single()

  if (!g) return null

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', currentUserId ?? '')
    .maybeSingle()

  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'active')

  return {
    id: g.id,
    name: g.name,
    description: g.description,
    coverUrl: await resolveMedia(g.cover_image_ref),
    privacy: g.privacy as 'public' | 'private',
    joinPolicy: g.join_policy as 'instant' | 'approval',
    memberCount: count ?? 0,
    myStatus: myMembership?.status ?? null,
    myRole: myMembership?.role ?? null,
  }
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { data: group } = await supabase.from('groups').select('join_policy').eq('id', groupId).single()
  const status = group?.join_policy === 'approval' ? 'pending' : 'active'

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userData.user.id,
    role: 'member',
    status,
  })

  return { success: !error, status }
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
    return { success: false, error: membershipError.message }
  }

  if (!membership) {
    return { success: false, error: 'You are not a member of this group' }
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

  return {
    success: !error,
    error: error?.message,
  }
}

export async function getPendingMembers(groupId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) return []

  const { data: membership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  const isManager =
    membership?.status === 'active' &&
    (membership.role === 'owner' || membership.role === 'moderator')

  const isAdmin = !!adminRole

  if (!isManager && !isAdmin) return []

  const { data } = await supabase
    .from('group_members')
    .select('id, user_id, joined_at')
    .eq('group_id', groupId)
    .eq('status', 'pending')

  if (!data || data.length === 0) return []

  const userIds = data.map((m) => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)

  const nameOf = (id: string) =>
    profiles?.find((p) => p.id === id)?.display_name ?? '—'

  return data.map((m) => ({
    id: m.id,
    userId: m.user_id,
    name: nameOf(m.user_id),
  }))
}

async function canManageGroupMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  userId: string
) {
  const { data: membership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  const isManager =
    membership?.status === 'active' &&
    (membership.role === 'owner' || membership.role === 'moderator')

  if (isManager) return true

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()

  return !!adminRole
}

export async function approveMember(memberRowId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id, status')
    .eq('id', memberRowId)
    .maybeSingle()

  if (!member) {
    return { success: false, error: 'Membership request not found' }
  }

  const allowed = await canManageGroupMembers(
    supabase,
    member.group_id,
    userData.user.id
  )

  if (!allowed) {
    return { success: false, error: 'Not authorized' }
  }

  if (member.status !== 'pending') {
    return { success: false, error: 'Membership request is not pending' }
  }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'active' })
    .eq('id', memberRowId)
    .eq('status', 'pending')

  return {
    success: !error,
    error: error?.message,
  }
}

export async function rejectMember(memberRowId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('group_id, status')
    .eq('id', memberRowId)
    .maybeSingle()

  if (!member) {
    return { success: false, error: 'Membership request not found' }
  }

  const allowed = await canManageGroupMembers(
    supabase,
    member.group_id,
    userData.user.id
  )

  if (!allowed) {
    return { success: false, error: 'Not authorized' }
  }

  if (member.status !== 'pending') {
    return { success: false, error: 'Membership request is not pending' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('id', memberRowId)
    .eq('status', 'pending')

  return {
    success: !error,
    error: error?.message,
  }
}
