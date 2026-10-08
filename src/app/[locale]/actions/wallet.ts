'use server'

import { createClient } from '@/lib/supabase/server'
import { purchaseFeatureCapacityPlan } from '@/lib/features/access'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'

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

  const { data: transfers, error: transfersError } = await supabase
    .from('wallet_transfers')
    .select(
      'id, sender_wallet_id, recipient_wallet_id, amount, fee_amount, total_debited, note, created_at',
    )
    .or(
      `sender_wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`,
    )
    .order('created_at', { ascending: false })
    .limit(30)

  if (transfersError) {
    return {
      success: false as const,
      error: transfersError.message,
    }
  }

  const enrichedTransactions = (transactions ?? []).map((transaction) => {
    const transfer = (transfers ?? []).find((item) => {
      const sameWallet =
        item.sender_wallet_id === wallet.id ||
        item.recipient_wallet_id === wallet.id

      const sameTime =
        new Date(item.created_at).getTime() ===
        new Date(transaction.created_at).getTime()

      const sameAmount =
        item.sender_wallet_id === wallet.id
          ? transaction.amount === -item.total_debited
          : transaction.amount === item.amount

      return sameWallet && sameTime && sameAmount
    })

    return {
      ...transaction,
      transfer_id: transfer?.id ?? null,
      transfer_amount: transfer?.amount ?? null,
      transfer_fee: transfer?.fee_amount ?? null,
      transfer_total: transfer?.total_debited ?? null,
      transfer_note: transfer?.note ?? null,
      transfer_sender_wallet:
        transfer?.sender_wallet_id === wallet.id
          ? wallet.wallet_number
          : null,
      transfer_recipient_wallet:
        transfer?.recipient_wallet_id === wallet.id
          ? wallet.wallet_number
          : null,
    }
  })

  return {
    success: true as const,
    wallet: {
      id: wallet.id,
      walletNumber: wallet.wallet_number,
      balance: wallet.balance,
      ownerName: profile?.display_name ?? null,
    },
    transactions: enrichedTransactions,
  }
}

export async function lookupWalletRecipient(
  recipientWalletNumber: string,
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

  const walletNumber = Number(recipientWalletNumber)

  if (!Number.isSafeInteger(walletNumber) || walletNumber <= 0) {
    return {
      success: false as const,
      error: 'Invalid recipient wallet number',
    }
  }

  const { data, error } = await supabase.rpc(
    'lookup_wallet_recipient',
    {
      p_wallet_number: walletNumber,
    },
  )

  if (error || !data?.[0]) {
    return {
      success: false as const,
      error: error?.message ?? 'Recipient wallet not found',
    }
  }

  const recipient = data[0]

  let avatarUrl = recipient.avatar_url

  if (avatarUrl?.startsWith('imagekit:')) {
    avatarUrl = getImagekitSignedUrl(
      avatarUrl.slice('imagekit:'.length),
    )
  }

  return {
    success: true as const,
    recipient: {
      ...recipient,
      avatar_url: avatarUrl,
    },
  }
}

export async function transferWallet(
  recipientWalletNumber: string,
  amount: string,
  note = '',
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

  const cleanNote = note.trim()

  if (cleanNote.length > 500) {
    return {
      success: false as const,
      error: 'Transfer note is too long',
    }
  }

  const { data, error } = await supabase.rpc(
    'transfer_wallet',
    {
      p_recipient_wallet_number: recipient,
      p_amount: value,
      p_note: cleanNote || null,
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
