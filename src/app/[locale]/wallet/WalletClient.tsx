'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Send,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import {
  lookupWalletRecipient,
  transferWallet,
} from '@/app/[locale]/actions/wallet'

type Transaction = {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
  transfer_id?: string | null
  transfer_amount?: number | null
  transfer_fee?: number | null
  transfer_total?: number | null
  transfer_note?: string | null
}

type Recipient = {
  wallet_number: number
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

type Transfer = {
  transfer_id: string
  sender_wallet_number: number
  recipient_wallet_number: number
  amount: number
  fee_amount: number
  total_debited: number
  sender_balance: number
  recipient_balance: number
  created_at: string
  note: string | null
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

  const result =
    `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod')}`

  if (!isArabic) {
    return result
  }

  return result.replace(
    /[0-9]/g,
    (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)],
  )
}

function formatInvoiceNumber(transferId: string) {
  return transferId.replace(/-/g, '').slice(0, 12).toUpperCase()
}

async function imageToDataUrl(path: string) {
  const response = await fetch(
    new URL(path, window.location.origin).toString(),
  )

  if (!response.ok) {
    throw new Error('Failed to load invoice image')
  }

  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to encode invoice image'))
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function WalletClient({
  locale,
  wallet,
  transactions: initialTransactions,
}: WalletClientProps) {
  const isArabic = locale === 'ar'
  const [balance, setBalance] = useState(wallet.balance)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [transactionFilter, setTransactionFilter] = useState<
    'all' | 'received' | 'sent'
  >('all')
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [balancePreferenceLoaded, setBalancePreferenceLoaded] =
    useState(false)

  const [showSend, setShowSend] = useState(false)
  const [sendStep, setSendStep] = useState<
    'recipient' | 'details' | 'invoice'
  >('recipient')

  const [recipient, setRecipient] = useState('')
  const [recipientData, setRecipientData] =
    useState<Recipient | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [completedTransfer, setCompletedTransfer] =
    useState<Transfer | null>(null)

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
    all: isArabic ? 'الكل' : 'All',
    received: isArabic ? 'المستلمة' : 'Received',
    sentTransactions: isArabic ? 'المرسلة' : 'Sent',
    transactionDetails: isArabic ? 'تفاصيل العملية' : 'Transaction details',
    transactionType: isArabic ? 'نوع العملية' : 'Transaction type',
    transactionId: isArabic ? 'رقم العملية' : 'Transaction ID',
    close: isArabic ? 'إغلاق' : 'Close',
    receivedType: isArabic ? 'عملية مستلمة' : 'Received transaction',
    sentType: isArabic ? 'عملية مرسلة' : 'Sent transaction',
    otherType: isArabic ? 'عملية مالية' : 'Financial transaction',
    noTransactions: isArabic ? 'لا توجد عمليات بعد' : 'No transactions yet',
    recipient: isArabic
      ? 'رقم محفظة المستلم'
      : 'Recipient wallet number',
    verify: isArabic ? 'تحقق' : 'Verify',
    amount: isArabic ? 'المبلغ' : 'Amount',
    fee: isArabic ? 'رسوم التحويل' : 'Transfer fee',
    total: isArabic ? 'الإجمالي على المرسل' : 'Total charged',
    note: isArabic ? 'ملاحظة' : 'Note',
    optional: isArabic ? 'اختياري' : 'Optional',
    cancel: isArabic ? 'إلغاء' : 'Cancel',
    confirm: isArabic ? 'إرسال' : 'Send',
    sending: isArabic ? 'جارٍ الإرسال...' : 'Sending...',
    verifying: isArabic ? 'جارٍ التحقق...' : 'Verifying...',
    sent: isArabic ? 'تم التحويل بنجاح' : 'Transfer completed successfully',
    coins: isArabic ? 'عملات' : 'Coins',
    recipientFound: isArabic ? 'المستلم' : 'Recipient',
    invoice: isArabic ? 'فاتورة التحويل' : 'Transfer invoice',
    invoiceNumber: isArabic ? 'رقم الفاتورة' : 'Invoice number',
    date: isArabic ? 'التاريخ والوقت' : 'Date & time',
    from: isArabic ? 'من الحساب' : 'From account',
    to: isArabic ? 'إلى الحساب' : 'To account',
    download: isArabic ? 'تحميل' : 'Download',
    done: isArabic ? 'تم' : 'Done',
    invoiceDownloadFailed: isArabic
      ? 'تعذر تحميل الفاتورة'
      : 'Unable to download invoice',
    noRecipient: isArabic
      ? 'لم يتم العثور على محفظة بهذا الرقم'
      : 'No wallet was found with this number',
    recipientBlocked: isArabic
      ? 'لا يمكن إجراء التحويل إلى هذا الحساب'
      : 'This account cannot receive this transfer',
  }

  function resetSend() {
    setShowSend(false)
    setSendStep('recipient')
    setRecipient('')
    setRecipientData(null)
    setAmount('')
    setNote('')
    setCompletedTransfer(null)
    setError(null)
  }

  function openSend() {
    setSuccess(null)
    setError(null)
    setSendStep('recipient')
    setRecipient('')
    setRecipientData(null)
    setAmount('')
    setNote('')
    setCompletedTransfer(null)
    setShowSend(true)
  }

  function verifyRecipient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await lookupWalletRecipient(recipient)

      if (!result.success) {
        setError(
          result.error === 'Recipient wallet not found'
            ? labels.noRecipient
            : result.error,
        )
        return
      }

      setRecipientData(result.recipient)
      setSendStep('details')
    })
  }

  function submitTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!recipientData) {
      setError(labels.noRecipient)
      return
    }

    startTransition(async () => {
      const result = await transferWallet(
        String(recipientData.wallet_number),
        amount,
        note,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      const transfer = result.transfer as Transfer

      setBalance(transfer.sender_balance)
      setCompletedTransfer(transfer)

      setTransactions((current) => [
        {
          id: transfer.transfer_id,
          amount: -transfer.total_debited,
          type: 'transfer_out',
          description: isArabic
            ? 'تحويل إلى محفظة ' +
              transfer.recipient_wallet_number
            : 'Transfer to wallet ' +
              transfer.recipient_wallet_number,
          created_at: transfer.created_at,
        },
        ...current,
      ])

      setSendStep('invoice')
      setSuccess(labels.sent)
    })
  }

  async function downloadInvoice() {
    if (!completedTransfer) {
      return
    }

    try {
      const [logoData, coinData] = await Promise.all([
        imageToDataUrl('/brand/logo.png'),
        imageToDataUrl('/brand/my-coins.png'),
      ])

      const transfer = completedTransfer
      const invoiceNumber = formatInvoiceNumber(
        transfer.transfer_id,
      )
      const date = formatTransactionDate(
        transfer.created_at,
        isArabic,
      )

      const html = `<!doctype html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${labels.invoice} #${invoiceNumber}</title>
<style>
body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;padding:32px}
.invoice{max-width:680px;margin:auto;background:white;border-radius:24px;padding:36px;box-sizing:border-box}
.header{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #e5e7eb;padding-bottom:24px}
.logo{height:48px;object-fit:contain}.coin{height:46px;object-fit:contain}
h1{font-size:24px;margin:24px 0 6px}.muted{color:#6b7280;font-size:13px}
.row{display:flex;justify-content:space-between;gap:24px;padding:14px 0;border-bottom:1px solid #f3f4f6}
.label{color:#6b7280;font-size:13px}.value{font-weight:600;text-align:${isArabic ? 'left' : 'right'};word-break:break-word}
.total{margin-top:18px;padding:18px;border-radius:16px;background:#f9fafb;display:flex;justify-content:space-between;font-weight:700}
.note{margin-top:18px;padding:16px;background:#f9fafb;border-radius:16px}
.footer{margin-top:28px;text-align:center;color:#9ca3af;font-size:12px}
</style>
</head>
<body>
<div class="invoice">
<div class="header">
<img class="logo" src="${logoData}" alt="MyLab">
<img class="coin" src="${coinData}" alt="Coins">
</div>
<h1>${labels.invoice}</h1>
<div class="muted">#${invoiceNumber}</div>
<div style="margin-top:24px">
<div class="row"><span class="label">${labels.invoiceNumber}</span><span class="value">#${invoiceNumber}</span></div>
<div class="row"><span class="label">${labels.date}</span><span class="value">${date}</span></div>
<div class="row"><span class="label">${labels.from}</span><span class="value">${transfer.sender_wallet_number}</span></div>
<div class="row"><span class="label">${labels.to}</span><span class="value">${transfer.recipient_wallet_number}</span></div>
<div class="row"><span class="label">${labels.amount}</span><span class="value">${transfer.amount} ${labels.coins}</span></div>
<div class="row"><span class="label">${labels.fee}</span><span class="value">${transfer.fee_amount} ${labels.coins}</span></div>
</div>
<div class="total"><span>${labels.total}</span><span>${transfer.total_debited} ${labels.coins}</span></div>
${transfer.note ? `<div class="note"><div class="label">${labels.note}</div><div style="margin-top:8px">${transfer.note.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div>` : ''}
<div class="footer">MyLab</div>
</div>
</body>
</html>`

      const blob = new Blob([html], {
        type: 'text/html;charset=utf-8',
      })

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mylab-invoice-${invoiceNumber}.html`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError(labels.invoiceDownloadFailed)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">
              {labels.title}
            </h1>
            <p className="text-sm text-gray-500">
              {wallet.ownerName ?? '-'}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {labels.balance}
              </p>
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
              aria-label={
                showBalance ? 'Hide balance' : 'Show balance'
              }
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
              <p className="text-xs text-gray-500">
                {labels.walletNumber}
              </p>

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
              <p className="text-xs text-gray-500">
                {labels.owner}
              </p>
              <p className="mt-1 truncate font-semibold text-gray-900">
                {wallet.ownerName ?? '-'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openSend}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {labels.transactions}
            </h2>

            <div className="grid w-full grid-cols-3 rounded-xl border border-gray-200 bg-gray-50 p-1 sm:w-auto">
              {([
                ['all', labels.all],
                ['received', labels.received],
                ['sent', labels.sentTransactions],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTransactionFilter(value)}
                  className={
                    transactionFilter === value
                      ? 'rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm'
                      : 'rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-900'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const filteredTransactions = transactions.filter((transaction) => {
              if (transactionFilter === 'received') {
                return transaction.amount > 0
              }

              if (transactionFilter === 'sent') {
                return transaction.type === 'transfer_out'
              }

              return true
            })

            if (filteredTransactions.length === 0) {
              return (
                <p className="mt-6 text-sm text-gray-500">
                  {labels.noTransactions}
                </p>
              )
            }

            return (
              <div className="mt-4 divide-y divide-gray-100">
                {filteredTransactions.map((transaction) => {
                  const incoming = transaction.amount > 0

                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => setSelectedTransaction(transaction)}
                      className="flex w-full items-center gap-3 py-4 text-start transition hover:bg-gray-50"
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
                          {transaction.description ??
                            transaction.type}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatTransactionDate(
                            transaction.created_at,
                            isArabic,
                          )}
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
                    </button>
                  )
                })}
              </div>
            )
          })()}
        </section>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-transaction-title"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl"
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/logo.png"
                    alt="MyLab"
                    className="h-10 w-10 rounded-xl object-contain"
                  />

                  <div>
                    <h2
                      id="wallet-transaction-title"
                      className="text-lg font-bold text-gray-900"
                    >
                      {labels.transactionDetails}
                    </h2>
                    <p className="text-xs text-gray-500">
                      MyLab
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                  aria-label={labels.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 border-t border-dashed border-gray-200 pt-6">
                <div className="flex items-center justify-center">
                  <img
                    src="/brand/my-coins.png"
                    alt={labels.coins}
                    className="h-14 w-14 object-contain"
                  />
                </div>

                <p className="mt-3 text-center text-xs font-medium text-gray-500">
                  {selectedTransaction.type === 'transfer_in'
                    ? labels.receivedType
                    : selectedTransaction.type === 'transfer_out'
                      ? labels.sentType
                      : labels.otherType}
                </p>

                <p
                  className={
                    selectedTransaction.amount > 0
                      ? 'mt-2 text-center text-3xl font-bold text-green-600'
                      : 'mt-2 text-center text-3xl font-bold text-gray-900'
                  }
                >
                  {selectedTransaction.amount > 0 ? '+' : ''}
                  {Math.abs(
                    selectedTransaction.amount,
                  ).toLocaleString()}
                </p>

                <p className="mt-1 text-center text-xs text-gray-500">
                  {labels.coins}
                </p>
              </div>

              <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="flex items-start justify-between gap-4 p-4">
                  <span className="text-xs text-gray-500">
                    {labels.transactionId}
                  </span>
                  <span className="max-w-[65%] break-all text-end font-mono text-xs font-semibold text-gray-900">
                    {formatInvoiceNumber(
  selectedTransaction.transfer_id ?? selectedTransaction.id,
)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 p-4">
                  <span className="text-xs text-gray-500">
                    {labels.date}
                  </span>
                  <span className="text-end text-xs font-semibold text-gray-900">
                    {formatTransactionDate(
                      selectedTransaction.created_at,
                      isArabic,
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 p-4">
                  <span className="text-xs text-gray-500">
                    {labels.transactionType}
                  </span>
                  <span className="text-end text-sm font-semibold text-gray-900">
                    {selectedTransaction.type === 'transfer_in'
                      ? labels.receivedType
                      : selectedTransaction.type === 'transfer_out'
                        ? labels.sentType
                        : labels.otherType}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 p-4">
                  <span className="text-xs text-gray-500">
                    {labels.note}
                  </span>
                  <span className="max-w-[65%] break-words text-end text-sm font-semibold text-gray-900">
                    {selectedTransaction.transfer_note ??
  selectedTransaction.description ??
  '-'}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {labels.amount}
                  </span>

                  <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                    {Math.abs(
                      selectedTransaction.amount,
                    ).toLocaleString()}
                    <img
                      src="/brand/my-coins.png"
                      alt={labels.coins}
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                </div>

                {selectedTransaction.type === 'transfer_out' &&
                  selectedTransaction.transfer_fee !== null &&
                  selectedTransaction.transfer_fee !== undefined && (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {labels.fee}
                      </span>

                      <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                        {selectedTransaction.transfer_fee}
                        <img
                          src="/brand/my-coins.png"
                          alt={labels.coins}
                          className="h-4 w-4 object-contain"
                        />
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <span className="font-semibold text-gray-900">
                        {labels.total}
                      </span>

                      <span className="inline-flex items-center gap-1 text-lg font-bold text-gray-900">
                        {Math.abs(
                          selectedTransaction.transfer_amount ??
                            selectedTransaction.amount,
                        ).toLocaleString()}
                        <img
                          src="/brand/my-coins.png"
                          alt={labels.coins}
                          className="h-5 w-5 object-contain"
                        />
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-dashed border-gray-200 pt-5 text-center">
                <p className="text-xs text-gray-400">
                  MyLab
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="min-h-12 flex-1 rounded-xl bg-primary-600 px-5 font-semibold text-white transition hover:bg-primary-700"
                >
                  {labels.close}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const transaction = selectedTransaction
                    if (!transaction) return

                    const transactionId = formatInvoiceNumber(
                      transaction.transfer_id ?? transaction.id,
                    )

                    const transactionNote =
                      transaction.transfer_note ??
                      transaction.description ??
                      '-'

                    const transactionAmount =
                      transaction.transfer_amount ??
                      Math.abs(transaction.amount)

                    const transactionFee =
                      transaction.transfer_fee ?? 0

                    const transactionTotal =
                      transaction.transfer_total ??
                      transactionAmount

                    const htmlParts = [
                      '<!DOCTYPE html>',
                      '<html lang="' + (isArabic ? 'ar' : 'en') + '" dir="' + (isArabic ? 'rtl' : 'ltr') + '">',
                      '<head>',
                      '<meta charset="UTF-8" />',
                      '<title>' + labels.invoice + ' - ' + transactionId + '</title>',
                      '<style>',
                      'body{margin:0;padding:40px 20px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827}',
                      '.invoice{max-width:520px;margin:0 auto;background:white;border-radius:24px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,.08)}',
                      '.brand{text-align:center;font-size:24px;font-weight:700;margin-bottom:8px}',
                      '.title{text-align:center;color:#6b7280;margin-bottom:28px}',
                      '.coin{display:block;width:64px;height:64px;object-fit:contain;margin:0 auto 12px}',
                      '.amount{text-align:center;font-size:32px;font-weight:700;margin:8px 0}',
                      '.coins{text-align:center;color:#6b7280;font-size:13px;margin-bottom:28px}',
                      '.row{display:flex;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px dashed #e5e7eb}',
                      '.label{color:#6b7280;font-size:13px}',
                      '.value{font-weight:600;text-align:end;word-break:break-word}',
                      '.total{font-size:18px;font-weight:700;padding-top:18px}',
                      '</style>',
                      '</head>',
                      '<body>',
                      '<div class="invoice">',
                      '<div class="brand">MyLab</div>',
                      '<div class="title">' + labels.transactionDetails + '</div>',
                      '<img class="coin" src="/brand/my-coins.png" alt="' + labels.coins + '" />',
                      '<div class="amount">' + transactionAmount.toLocaleString() + '</div>',
                      '<div class="coins">' + labels.coins + '</div>',
                      '<div class="row"><span class="label">' + labels.transactionId + '</span><span class="value">' + transactionId + '</span></div>',
                      '<div class="row"><span class="label">' + labels.date + '</span><span class="value">' + formatTransactionDate(transaction.created_at, isArabic) + '</span></div>',
                      '<div class="row"><span class="label">' + labels.transactionType + '</span><span class="value">' +
                        (transaction.type === 'transfer_in'
                          ? labels.receivedType
                          : transaction.type === 'transfer_out'
                            ? labels.sentType
                            : labels.otherType) +
                        '</span></div>',
                      '<div class="row"><span class="label">' + labels.note + '</span><span class="value">' + transactionNote + '</span></div>',
                      '<div class="row"><span class="label">' + labels.amount + '</span><span class="value">' + transactionAmount.toLocaleString() + '</span></div>',
                      transaction.type === 'transfer_out'
                        ? '<div class="row"><span class="label">' + labels.fee + '</span><span class="value">' + transactionFee.toLocaleString() + '</span></div>' +
                          '<div class="row total"><span>' + labels.total + '</span><span>' + transactionTotal.toLocaleString() + '</span></div>'
                        : '',
                      '</div>',
                      '</body>',
                      '</html>',
                    ]

                    const blob = new Blob([htmlParts.join('')], {
                      type: 'text/html;charset=utf-8',
                    })

                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')

                    link.href = url
                    link.download = transactionId + '.html'

                    document.body.appendChild(link)
                    link.click()
                    link.remove()

                    URL.revokeObjectURL(url)
                  }}
                  className="min-h-12 flex-1 rounded-xl border border-gray-200 bg-white px-5 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {labels.download}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {sendStep === 'invoice'
                  ? labels.invoice
                  : labels.send}
              </h2>

              {sendStep !== 'invoice' && (
                <button
                  type="button"
                  onClick={resetSend}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                  aria-label={labels.cancel}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {sendStep === 'recipient' && (
              <form
                onSubmit={verifyRecipient}
                className="mt-6 space-y-4"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    {labels.recipient}
                  </span>
                  <input
                    value={recipient}
                    onChange={(event) =>
                      setRecipient(event.target.value)
                    }
                    inputMode="numeric"
                    autoFocus
                    required
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetSend}
                    className="min-h-12 flex-1 rounded-xl border border-gray-200 px-4 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {labels.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-12 flex-1 rounded-xl bg-primary-600 px-4 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending
                      ? labels.verifying
                      : labels.verify}
                  </button>
                </div>
              </form>
            )}

            {sendStep === 'details' && recipientData && (
              <form
                onSubmit={submitTransfer}
                className="mt-6 space-y-4"
              >
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    {recipientData.avatar_url ? (
                      <img
                        src={recipientData.avatar_url}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-600">
                        {(recipientData.display_name ??
                          '?')
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">
                        {labels.recipientFound}
                      </p>
                      <p className="truncate font-bold text-gray-900">
                        {recipientData.display_name ?? '-'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {recipientData.wallet_number}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    {labels.amount}
                  </span>
                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    inputMode="numeric"
                    min="1"
                    step="1"
                    type="number"
                    autoFocus
                    required
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    {labels.note}{' '}
                    <span className="font-normal text-gray-400">
                      ({labels.optional})
                    </span>
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    maxLength={500}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                    onClick={resetSend}
                    className="min-h-12 flex-1 rounded-xl border border-gray-200 px-4 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {labels.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-12 flex-1 rounded-xl bg-primary-600 px-4 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending
                      ? labels.sending
                      : labels.confirm}
                  </button>
                </div>
              </form>
            )}

            {sendStep === 'invoice' && completedTransfer && (
              <div className="mt-6">
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                    <img
                      src="/brand/logo.png"
                      alt="MyLab"
                      className="h-10 max-w-36 object-contain"
                    />
                    <img
                      src="/brand/my-coins.png"
                      alt={labels.coins}
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <div className="space-y-0 px-5 py-3">
                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.invoiceNumber}
                      </span>
                      <span className="font-semibold text-gray-900">
                        #{formatInvoiceNumber(
                          completedTransfer.transfer_id,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.date}
                      </span>
                      <span className="text-right font-semibold text-gray-900">
                        {formatTransactionDate(
                          completedTransfer.created_at,
                          isArabic,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.from}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {completedTransfer.sender_wallet_number}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.to}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {completedTransfer.recipient_wallet_number}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.amount}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                        {completedTransfer.amount}
                        <img
                          src="/brand/my-coins.png"
                          alt={labels.coins}
                          className="h-4 w-4 object-contain"
                        />
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-gray-200 py-3 text-sm">
                      <span className="text-gray-500">
                        {labels.fee}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                        {completedTransfer.fee_amount}
                        <img
                          src="/brand/my-coins.png"
                          alt={labels.coins}
                          className="h-4 w-4 object-contain"
                        />
                      </span>
                    </div>

                    {completedTransfer.note && (
                      <div className="py-3 text-sm">
                        <p className="text-gray-500">
                          {labels.note}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                          {completedTransfer.note}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mx-5 mb-5 flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="font-semibold text-gray-700">
                      {labels.total}
                    </span>
                    <span className="inline-flex items-center gap-1 text-lg font-bold text-gray-900">
                      {completedTransfer.total_debited}
                      <img
                        src="/brand/my-coins.png"
                        alt={labels.coins}
                        className="h-5 w-5 object-contain"
                      />
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={resetSend}
                    className="min-h-12 flex-1 rounded-xl border border-gray-200 px-4 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {labels.done}
                  </button>

                  <button
                    type="button"
                    onClick={downloadInvoice}
                    className="min-h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 font-semibold text-white hover:bg-primary-700"
                  >
                    <Download className="h-5 w-5" />
                    {labels.download}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <FileText className="h-4 w-4" />
                  {labels.invoice}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
