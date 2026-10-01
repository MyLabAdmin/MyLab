'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { upload } from '@imagekit/next'
import { useRouter } from 'next/navigation'
import {
  getFeatureCapacityPlans,
  getFeatureCapacityStatus,
  type FeatureCapacityPlan,
  type FeatureCapacityStatus,
} from '@/lib/features/access'
import {
  getWalletBalance,
  purchaseMessageMediaPlan,
} from '@/app/[locale]/actions/wallet'
import {
  sendMessage,
  type MessageAttachmentInput,
} from '@/app/[locale]/actions/messaging'

const FEATURE_KEY = 'message_media'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ATTACHMENTS = 10

type PendingAttachment = MessageAttachmentInput & {
  id: string
  previewUrl?: string
}

type CapacityState = {
  status: FeatureCapacityStatus | null
  plans: FeatureCapacityPlan[]
  marketCode: string | null
  walletBalance: number | null
}

export default function MessageComposer({
  conversationId,
  locale,
  isAdmin,
  disabled,
  disabledReason,
}: {
  conversationId: string
  locale: string
  isAdmin: boolean
  disabled?: boolean
  disabledReason?: string
}) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [error, setError] = useState('')
  const [capacity, setCapacity] = useState<CapacityState>({
    status: null,
    plans: [],
    marketCode: null,
    walletBalance: null,
  })
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showCapacityPanel, setShowCapacityPanel] = useState(false)
  const [isLoadingCapacity, setIsLoadingCapacity] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isArabic = locale === 'ar'
  const busy = isPending || isUploading || isPurchasing
  const composerDisabled = disabled === true

  useEffect(() => {
    void loadCapacity()
  }, [])

  async function loadCapacity() {
    if (isAdmin) {
      setCapacity({
        status: null,
        plans: [],
        marketCode: null,
        walletBalance: null,
      })
      setIsLoadingCapacity(false)
      return
    }

    setIsLoadingCapacity(true)

    try {
      const [statusResult, plansResult, walletResult] =
        await Promise.all([
          getFeatureCapacityStatus(FEATURE_KEY),
          getFeatureCapacityPlans(FEATURE_KEY),
          getWalletBalance(),
        ])

      if (!statusResult.success) {
        console.error(
          '[MessageComposer] capacity status failed:',
          statusResult.error,
        )
      }

      if (!plansResult.success) {
        console.error(
          '[MessageComposer] capacity plans failed:',
          plansResult.error,
        )
      }

      if (!walletResult.success) {
        console.error(
          '[MessageComposer] wallet balance failed:',
          walletResult.error,
        )
      }

      setCapacity({
        status: statusResult.success ? statusResult.status : null,
        plans: plansResult.success ? plansResult.plans : [],
        marketCode: plansResult.success
          ? plansResult.marketCode
          : null,
        walletBalance: walletResult.success
          ? walletResult.wallet.balance
          : null,
      })

      if (!plansResult.success) {
        setError(
          isArabic
            ? 'تعذر تحميل خيارات شراء سعة الصور والملفات.'
            : 'Unable to load image and file capacity options.',
        )
      }
    } finally {
      setIsLoadingCapacity(false)
    }
  }

  function formatDuration(seconds: number) {
    if (seconds >= 86400) {
      const days = Math.max(1, Math.round(seconds / 86400))
      return isArabic ? `${days} يوم${days === 1 ? '' : 'ًا'}` : `${days} days`
    }

    if (seconds >= 3600) {
      const hours = Math.max(1, Math.round(seconds / 3600))
      return isArabic ? `${hours} ساعة` : `${hours} hours`
    }

    const minutes = Math.max(1, Math.round(seconds / 60))
    return isArabic ? `${minutes} دقيقة` : `${minutes} minutes`
  }

  function formatPlanCapacity(plan: FeatureCapacityPlan) {
    if (plan.capacityKind === 'daily_bonus') {
      return isArabic
        ? `+${plan.capacityUnits} استخدام يومي`
        : `+${plan.capacityUnits} daily uses`
    }

    return isArabic
      ? `${plan.capacityUnits} استخدام`
      : `${plan.capacityUnits} uses`
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const item = current.find((attachment) => attachment.id === id)

      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }

      return current.filter((attachment) => attachment.id !== id)
    })
  }

  async function handleFiles(files: FileList) {
    if (composerDisabled) {
      return
    }

    setError('')

    const remaining = MAX_ATTACHMENTS - attachments.length

    if (remaining <= 0) {
      setError(
        isArabic
          ? 'يمكنك إرفاق 10 ملفات كحد أقصى.'
          : 'You can attach up to 10 files.',
      )
      return
    }

    if (!isAdmin) {
      const statusResult = await getFeatureCapacityStatus(FEATURE_KEY)

      if (!statusResult.success) {
        setError('MESSAGE_MEDIA_ACCESS_REQUIRED')
        return
      }

      const status = statusResult.status

      if (
        status.dailyRemaining <= 0 &&
        status.totalCapacityRemaining <= 0
      ) {
        setCapacity((current) => ({
          ...current,
          status,
        }))
        setError('MESSAGE_MEDIA_ACCESS_REQUIRED')
        return
      }

      setCapacity((current) => ({
        ...current,
        status,
      }))
    }

    const selected = Array.from(files).slice(0, remaining)

    setIsUploading(true)

    try {
      for (const file of selected) {
        if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
          setError(
            isArabic
              ? 'حجم كل ملف يجب ألا يتجاوز 5 ميجابايت.'
              : 'Each file must be 5MB or smaller.',
          )
          continue
        }

        const attachmentType = file.type.startsWith('image/')
          ? 'image'
          : 'file'

        const authRes = await fetch(
          '/api/upload-auth/imagekit?feature=message_media',
        )

        const auth = await authRes.json()

        if (!authRes.ok) {
          if (authRes.status === 403) {
            throw new Error('MESSAGE_MEDIA_ACCESS_REQUIRED')
          }

          throw new Error(
            auth.error ??
              (isArabic
                ? 'تعذر تجهيز الرفع.'
                : 'Upload authorization failed.'),
          )
        }

        const result = await upload({
          file,
          fileName: file.name,
          token: auth.token,
          signature: auth.signature,
          expire: auth.expire,
          publicKey: auth.publicKey,
          folder: `/messages/${conversationId}`,
          isPrivateFile: true,
          useUniqueFileName: true,
        })

        if (!result.filePath) {
          throw new Error(
            isArabic ? 'تعذر رفع الملف.' : 'File upload failed.',
          )
        }

        const previewUrl =
          attachmentType === 'image'
            ? URL.createObjectURL(file)
            : undefined

        setAttachments((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            mediaRef: `imagekit:${result.filePath}`,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            attachmentType,
            orderIndex: current.length,
            previewUrl,
          },
        ])
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''

      if (message === 'MESSAGE_MEDIA_ACCESS_REQUIRED') {
        setError('MESSAGE_MEDIA_ACCESS_REQUIRED')
      } else {
        setError(
          isArabic
            ? 'تعذر رفع الملف. حاول مرة أخرى.'
            : 'Failed to upload the file. Please try again.',
        )
      }
    } finally {
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function purchasePlan(plan: FeatureCapacityPlan) {
    if (isPurchasing) return

    setError('')
    setSelectedPlanId(plan.id)
    setIsPurchasing(true)

    try {
      const result = await purchaseMessageMediaPlan(
        plan.id,
        plan.marketCode,
        plan.currencyCode,
      )

      if (!result.success) {
        setError(
          isArabic
            ? 'تعذر شراء السعة. تحقق من رصيد المحفظة.'
            : 'Unable to purchase capacity. Check your wallet balance.',
        )
        return
      }

      await loadCapacity()
      setError('')
    } finally {
      setIsPurchasing(false)
      setSelectedPlanId(null)
    }
  }

  function submit() {
    const value = body.trim()

    if (
      composerDisabled ||
      (!value && attachments.length === 0) ||
      busy
    ) {
      return
    }

    setError('')

    const clientMessageId = crypto.randomUUID()

    startTransition(async () => {
      const result = await sendMessage(
        conversationId,
        value,
        clientMessageId,
        attachments.map(
          ({
            id: _id,
            previewUrl: _previewUrl,
            ...attachment
          }) => attachment,
        ),
      )

      if (result.success) {
        for (const attachment of attachments) {
          if (attachment.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl)
          }
        }

        setBody('')
        setAttachments([])
        setError('')
        void loadCapacity()
        router.refresh()
        textareaRef.current?.focus()
        return
      }

      if (
        result.error === 'MESSAGE_MEDIA_ACCESS_REQUIRED' ||
        result.error === 'MESSAGE_MEDIA_DAILY_LIMIT_REACHED'
      ) {
        setError(result.error)
        void loadCapacity()
        return
      }

      setError(
        isArabic
          ? 'تعذر إرسال الرسالة. حاول مرة أخرى.'
          : 'Failed to send the message. Please try again.',
      )
    })
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const status = capacity.status
  const hasCapacity =
    isAdmin ||
    status === null ||
    status.dailyRemaining > 0 ||
    status.totalCapacityRemaining > 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
      {composerDisabled && disabledReason && (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          {disabledReason}
        </div>
      )}
      {!isAdmin && !isLoadingCapacity && (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mb-2 flex items-center justify-between gap-2 px-1"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={[
                'text-xs font-medium',
                status &&
                (status.dailyRemaining > 0 ||
                  status.totalCapacityRemaining > 0)
                  ? 'text-gray-600'
                  : 'text-amber-700',
              ].join(' ')}
            >
              🖼️{' '}
              {status
                ? isArabic
                  ? `${status.totalRemaining} متبقية`
                  : `${status.totalRemaining} remaining`
                : isArabic
                  ? 'غير متاحة'
                  : 'Unavailable'}
            </span>

            {status?.effectiveDailyLimit ? (
              <span className="text-[10px] text-gray-400">
                {isArabic
                  ? `(${status.dailyUsage}/${status.effectiveDailyLimit} اليوم)`
                  : `(${status.dailyUsage}/${status.effectiveDailyLimit} today)`}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowCapacityPanel((current) => !current)}
            aria-expanded={showCapacityPanel}
            aria-label={
              isArabic
                ? 'إدارة سعة الصور والملفات'
                : 'Manage image and file capacity'
            }
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ⓘ
          </button>
        </div>
      )}

      {!isAdmin && showCapacityPanel && !isLoadingCapacity && (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isArabic ? 'سعة الصور والملفات' : 'Image & file capacity'}
              </p>

              {status && (
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isArabic
                    ? `المتاح حاليًا: ${status.totalRemaining} استخدام`
                    : `Available now: ${status.totalRemaining} uses`}
                </p>
              )}

              {capacity.walletBalance !== null && (
                <p className="mt-1 text-xs font-medium text-gray-600">
                  {isArabic
                    ? `الرصيد: ${capacity.walletBalance} عملة`
                    : `Balance: ${capacity.walletBalance} coins`}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCapacityPanel(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-gray-600"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              ×
            </button>
          </div>

          {capacity.plans.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {capacity.plans.map((plan) => {
                const affordable =
                  capacity.walletBalance !== null &&
                  capacity.walletBalance >= plan.amount

                const purchasing = selectedPlanId === plan.id

                return (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {isArabic ? plan.nameAr : plan.nameEn}
                    </p>

                    <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                      <p>{formatPlanCapacity(plan)}</p>
                      <p>
                        {isArabic
                          ? `المدة: ${formatDuration(plan.durationSeconds)}`
                          : `Duration: ${formatDuration(plan.durationSeconds)}`}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {plan.amount} {plan.currencyCode}
                      </span>

                      <button
                        type="button"
                        onClick={() => void purchasePlan(plan)}
                        disabled={
                          purchasing ||
                          isPurchasing ||
                          !affordable
                        }
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {purchasing
                          ? '...'
                          : isArabic
                            ? 'شراء'
                            : 'Purchase'}
                      </button>
                    </div>

                    {!affordable &&
                      capacity.walletBalance !== null && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {isArabic
                            ? 'الرصيد غير كافٍ.'
                            : 'Insufficient balance.'}
                        </p>
                      )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              {isArabic
                ? 'لا توجد خطط شراء متاحة حاليًا.'
                : 'No purchase plans are currently available.'}
            </p>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div
          className={
            'mb-3 flex flex-wrap gap-2 ' +
            (isArabic ? 'justify-end' : 'justify-start')
          }
        >
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.fileName}
                  className="h-20 w-20 object-cover"
                />
              ) : (
                <div className="flex h-20 w-32 items-center gap-2 px-3">
                  <span className="text-lg">📎</span>
                  <span className="min-w-0 truncate text-xs text-gray-600">
                    {attachment.fileName}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                disabled={busy}
                aria-label={
                  isArabic ? 'إزالة المرفق' : 'Remove attachment'
                }
                className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white transition hover:bg-black disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            composerDisabled ||
            busy ||
            attachments.length >= MAX_ATTACHMENTS ||
            !hasCapacity
          }
          aria-label={
            isArabic ? 'إضافة صورة أو ملف' : 'Add image or file'
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📎
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files)
            }
          }}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => {
            setBody(event.target.value)

            if (error) {
              setError('')
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={composerDisabled || busy}
          rows={1}
          dir={isArabic ? 'rtl' : 'ltr'}
          placeholder={
            isArabic ? 'اكتب رسالة...' : 'Write a message...'
          }
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60 sm:text-base"
        />

        <button
          type="button"
          onClick={submit}
          disabled={
            composerDisabled ||
            (!body.trim() && attachments.length === 0) ||
            busy
          }
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? '...'
            : isArabic
              ? 'إرسال'
              : 'Send'}
        </button>
      </div>

      {isUploading && (
        <p
          className={
            'mt-2 px-1 text-xs text-gray-500 ' +
            (isArabic ? 'text-right' : 'text-left')
          }
        >
          {isArabic ? 'جاري رفع الملفات...' : 'Uploading files...'}
        </p>
      )}

      {error === 'MESSAGE_MEDIA_ACCESS_REQUIRED' ||
      error === 'MESSAGE_MEDIA_DAILY_LIMIT_REACHED' ? (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"
        >
          <p className="font-semibold">
            {isArabic
              ? 'لا توجد سعة كافية لإرسال المرفقات حاليًا.'
              : 'There is not enough capacity to send attachments right now.'}
          </p>

          {capacity.plans.length > 0 && (
            <p className="mt-1">
              {isArabic
                ? 'يمكنك شراء إحدى خطط السعة المتاحة أعلاه.'
                : 'You can purchase one of the capacity plans above.'}
            </p>
          )}

          {capacity.plans.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCapacityPanel(true)}
              className="mt-2 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-200"
            >
              {isArabic ? 'عرض خطط الشراء' : 'View purchase plans'}
            </button>
          )}
        </div>
      ) : (
        error && (
          <p
            role="alert"
            className={
              'mt-2 px-1 text-xs text-red-500 ' +
              (isArabic ? 'text-right' : 'text-left')
            }
          >
            {error}
          </p>
        )
      )}
    </div>
  )
}
