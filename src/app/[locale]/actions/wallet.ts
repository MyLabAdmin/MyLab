'use server'

import { createClient } from '@/lib/supabase/server'
import { purchaseFeatureCapacityPlan } from '@/lib/features/access'

export async function getWalletData() {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const userId = userData.user.id

  const [{ data: wallet, error: walletError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from('wallets')
        .select('id, wallet_number, balance')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles_public')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle(),
    ])

  if (walletError) {
    return {
      success: false as const,
      error: walletError.message,
    }
  }

  if (profileError) {
    return {
      success: false as const,
      error: profileError.message,
    }
  }

  if (!wallet) {
    return {
      success: false as const,
      error: 'Wallet not found',
    }
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('wallet_transactions')
    .select('id, amount, type, description, created_at')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (transactionsError) {
    return {
      success: false as const,
      error: transactionsError.message,
    }
  }

  return {
    success: true as const,
    wallet: {
      id: wallet.id,
      walletNumber: wallet.wallet_number,
      balance: wallet.balance,
      ownerName: profile?.display_name ?? null,
    },
    transactions: transactions ?? [],
  }
}

export async function transferWallet(
  recipientWalletNumber: string,
  amount: string,
) {
  const supabase = await createClient()

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      success: false as const,
      error: 'Not authenticated',
    }
  }

  const recipient = Number(recipientWalletNumber)
  const value = Number(amount)

  if (
    !Number.isSafeInteger(recipient) ||
    recipient <= 0
  ) {
    return {
      success: false as const,
      error: 'Invalid recipient wallet number',
    }
  }

  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return {
      success: false as const,
      error: 'Transfer amount must be a positive whole number',
    }
  }

  const { data, error } = await supabase.rpc(
    'transfer_wallet',
    {
      p_recipient_wallet_number: recipient,
      p_amount: value,
    },
  )

  if (error || !data?.[0]) {
    return {
      success: false as const,
      error: error?.message ?? 'Transfer failed',
    }
  }

  return {
    success: true as const,
    transfer: data[0],
  }
}

export async function getWalletBalance() {
  const result = await getWalletData()

  if (!result.success) {
    return result
  }

  return {
    success: true as const,
    wallet: {
      id: result.wallet.id,
      balance: result.wallet.balance,
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
