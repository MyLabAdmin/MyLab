import { createClient } from '@/lib/supabase/server'
import type { StaffRole } from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function getAuthenticatedClient() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    supabase,
    userId: user.id,
  }
}

async function resolveActiveState(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('current_user_is_active')

  if (error) {
    throw new Error(
      `Failed to resolve account authorization state: ${error.message}`,
    )
  }

  return Boolean(data)
}

export async function getAuthorizationContext(): Promise<{
  userId: string
  isActive: boolean
} | null> {
  const authenticated = await getAuthenticatedClient()

  if (!authenticated) {
    return null
  }

  const isActive = await resolveActiveState(authenticated.supabase)

  return {
    userId: authenticated.userId,
    isActive,
  }
}

export async function requireActiveUser() {
  const authenticated = await getAuthenticatedClient()

  if (!authenticated) {
    throw new Error('Authentication required')
  }

  const isActive = await resolveActiveState(authenticated.supabase)

  if (!isActive) {
    throw new Error('Active account required')
  }

  return {
    userId: authenticated.userId,
    isActive,
    supabase: authenticated.supabase,
  }
}

export async function hasRole(role: StaffRole): Promise<boolean> {
  const authenticated = await getAuthenticatedClient()

  if (!authenticated) {
    return false
  }

  const isActive = await resolveActiveState(authenticated.supabase)

  if (!isActive) {
    return false
  }

  const { data, error } = await authenticated.supabase.rpc(
    'current_user_has_role',
    {
      p_role: role,
    },
  )

  if (error) {
    throw new Error(
      `Failed to resolve authorization role: ${error.message}`,
    )
  }

  return Boolean(data)
}

export async function requireRole(role: StaffRole) {
  const context = await requireActiveUser()

  const { data, error } = await context.supabase.rpc(
    'current_user_has_role',
    {
      p_role: role,
    },
  )

  if (error) {
    throw new Error(
      `Failed to resolve authorization role: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(`Required role: ${role}`)
  }

  return {
    userId: context.userId,
    isActive: context.isActive,
  }
}

export async function hasCapability(
  capabilityKey: string,
): Promise<boolean> {
  const authenticated = await getAuthenticatedClient()

  if (!authenticated) {
    return false
  }

  const isActive = await resolveActiveState(authenticated.supabase)

  if (!isActive) {
    return false
  }

  const { data, error } = await authenticated.supabase.rpc(
    'current_user_has_capability',
    {
      p_capability_key: capabilityKey,
    },
  )

  if (error) {
    throw new Error(
      `Failed to resolve authorization capability: ${error.message}`,
    )
  }

  return Boolean(data)
}

export async function requireCapability(capabilityKey: string) {
  const context = await requireActiveUser()

  const { data, error } = await context.supabase.rpc(
    'current_user_has_capability',
    {
      p_capability_key: capabilityKey,
    },
  )

  if (error) {
    throw new Error(
      `Failed to resolve authorization capability: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(`Required capability: ${capabilityKey}`)
  }

  return {
    userId: context.userId,
    isActive: context.isActive,
  }
}
