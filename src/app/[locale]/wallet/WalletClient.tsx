'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import { transferWallet } from '@/app/[locale]/actions/wallet'

type Transaction = {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

type WalletClientProps = {
  locale: string
  wallet: {
    id: string
    walletNumber: number
    balance: number
    ownerName: string | null
  }
  transactions: Transaction[]
}

function CoinLabel({ count, label }: { count?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {count !== undefined && <span>{count.toLocaleString()}</span>}
      <img
        src="/brand/my-coins.png"
        alt={label}
        className="h-5 w-5 object-contain"
      />
      <span>{label}</span>
    </span>
  )
}

function formatTransactionDate(value: string, isArabic: boolean) {
  const date = new Date(value)

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Khartoum',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  const result = `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod')}`

  if (!isArabic) {
    return result
  }

  return result.replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])
}

export default function WalletClient({
  locale,
  wallet,
  transactions: initialTransactions,
}: WalletClientProps) {
  const isArabic = locale === 'ar'
  const [balance, setBalance] = useState(wallet.balance)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showBalance, setShowBalance] = useState(true)
  const [balancePreferenceLoaded, setBalancePreferenceLoaded] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedWalletNumber, setCopiedWalletNumber] = useState(false)

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(
      'mylab-wallet-show-balance',
    )

    if (storedPreference === 'false') {
      setShowBalance(false)
    } else if (storedPreference === 'true') {
      setShowBalance(true)
    }

    setBalancePreferenceLoaded(true)
  }, [])

  useEffect(() => {
    if (!balancePreferenceLoaded) {
      return
    }

    window.localStorage.setItem(
      'mylab-wallet-show-balance',
      String(showBalance),
    )
  }, [showBalance, balancePreferenceLoaded])

  const labels = {
    title: isArabic ? 'المحفظة' : 'Wallet',
    balance: isArabic ? 'الرصيد' : 'Balance',
    walletNumber: isArabic ? 'رقم المحفظة' : 'Wallet number',
    owner: isArabic ? 'صاحب المحفظة' : 'Owner',
    send: isArabic ? 'إرسال' : 'Send',
    transactions: isArabic ? 'آخر العمليات' : 'Recent transactions',
    noTransactions: isArabic ? 'لا توجد عمليات بعد' : 'No transactions yet',
    recipient: isArabic ? 'رقم محفظة المستلم' : 'Recipient wallet number',
    amount: isArabic ? 'المبلغ' : 'Amount',
    fee: isArabic ? 'رسوم التحويل' : 'Transfer fee',
    total: isArabic ? 'الإجمالي على المرسل' : 'Total charged',
    cancel: isArabic ? 'إلغاء' : 'Cancel',
    confirm: isArabic ? 'تأكيد الإرسال' : 'Confirm transfer',
    sending: isArabic ? 'جارٍ الإرسال...' : 'Sending...',
    sent: isArabic ? 'تم التحويل بنجاح' : 'Transfer completed successfully',
    coins: isArabic ? 'Coin' : 'Coin',
  }

  function submitTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await transferWallet(recipient, amount)

      if (!result.success) {
        setError(result.error)
        return
      }

      const transfer = result.transfer

      setBalance(transfer.sender_balance)
      setRecipient('')
      setAmount('')
      setSuccess(labels.sent)
      setShowSend(false)

      setTransactions((current) => [
        {
          id: transfer.transfer_id,
          amount: -transfer.total_debited,
          type: 'transfer_out',
          description: isArabic
            ? 'تحويل إلى محفظة ' + transfer.recipient_wallet_number
            : 'Transfer to wallet ' + transfer.recipient_wallet_number,
          created_at: transfer.created_at,
        },
        ...current,
      ])
    })
  }

  const parsedAmount = Number(amount)
  const total =
    Number.isSafeInteger(parsedAmount) && parsedAmount > 0
      ? parsedAmount + 1
      : null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
            <p className="text-sm text-gray-500">{wallet.ownerName ?? '-'}</p>
          </div>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">{labels.balance}</p>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src="/brand/my-coins.png"
                  alt={labels.coins}
                  className="h-9 w-9 shrink-0 object-contain"
                />

                {showBalance ? (
                  <p className="text-4xl font-bold tracking-tight text-gray-900">
                    {balance.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-4xl font-bold tracking-tight text-gray-900">
                    ••••
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBalance((value) => !value)}
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            >
              {showBalance ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">{labels.walletNumber}</p>

              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-semibold text-gray-900">
                  {wallet.walletNumber}
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        String(wallet.walletNumber),
                      )
                      setCopiedWalletNumber(true)

                      window.setTimeout(() => {
                        setCopiedWalletNumber(false)
                      }, 1800)
                    } catch {
                      setCopiedWalletNumber(false)
                    }
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-primary-600"
                  aria-label={
                    copiedWalletNumber
                      ? isArabic
                        ? 'تم نسخ رقم المحفظة'
                        : 'Wallet number copied'
                      : isArabic
                        ? 'نسخ رقم المحفظة'
                        : 'Copy wallet number'
                  }
                  title={
                    copiedWalletNumber
                      ? isArabic
                        ? 'تم النسخ'
                        : 'Copied'
                      : isArabic
                        ? 'نسخ'
                        : 'Copy'
                  }
                >
                  {copiedWalletNumber ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">{labels.owner}</p>
              <p className="mt-1 truncate font-semibold text-gray-900">
                {wallet.ownerName ?? '-'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSend(true)
              setError(null)
              setSuccess(null)
            }}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold text-white transition hover:bg-primary-700"
          >
            <Send className="h-5 w-5" />
            {labels.send}
          </button>

          {success && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-gray-900">
            {labels.transactions}
          </h2>

          {transactions.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">{labels.noTransactions}</p>
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {transactions.map((transaction) => {
                const incoming = transaction.amount > 0

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 py-4"
                  >
                    <span
                      className={
                        incoming
                          ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600'
                          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600'
                      }
                    >
                      {incoming ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {transaction.description ?? transaction.type}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatTransactionDate(transaction.created_at, isArabic)}
                      </p>
                    </div>

                    <p
                      className={
                        incoming
                          ? 'shrink-0 font-semibold text-green-600'
                          : 'shrink-0 font-semibold text-gray-900'
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {incoming ? '+' : ''}
                        {transaction.amount.toLocaleString()}
                        <img
                          src="/brand/my-coins.png"
                          alt={labels.coins}
                          className="h-4 w-4 object-contain"
                        />
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-send-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="wallet-send-title"
                className="text-xl font-bold text-gray-900"
              >
                {labels.send}
              </h2>

              <button
                type="button"
                onClick={() => setShowSend(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                aria-label={labels.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitTransfer} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  {labels.recipient}
                </span>
                <input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  inputMode="numeric"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  {labels.amount}
                </span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="numeric"
                  min="1"
                  step="1"
                  type="number"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <p className="flex items-center gap-1.5">
                  {labels.fee}: 1
                  <img
                    src="/brand/my-coins.png"
                    alt={labels.coins}
                    className="h-4 w-4 object-contain"
                  />
                </p>

                {total !== null && (
                  <p className="mt-1 font-semibold text-gray-900">
                    {labels.total}:{' '}
                    <span className="inline-flex items-center gap-1">
                      {total}
                      <img
                        src="/brand/my-coins.png"
                        alt={labels.coins}
                        className="h-4 w-4 object-contain"
                      />
                    </span>
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSend(false)}
                  className="min-h-12 flex-1 rounded-xl border border-gray-200 px-4 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {labels.cancel}
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-12 flex-1 rounded-xl bg-primary-600 px-4 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? labels.sending : labels.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
