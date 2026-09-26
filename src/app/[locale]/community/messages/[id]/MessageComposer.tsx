'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { upload } from '@imagekit/next'
import {
  getFeatureAccess,
  getFeatureDailyUsage,
} from '@/lib/features/access'
import {
  getWalletBalance,
  purchaseMessageMedia,
} from '@/app/[locale]/actions/wallet'
import { useRouter } from 'next/navigation'
import {
  sendMessage,
  type MessageAttachmentInput,
} from '@/app/[locale]/actions/messaging'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ATTACHMENTS = 10

type PendingAttachment = MessageAttachmentInput & {
  id: string
  previewUrl?: string
}

export default function MessageComposer({
  conversationId,
  locale,
  isAdmin,
}: {
  conversationId: string
  locale: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [error, setError] = useState('')
  const [mediaAccess, setMediaAccess] = useState<Awaited<ReturnType<typeof getFeatureAccess>> | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [dailyUsage, setDailyUsage] = useState<
    Awaited<ReturnType<typeof getFeatureDailyUsage>> | null
  >(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [resetCountdown, setResetCountdown] = useState('')

  const isArabic = locale === 'ar'

  useEffect(() => {
    void loadMediaAccess()
  }, [])

  useEffect(() => {
    if (
      dailyUsage?.success !== true ||
      dailyUsage.usage.dailyLimit === 0
    ) {
      setResetCountdown('')
      return
    }

    const updateCountdown = () => {
      const remainingMs =
        new Date(dailyUsage.usage.resetAt).getTime() - Date.now()

      if (remainingMs <= 0) {
        setResetCountdown('')
        void loadMediaAccess()
        return
      }

      setResetCountdown(
        formatRemainingTime(dailyUsage.usage.resetAt),
      )
    }

    updateCountdown()

    const interval = window.setInterval(updateCountdown, 30000)

    return () => window.clearInterval(interval)
  }, [dailyUsage, isArabic])
  const busy = isPending || isUploading || isPurchasing

  function formatRemainingTime(resetAt: string) {
    const remainingMs = Math.max(
      new Date(resetAt).getTime() - Date.now(),
      0,
    )

    const totalMinutes = Math.ceil(remainingMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (isArabic) {
      if (hours > 0) {
        return minutes > 0
          ? `${hours} ساعة و${minutes} دقيقة`
          : `${hours} ساعة`
      }

      return `${Math.max(minutes, 1)} دقيقة`
    }

    if (hours > 0) {
      return minutes > 0
        ? `${hours}h ${minutes}m`
        : `${hours}h`
    }

    return `${Math.max(minutes, 1)}m`
  }

  async function loadMediaAccess() {
    if (isAdmin) {
      setMediaAccess(null)
      setWalletBalance(null)
      setDailyUsage(null)
      return
    }

    const [accessResult, walletResult, usageResult] =
      await Promise.all([
        getFeatureAccess('message_media'),
        getWalletBalance(),
        getFeatureDailyUsage('message_media'),
      ])

    setMediaAccess(accessResult)
    setDailyUsage(usageResult)

    if (walletResult.success) {
      setWalletBalance(walletResult.wallet.balance)
    }
  }

  async function purchaseAccess() {
    if (isPurchasing) {
      return
    }

    setError('')
    setIsPurchasing(true)

    try {
      const result = await purchaseMessageMedia()

      if (!result.success) {
        setError(
          isArabic
            ? 'تعذر شراء الميزة. تحقق من رصيد المحفظة.'
            : 'Unable to purchase the feature. Check your wallet balance.',
        )
        return
      }

      await loadMediaAccess()

      setError('')
    } finally {
      setIsPurchasing(false)
    }
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
    setError('')

    const remaining = MAX_ATTACHMENTS - attachments.length

    if (
      !isAdmin &&
      (mediaAccess?.success !== true || !mediaAccess.access.hasAccess)
    ) {
      setError('MESSAGE_MEDIA_ACCESS_REQUIRED')
      return
    }

    if (remaining <= 0) {
      setError(
        isArabic
          ? 'يمكنك إرفاق 10 ملفات كحد أقصى.'
          : 'You can attach up to 10 files.',
      )
      return
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
              (isArabic ? 'تعذر تجهيز الرفع.' : 'Upload authorization failed.'),
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

        const attachment: PendingAttachment = {
          id: crypto.randomUUID(),
          mediaRef: `imagekit:${result.filePath}`,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          attachmentType,
          orderIndex: attachments.length,
          previewUrl,
        }

        setAttachments((current) => [...current, attachment])
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

  function submit() {
    const value = body.trim()

    if ((!value && attachments.length === 0) || busy) {
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
        void loadMediaAccess()
        router.refresh()
        textareaRef.current?.focus()
        return
      }

      if (result.error === 'MESSAGE_MEDIA_ACCESS_REQUIRED') {
        setError('MESSAGE_MEDIA_ACCESS_REQUIRED')
        void loadMediaAccess()
        return
      }

      if (result.error === 'MESSAGE_MEDIA_DAILY_LIMIT_REACHED') {
        setError('MESSAGE_MEDIA_DAILY_LIMIT_REACHED')
        void loadMediaAccess()
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
      {!isAdmin &&
        mediaAccess?.success === true &&
        mediaAccess.access.enabled &&
        mediaAccess.access.price > 0 &&
        mediaAccess.access.durationSeconds > 0 && (
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={
              'mb-3 rounded-xl border p-3 ' +
              (mediaAccess.access.hasAccess
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50')
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={
                    'text-sm font-semibold ' +
                    (mediaAccess.access.hasAccess
                      ? 'text-green-900'
                      : 'text-amber-900')
                  }
                >
                  {mediaAccess.access.hasAccess
                    ? isArabic
                      ? '✓ ميزة الصور والملفات مفعّلة'
                      : '✓ Images and files are active'
                    : isArabic
                      ? 'الصور والملفات — اشتراك مدفوع'
                      : 'Images and files — paid subscription'}
                </p>

                <div className="mt-2 space-y-1 text-xs leading-5">
                  <p
                    className={
                      mediaAccess.access.hasAccess
                        ? 'text-green-800'
                        : 'text-amber-800'
                    }
                  >
                    {isArabic
                      ? 'مقابل هذا الاشتراك يمكنك إرسال الصور والملفات داخل المحادثات.'
                      : 'This subscription lets you send images and files inside conversations.'}
                  </p>

                  <p
                    className={
                      mediaAccess.access.hasAccess
                        ? 'text-green-800'
                        : 'text-amber-800'
                    }
                  >
                    {isArabic
                      ? `السعر: ${mediaAccess.access.price} · المدة: ${Math.max(1, Math.round(mediaAccess.access.durationSeconds / 86400))} يوم`
                      : `Price: ${mediaAccess.access.price} · Duration: ${Math.max(1, Math.round(mediaAccess.access.durationSeconds / 86400))} days`}
                  </p>

                  <p
                    className={
                      'font-medium ' +
                      (mediaAccess.access.hasAccess
                        ? 'text-green-800'
                        : 'text-amber-800')
                    }
                  >
                    {mediaAccess.access.dailyLimit === 0
                      ? isArabic
                        ? 'الحد اليومي: غير محدود'
                        : 'Daily limit: Unlimited'
                      : isArabic
                        ? `الحد اليومي: ${mediaAccess.access.dailyLimit} رسائل بالمرفقات`
                        : `Daily limit: ${mediaAccess.access.dailyLimit} messages with attachments`}
                  </p>

                  {mediaAccess.access.hasAccess &&
                    mediaAccess.access.expiresAt && (
                      <p className="text-green-800">
                        {isArabic
                          ? `ينتهي الاشتراك: ${new Date(mediaAccess.access.expiresAt).toLocaleString('ar')}`
                          : `Subscription ends: ${new Date(mediaAccess.access.expiresAt).toLocaleString('en')}`}
                      </p>
                    )}

                  {!mediaAccess.access.hasAccess &&
                    mediaAccess.access.expiresAt &&
                    new Date(mediaAccess.access.expiresAt).getTime() <= Date.now() && (
                      <p className="font-semibold text-red-700">
                        {isArabic
                          ? '⚠️ انتهى اشتراك الصور والملفات.'
                          : '⚠️ Your images and files subscription has expired.'}
                      </p>
                    )}
                </div>
              </div>

              {!mediaAccess.access.hasAccess && (
                <button
                  type="button"
                  onClick={() => void purchaseAccess()}
                  disabled={
                    isPurchasing ||
                    walletBalance === null ||
                    walletBalance < mediaAccess.access.price
                  }
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPurchasing
                    ? '...'
                    : isArabic
                      ? 'شراء'
                      : 'Purchase'}
                </button>
              )}
            </div>

            {mediaAccess.access.hasAccess &&
              dailyUsage?.success === true &&
              dailyUsage.usage.dailyLimit > 0 && (
                <div className="mt-3 rounded-lg border border-green-200 bg-white/70 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-green-900">
                      {isArabic ? 'الاستخدام اليومي' : 'Daily usage'}
                    </span>

                    <span className="text-green-800">
                      {dailyUsage.usage.usageCount} / {dailyUsage.usage.dailyLimit}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (dailyUsage.usage.usageCount /
                            dailyUsage.usage.dailyLimit) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-green-800">
                    {dailyUsage.usage.remaining === 0
                      ? isArabic
                        ? 'وصلت إلى الحد اليومي.'
                        : 'You have reached today’s limit.'
                      : isArabic
                        ? `المتبقي: ${dailyUsage.usage.remaining} رسالة بالمرفقات`
                        : `Remaining: ${dailyUsage.usage.remaining} messages with attachments`}
                  </p>
                </div>
              )}

            {!mediaAccess.access.hasAccess &&
              walletBalance !== null &&
              walletBalance < mediaAccess.access.price && (
                <p className="mt-2 text-xs text-red-600">
                  {isArabic
                    ? `رصيد المحفظة غير كافٍ. رصيدك: ${walletBalance}`
                    : `Insufficient wallet balance. Balance: ${walletBalance}`}
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
            busy ||
            attachments.length >= MAX_ATTACHMENTS ||
            (!isAdmin &&
              mediaAccess?.success === true &&
              mediaAccess.access.hasAccess &&
              dailyUsage?.success === true &&
              dailyUsage.usage.remaining === 0)
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
          disabled={busy}
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
          disabled={(!body.trim() && attachments.length === 0) || busy}
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

      {error === 'MESSAGE_MEDIA_ACCESS_REQUIRED' ? (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"
        >
          <p className="font-medium">
            {isArabic
              ? 'فعّل ميزة الصور والملفات لإرسال المرفقات.'
              : 'Enable image and file access to send attachments.'}
          </p>

          {mediaAccess?.success === true && (
            <p className="mt-1">
              {isArabic
                ? `السعر ${mediaAccess.access.price} · رصيدك ${walletBalance ?? 0}`
                : `Price ${mediaAccess.access.price} · Your balance ${walletBalance ?? 0}`}
            </p>
          )}

          {mediaAccess?.success === true &&
            mediaAccess.access.enabled &&
            mediaAccess.access.price > 0 && (
              <button
                type="button"
                onClick={() => void purchaseAccess()}
                disabled={
                  isPurchasing ||
                  walletBalance === null ||
                  walletBalance < mediaAccess.access.price
                }
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPurchasing
                  ? '...'
                  : isArabic
                    ? 'شراء الميزة'
                    : 'Purchase feature'}
              </button>
            )}
        </div>
      ) : error === 'MESSAGE_MEDIA_DAILY_LIMIT_REACHED' ? (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-900"
        >
          <p className="font-semibold">
            {isArabic
              ? '⏳ وصلت إلى الحد اليومي لإرسال المرفقات.'
              : '⏳ You have reached today’s attachment limit.'}
          </p>

          {dailyUsage?.success === true && (
            <p className="mt-1">
              {isArabic
                ? `استخدمت ${dailyUsage.usage.usageCount} من ${dailyUsage.usage.dailyLimit} رسائل بالمرفقات.`
                : `You used ${dailyUsage.usage.usageCount} of ${dailyUsage.usage.dailyLimit} attachment messages.`}
            </p>
          )}

          {resetCountdown && (
            <p className="mt-1 font-medium">
              {isArabic
                ? `يفتح الحد اليومي خلال: ${resetCountdown}`
                : `Daily limit resets in: ${resetCountdown}`}
            </p>
          )}

          {dailyUsage?.success === true && (
            <p className="mt-1 text-orange-800">
              {isArabic
                ? `إعادة الضبط: ${new Date(dailyUsage.usage.resetAt).toLocaleTimeString('ar', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : `Reset time: ${new Date(dailyUsage.usage.resetAt).toLocaleTimeString('en', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
            </p>
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
