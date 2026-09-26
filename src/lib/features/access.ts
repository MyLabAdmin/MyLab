'use server'

import { createClient } from '@/lib/supabase/server'

export type FeatureAccess = {
  featureKey: string
  enabled: boolean
  price: number
  durationSeconds: number
  dailyLimit: number
  expiresAt: string | null
  hasAccess: boolean
}

export type FeatureDailyUsage = {
  featureKey: string
  dailyLimit: number
  usageCount: number
  remaining: number | null
  resetAt: string
}

export async function getFeatureAccess(
  featureKey: string,
): Promise<
  | { success: true; access: FeatureAccess }
  | { success: false; error: string }
> {
  const supabase = await createClient()
  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false,
      error: 'Not authenticated',
    }
  }

  const cleanFeatureKey = featureKey.trim()

  if (!cleanFeatureKey) {
    return {
      success: false,
      error: 'Feature key is required',
    }
  }

  const { data: setting, error: settingError } = await supabase
    .from('feature_settings')
    .select('feature_key, enabled, price, duration_seconds, daily_limit')
    .eq('feature_key', cleanFeatureKey)
    .maybeSingle()

  if (settingError) {
    return {
      success: false,
      error: settingError.message,
    }
  }

  if (!setting) {
    return {
      success: false,
      error: 'Feature is not configured',
    }
  }

  const { data: entitlement, error: entitlementError } =
    await supabase
      .from('feature_entitlements')
      .select('expires_at')
      .eq('user_id', userData.user.id)
      .eq('feature_key', cleanFeatureKey)
      .maybeSingle()

  if (entitlementError) {
    return {
      success: false,
      error: entitlementError.message,
    }
  }

  const expiresAt = entitlement?.expires_at ?? null
  const hasAccess =
    setting.enabled === true &&
    expiresAt !== null &&
    new Date(expiresAt).getTime() > Date.now()

  return {
    success: true,
    access: {
      featureKey: setting.feature_key,
      enabled: setting.enabled,
      price: setting.price,
      durationSeconds: setting.duration_seconds,
      dailyLimit: setting.daily_limit,
      expiresAt,
      hasAccess,
    },
  }
}

export async function purchaseFeatureAccess(featureKey: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const cleanFeatureKey = featureKey.trim()

  if (!cleanFeatureKey) {
    return {
      success: false as const,
      error: 'Feature key is required',
    }
  }

  const { data, error } = await supabase.rpc(
    'purchase_feature_access',
    {
      p_feature_key: cleanFeatureKey,
    },
  )

  if (error || !data?.[0]) {
    return {
      success: false as const,
      error: error?.message ?? 'Failed to purchase feature access',
    }
  }

  return {
    success: true as const,
    purchase: data[0],
  }
}


export async function getFeatureDailyUsage(
  featureKey: string,
): Promise<
  | { success: true; usage: FeatureDailyUsage }
  | { success: false; error: string }
> {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const cleanFeatureKey = featureKey.trim()

  if (!cleanFeatureKey) {
    return { success: false, error: 'Feature key is required' }
  }

  const { data: setting, error: settingError } =
    await supabase
      .from('feature_settings')
      .select('feature_key, daily_limit')
      .eq('feature_key', cleanFeatureKey)
      .maybeSingle()

  if (settingError) {
    return { success: false, error: settingError.message }
  }

  if (!setting) {
    return { success: false, error: 'Feature is not configured' }
  }

  const now = new Date()
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
    ),
  )

  if (setting.daily_limit === 0) {
    return {
      success: true,
      usage: {
        featureKey: setting.feature_key,
        dailyLimit: 0,
        usageCount: 0,
        remaining: null,
        resetAt: tomorrow.toISOString(),
      },
    }
  }

  const today = now.toISOString().slice(0, 10)

  const { data: usage, error: usageError } =
    await supabase
      .from('feature_usage_daily')
      .select('usage_count')
      .eq('user_id', userData.user.id)
      .eq('feature_key', cleanFeatureKey)
      .eq('usage_date', today)
      .maybeSingle()

  if (usageError) {
    return { success: false, error: usageError.message }
  }

  const usageCount = usage?.usage_count ?? 0

  return {
    success: true,
    usage: {
      featureKey: setting.feature_key,
      dailyLimit: setting.daily_limit,
      usageCount,
      remaining: Math.max(setting.daily_limit - usageCount, 0),
      resetAt: tomorrow.toISOString(),
    },
  }
}
