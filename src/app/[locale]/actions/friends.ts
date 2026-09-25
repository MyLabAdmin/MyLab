'use server'

import { createClient } from '@/lib/supabase/server'

type Profile = {
  id: string
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
    return new Map<string, Profile>()
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (error) throw new Error(error.message)

  return new Map(
    (data ?? []).map((profile) => [profile.id, profile as Profile]),
  )
}

export async function getFriends() {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false as const, error: error.message }
  }

  const friendIds = (data ?? []).map((row) =>
    row.requester_id === user.id ? row.addressee_id : row.requester_id,
  )

  const profiles = await getProfiles(supabase, friendIds)

  return {
    success: true as const,
    friends: (data ?? [])
      .map((row) => {
        const friendId =
          row.requester_id === user.id ? row.addressee_id : row.requester_id

        const profile = profiles.get(friendId)

        if (!profile) return null

        return {
          id: row.id,
          user_id: friendId,
          created_at: row.created_at,
          profile,
        }
      })
      .filter(
        (
          friend,
        ): friend is {
          id: string
          user_id: string
          created_at: string
          profile: Profile
        } => friend !== null,
      ),
  }
}

export async function getFriendRequests() {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false as const, error: error.message }
  }

  const requesterIds = (data ?? []).map((row) => row.requester_id)
  const profiles = await getProfiles(supabase, requesterIds)

  return {
    success: true as const,
    requests: (data ?? []).map((row) => ({
      ...row,
      profile: profiles.get(row.requester_id) ?? null,
    })),
  }
}

export async function sendFriendRequest(userId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  if (!userId || userId === user.id) {
    return { success: false as const, error: 'Invalid user' }
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
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function cancelFriendRequest(friendshipId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
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
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    friendshipId: data.id,
  }
}

export async function removeFriend(friendshipId: string) {
  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .select('id')
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return {
    success: true as const,
    friendshipId: data.id,
  }
}
