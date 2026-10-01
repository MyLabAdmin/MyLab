'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveAvatarUrl } from '@/lib/storage/avatar-server'
import { parseMediaRef } from '@/lib/storage'
import { deleteImagekitFileByPath } from '@/lib/storage/imagekit-server'

export type FriendProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export type FriendRelationship =
  | 'none'
  | 'sent'
  | 'received'
  | 'accepted'

export type FriendItem = {
  friendshipId: string | null
  userId: string
  profile: FriendProfile
  relationship: FriendRelationship
}

export type BlockedUser = {
  userId: string
  display_name: string | null
  avatar_url: string | null
}

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

async function getProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
) {
  if (userIds.length === 0) {
    return new Map<string, FriendProfile>()
  }

  const { data, error } = await supabase
    .from('profiles_public')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (error) {
    throw new Error(error.message)
  }

  const resolvedProfiles = await Promise.all(
    (data ?? []).map(async (profile) => ({
      ...profile,
      avatar_url: await resolveAvatarUrl(profile.avatar_url),
    })),
  )

  return new Map(
    resolvedProfiles.map((profile) => [
      profile.id,
      profile as FriendProfile,
    ]),
  )
}

export async function getFriendsHub(search = '') {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const normalizedSearch = search.trim()
  const escapedSearch = normalizedSearch.replace(
    /[\\%_]/g,
    (char) => '\\' + char,
  )

  const [
    peopleResult,
    relationshipsResult,
    hiddenResult,
  ] = await Promise.all([
    supabase
      .from('profiles_public')
      .select('id, display_name, avatar_url')
      .neq('id', user.id)
      .ilike('display_name', '%' + escapedSearch + '%')
      .order('display_name', {
        ascending: true,
        nullsFirst: false,
      })
      .limit(100),

    supabase
      .from('friendships')
      .select(
        'id, requester_id, addressee_id, status, created_at',
      )
      .or(
        'requester_id.eq.' +
          user.id +
          ',addressee_id.eq.' +
          user.id,
      )
      .order('created_at', {
        ascending: false,
      }),

    supabase
      .from('friend_discovery_hidden')
      .select('hidden_user_id')
      .eq('user_id', user.id),
  ])

  if (peopleResult.error) {
    return {
      success: false as const,
      error: peopleResult.error.message,
    }
  }

  if (relationshipsResult.error) {
    return {
      success: false as const,
      error: relationshipsResult.error.message,
    }
  }

  if (hiddenResult.error) {
    return {
      success: false as const,
      error: hiddenResult.error.message,
    }
  }

  const relationships = relationshipsResult.data ?? []

  const hiddenIds = new Set(
    (hiddenResult.data ?? []).map(
      (row) => row.hidden_user_id,
    ),
  )

  const relationshipMap = new Map<
    string,
    {
      id: string
      relationship: FriendRelationship
    }
  >()

  for (const row of relationships) {
    const otherUserId =
      row.requester_id === user.id
        ? row.addressee_id
        : row.requester_id

    relationshipMap.set(otherUserId, {
      id: row.id,
      relationship:
        row.status === 'accepted'
          ? 'accepted'
          : row.requester_id === user.id
            ? 'sent'
            : 'received',
    })
  }

  const resolvedPeopleProfiles = await Promise.all(
    (peopleResult.data ?? []).map(async (profile) => ({
      ...profile,
      avatar_url: await resolveAvatarUrl(profile.avatar_url),
    })),
  )

  const people: FriendItem[] = resolvedPeopleProfiles
    .filter(
      (profile) =>
        !hiddenIds.has(profile.id) ||
        relationshipMap.has(profile.id),
    )
    .map((profile) => ({
      userId: profile.id,
      profile: profile as FriendProfile,
      relationship:
        relationshipMap.get(profile.id)?.relationship ?? 'none',
      friendshipId:
        relationshipMap.get(profile.id)?.id ?? null,
    }))

  const incomingRows = relationships.filter(
    (row) =>
      row.addressee_id === user.id &&
      row.status === 'pending',
  )

  const sentRows = relationships.filter(
    (row) =>
      row.requester_id === user.id &&
      row.status === 'pending',
  )

  const friendRows = relationships.filter(
    (row) => row.status === 'accepted',
  )

  const incomingIds = incomingRows.map(
    (row) => row.requester_id,
  )

  const sentIds = sentRows.map(
    (row) => row.addressee_id,
  )

  const friendIds = friendRows.map((row) =>
    row.requester_id === user.id
      ? row.addressee_id
      : row.requester_id,
  )

  const [
    incomingProfiles,
    sentProfiles,
    friendProfiles,
  ] = await Promise.all([
    getProfiles(supabase, incomingIds),
    getProfiles(supabase, sentIds),
    getProfiles(supabase, friendIds),
  ])

  const makeItem = (
    userId: string,
    friendshipId: string,
    profiles: Map<string, FriendProfile>,
    relationship: FriendRelationship,
  ): FriendItem | null => {
    const profile = profiles.get(userId)

    if (!profile) {
      return null
    }

    return {
      friendshipId,
      userId,
      profile,
      relationship,
    }
  }

  const incoming = incomingRows
    .map((row) =>
      makeItem(
        row.requester_id,
        row.id,
        incomingProfiles,
        'received',
      ),
    )
    .filter(
      (item): item is FriendItem => item !== null,
    )

  const sent = sentRows
    .map((row) =>
      makeItem(
        row.addressee_id,
        row.id,
        sentProfiles,
        'sent',
      ),
    )
    .filter(
      (item): item is FriendItem => item !== null,
    )

  const friends = friendRows
    .map((row) => {
      const friendId =
        row.requester_id === user.id
          ? row.addressee_id
          : row.requester_id

      return makeItem(
        friendId,
        row.id,
        friendProfiles,
        'accepted',
      )
    })
    .filter(
      (item): item is FriendItem => item !== null,
    )

  return {
    success: true as const,
    people,
    incoming,
    sent,
    friends,
  }
}

export async function getBlockedUsers() {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { data, error } = await supabase.rpc('get_blocked_users')

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  const blockedUsers = await Promise.all(
    (data ?? []).map(
      async (item: {
        user_id: string
        display_name: string | null
        avatar_url: string | null
      }) => ({
        userId: item.user_id,
        display_name: item.display_name,
        avatar_url: await resolveAvatarUrl(item.avatar_url),
      }),
    ),
  )

  return {
    success: true as const,
    blockedUsers,
  }
}

export async function blockUser(userId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  if (!userId || userId === user.id) {
    return {
      success: false as const,
      error: 'INVALID_USER',
    }
  }

  const { data, error } = await supabase.rpc('block_user', {
    p_blocked_user_id: userId,
  })

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  const mediaRefs: string[] = Array.from(
    new Set<string>(
      (data ?? [])
        .map((row: { media_ref: string | null }) => row.media_ref)
        .filter(
          (value: string | null): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        ),
    ),
  )

  const cleanupResults = await Promise.allSettled(
    mediaRefs.map(async (mediaRef) => {
      const parsed = parseMediaRef(mediaRef)

      if (parsed.provider !== 'imagekit' || !parsed.path.trim()) {
        return
      }

      await deleteImagekitFileByPath(parsed.path)
    }),
  )

  const cleanupFailed = cleanupResults.filter(
    (result) => result.status === 'rejected',
  ).length

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    cleanupFailed,
  }
}

export async function unblockUser(userId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  if (!userId || userId === user.id) {
    return {
      success: false as const,
      error: 'INVALID_USER',
    }
  }

  const { error } = await supabase.rpc('unblock_user', {
    p_blocked_user_id: userId,
  })

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
  }
}

export async function getFriends() {
  const result = await getFriendsHub()

  if (!result.success) {
    return result
  }

  return {
    success: true as const,
    friends: result.friends
      .filter(
        (
          friend,
        ): friend is typeof friend & {
          friendshipId: string
        } => friend.friendshipId !== null,
      )
      .map((friend) => ({
        id: friend.friendshipId,
        user_id: friend.userId,
        created_at: null,
        profile: {
          id: friend.profile.id,
          display_name: friend.profile.display_name,
          avatar_url: friend.profile.avatar_url,
        },
      })),
  }
}

export async function getFriendRequests() {
  const result = await getFriendsHub()

  if (!result.success) {
    return result
  }

  return {
    success: true as const,
    requests: result.incoming.map((request) => ({
      id: request.friendshipId,
      requester_id: request.userId,
      profile: request.profile,
    })),
  }
}

export async function sendFriendRequest(userId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  if (!userId || userId === user.id) {
    return {
      success: false as const,
      error: 'INVALID_USER',
    }
  }

  const { data: existing } = await supabase
    .from('friendships')
    .select(
      'id, requester_id, addressee_id, status',
    )
    .or(
      'and(requester_id.eq.' +
        user.id +
        ',addressee_id.eq.' +
        userId +
        '),and(requester_id.eq.' +
        userId +
        ',addressee_id.eq.' +
        user.id +
        ')',
    )
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') {
      return {
        success: false as const,
        error: 'ALREADY_FRIENDS',
      }
    }

    if (existing.requester_id === user.id) {
      return {
        success: false as const,
        error: 'REQUEST_ALREADY_SENT',
      }
    }

    return {
      success: false as const,
      error: 'REQUEST_ALREADY_RECEIVED',
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: userId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function acceptFriendRequest(
  friendshipId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({
      status: 'accepted',
    })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function rejectFriendRequest(
  friendshipId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function cancelFriendRequest(
  friendshipId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function removeFriend(
  friendshipId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .select('id')
    .single()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function hidePersonFromDiscovery(
  userId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  if (!userId || userId === user.id) {
    return {
      success: false as const,
      error: 'INVALID_USER',
    }
  }

  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .or(
      'and(requester_id.eq.' +
        user.id +
        ',addressee_id.eq.' +
        userId +
        '),and(requester_id.eq.' +
        userId +
        ',addressee_id.eq.' +
        user.id +
        ')',
    )
    .maybeSingle()

  if (existingFriendship) {
    return {
      success: false as const,
      error: 'HAS_RELATIONSHIP',
    }
  }

  const { error } = await supabase
    .from('friend_discovery_hidden')
    .insert({
      user_id: user.id,
      hidden_user_id: userId,
    })

  if (error && error.code !== '23505') {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
  }
}

export async function unhidePersonFromDiscovery(
  userId: string,
) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    }
  }

  const { error } = await supabase
    .from('friend_discovery_hidden')
    .delete()
    .eq('user_id', user.id)
    .eq('hidden_user_id', userId)

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  revalidatePath(
    '/[locale]/community/friends',
    'page',
  )

  return {
    success: true as const,
  }
}


export async function getProfileFriendship(userId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  if (!currentUserId || !userId || currentUserId === userId) {
    return {
      success: true as const,
      relationship: 'self' as const,
      friendshipId: null,
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`,
    )
    .maybeSingle()

  if (error) {
    console.error('[getProfileFriendship]', error)
    return {
      success: false as const,
      relationship: 'none' as const,
      friendshipId: null,
    }
  }

  if (!data) {
    return {
      success: true as const,
      relationship: 'none' as const,
      friendshipId: null,
    }
  }

  if (data.status === 'accepted') {
    return {
      success: true as const,
      relationship: 'accepted' as const,
      friendshipId: data.id,
    }
  }

  if (data.requester_id === currentUserId) {
    return {
      success: true as const,
      relationship: 'sent' as const,
      friendshipId: data.id,
    }
  }

  return {
    success: true as const,
    relationship: 'received' as const,
    friendshipId: data.id,
  }
}
