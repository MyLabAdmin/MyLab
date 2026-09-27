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


export type FeatureCapacityStatus = {
  featureKey: string
  baseDailyLimit: number
  dailyBonusCapacity: number
  effectiveDailyLimit: number
  dailyUsage: number
  dailyRemaining: number
  totalCapacityRemaining: number
  totalRemaining: number
  nextExpiryAt: string | null
}

export type FeatureCapacityPlan = {
  id: string
  planKey: string
  nameAr: string
  nameEn: string
  capacityKind: 'total' | 'daily_bonus'
  capacityUnits: number
  durationSeconds: number
  marketCode: string
  currencyCode: string
  amount: number
}

export async function getFeatureCapacityStatus(
  featureKey: string,
): Promise<
  | { success: true; status: FeatureCapacityStatus }
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

  const { data, error } = await supabase.rpc(
    'get_feature_capacity_status',
    {
      p_feature_key: cleanFeatureKey,
    },
  )

  if (error) {
    return { success: false, error: error.message }
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    return { success: false, error: 'Feature is not available' }
  }

  return {
    success: true,
    status: {
      featureKey: row.feature_key,
      baseDailyLimit: Number(row.base_daily_limit),
      dailyBonusCapacity: Number(row.daily_bonus_capacity),
      effectiveDailyLimit: Number(row.effective_daily_limit),
      dailyUsage: Number(row.daily_usage),
      dailyRemaining: Number(row.daily_remaining),
      totalCapacityRemaining: Number(row.total_capacity_remaining),
      totalRemaining: Number(row.total_remaining),
      nextExpiryAt: row.next_expiry_at ?? null,
    },
  }
}

export async function getFeatureCapacityPlans(
  featureKey: string,
): Promise<
  | { success: true; plans: FeatureCapacityPlan[]; marketCode: string }
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('country')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  const marketCode =
    profile?.country?.trim().toLowerCase() === 'sudan'
      ? 'SD'
      : 'GLOBAL'

  const { data: plans, error: plansError } = await supabase
    .from('feature_capacity_plans')
    .select(
      'id, plan_key, name_ar, name_en, capacity_kind, capacity_units, duration_seconds, sort_order',
    )
    .eq('feature_key', cleanFeatureKey)
    .eq('enabled', true)
    .order('sort_order', { ascending: true })
    .order('plan_key', { ascending: true })

  if (plansError) {
    return { success: false, error: plansError.message }
  }

  if (!plans || plans.length === 0) {
    return {
      success: true,
      plans: [],
      marketCode,
    }
  }

  const planIds = plans.map((plan) => plan.id)

  const { data: prices, error: pricesError } = await supabase
    .from('feature_plan_prices')
    .select('plan_id, market_code, currency_code, amount, enabled')
    .in('plan_id', planIds)
    .eq('currency_code', 'COINS')
    .eq('enabled', true)

  if (pricesError) {
    return { success: false, error: pricesError.message }
  }

  const result: FeatureCapacityPlan[] = []

  for (const plan of plans) {
    const planPrices = (prices ?? []).filter(
      (price) => price.plan_id === plan.id,
    )

    const price =
      planPrices.find(
        (item) => item.market_code === marketCode,
      ) ??
      planPrices.find(
        (item) => item.market_code === 'GLOBAL',
      )

    if (!price) continue

    result.push({
      id: plan.id,
      planKey: plan.plan_key,
      nameAr: plan.name_ar,
      nameEn: plan.name_en,
      capacityKind: plan.capacity_kind,
      capacityUnits: Number(plan.capacity_units),
      durationSeconds: Number(plan.duration_seconds),
      marketCode: price.market_code,
      currencyCode: price.currency_code,
      amount: Number(price.amount),
    })
  }

  return {
    success: true,
    plans: result,
    marketCode,
  }
}

export async function purchaseFeatureCapacityPlan(
  planId: string,
  marketCode: string,
  currencyCode = 'COINS',
) {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const { data, error } = await supabase.rpc(
    'purchase_feature_capacity_plan',
    {
      p_plan_id: planId,
      p_market_code: marketCode,
      p_currency_code: currencyCode,
    },
  )

  if (error || !data?.[0]) {
    console.error(
      '[purchaseFeatureCapacityPlan] RPC failed:',
      error,
      data,
    )

    return {
      success: false as const,
      error: error?.message ?? 'Failed to purchase capacity plan',
    }
  }

  return {
    success: true as const,
    purchase: data[0],
  }
}
