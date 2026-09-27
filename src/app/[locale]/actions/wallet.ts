'use server'

import { createClient } from '@/lib/supabase/server'
import { purchaseFeatureCapacityPlan } from '@/lib/features/access'

export async function getWalletBalance() {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const { data, error } = await supabase
    .from('wallets')
    .select('id, wallet_number, balance')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error) {
    return {
      success: false as const,
      error: error.message,
    }
  }

  return {
    success: true as const,
    wallet: data
      ? {
          id: data.id,
          balance: data.balance,
        }
      : {
          id: null,
          balance: 0,
        },
  }
}

export async function purchaseMessageMedia() {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const { data, error } = await supabase.rpc(
    'purchase_feature_access',
    {
      p_feature_key: 'message_media',
    },
  )

  if (error || !data?.[0]) {
    return {
      success: false as const,
      error:
        error?.message ??
        'Failed to purchase message media access',
    }
  }

  return {
    success: true as const,
    purchase: data[0],
  }
}


export async function purchaseMessageMediaPlan(
  planId: string,
  marketCode: string,
  currencyCode = 'COINS',
) {
  const result = await purchaseFeatureCapacityPlan(
    planId,
    marketCode,
    currencyCode,
  )

  console.log('[purchaseMessageMediaPlan] result:', result)

  return result
}
