'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteMessage,
  editMessage,
  getMessageAttachmentUrl,
} from '@/app/[locale]/actions/messaging'
import Avatar from '@/components/community/Avatar'
import MessageMediaGrid from './MessageMediaGrid'
import MessageMediaLightbox from './MessageMediaLightbox'

type MessageAttachment = {
  id: string
  media_ref: string
  file_name: string
  mime_type: string
  file_size: number
  attachment_type: 'image' | 'file'
  order_index: number
  created_at: string
}

type Message = {
  id: string
  sender_id: string
  body: string | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  sender: {
    display_name: string | null
    avatar_url: string | null
  }
  attachments?: MessageAttachment[]
}

function formatFileSize(size: number, isArabic: boolean) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function MessageList({
  messages,
  currentUserId,
  isGroup,
  locale,
}: {
  messages: Message[]
  currentUserId: string
  isGroup: boolean
  locale: string
}) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [actionError, setActionError] = useState('')
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({})
  const [lightboxImages, setLightboxImages] = useState<
    { id: string; url: string; fileName: string }[]
  >([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const isArabic = locale === 'ar'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    let cancelled = false

    async function loadMediaUrls() {
      const imageAttachments = messages
        .flatMap((message) => message.attachments ?? [])
        .filter(
          (attachment) =>
            attachment.attachment_type === 'image' &&
            !mediaUrls[attachment.id],
        )

      if (imageAttachments.length === 0) {
        return
      }

      setLoadingMedia((current) => {
        const next = { ...current }

        for (const attachment of imageAttachments) {
          next[attachment.id] = true
        }

        return next
      })

      const results = await Promise.all(
        imageAttachments.map(async (attachment) => {
          const result = await getMessageAttachmentUrl(
            attachment.media_ref,
          )

          return {
            id: attachment.id,
            url: result.success ? result.url : null,
          }
        }),
      )

      if (cancelled) {
        return
      }

      setMediaUrls((current) => {
        const next = { ...current }

        for (const result of results) {
          if (result.url) {
            next[result.id] = result.url
          }
        }

        return next
      })

      setLoadingMedia((current) => {
        const next = { ...current }

        for (const attachment of imageAttachments) {
          delete next[attachment.id]
        }

        return next
      })
    }

    void loadMediaUrls()

    return () => {
      cancelled = true
    }
  }, [messages, mediaUrls])

  function openMessageImage(message: Message, attachmentId: string) {
    const images = (message.attachments ?? [])
      .filter((attachment) => attachment.attachment_type === 'image')
      .map((attachment) => ({
        id: attachment.id,
        url: mediaUrls[attachment.id],
        fileName: attachment.file_name,
      }))
      .filter(
        (image): image is { id: string; url: string; fileName: string } =>
          Boolean(image.url),
      )

    const index = images.findIndex((image) => image.id === attachmentId)

    if (index === -1) return

    setLightboxImages(images)
    setLightboxIndex(index)
  }

  function closeMessageLightbox() {
    setLightboxImages([])
    setLightboxIndex(0)
  }

  function startEditing(message: Message) {
    if (message.deleted_at || (message.attachments?.length ?? 0) > 0) {
      return
    }

    setActionError('')
    setEditingId(message.id)
    setEditingBody(message.body ?? '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingBody('')
    setActionError('')
  }

  function saveEdit(messageId: string) {
    const value = editingBody.trim()

    if (!value || isPending) {
      return
    }

    setActionError('')

    startTransition(async () => {
      const result = await editMessage(messageId, value)

      if (result.success) {
        cancelEditing()
        router.refresh()
        return
      }

      setActionError(
        isArabic
          ? 'تعذر تعديل الرسالة. حاول مرة أخرى.'
          : 'Failed to edit the message. Please try again.',
      )
    })
  }

  function handleDelete(messageId: string) {
    if (isPending) {
      return
    }

    const confirmed = window.confirm(
      isArabic
        ? 'هل تريد حذف هذه الرسالة؟'
        : 'Do you want to delete this message?',
    )

    if (!confirmed) {
      return
    }

    setActionError('')

    startTransition(async () => {
      const result = await deleteMessage(messageId)

      if (result.success) {
        if (editingId === messageId) {
          cancelEditing()
        }

        router.refresh()
        return
      }

      setActionError(
        isArabic
          ? 'تعذر حذف الرسالة. حاول مرة أخرى.'
          : 'Failed to delete the message. Please try again.',
      )
    })
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-center">
        <div>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-xl">
            💬
          </div>
          <p className="text-sm text-gray-500 sm:text-base">
            {isArabic ? 'لا توجد رسائل حتى الآن' : 'No messages yet'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {actionError && (
        <p
          role="alert"
          className={
            'rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ' +
            (isArabic ? 'text-right' : 'text-left')
          }
        >
          {actionError}
        </p>
      )}

      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId
        const senderName =
          message.sender.display_name ||
          (isArabic ? 'مستخدم' : 'User')
        const isDeleted = Boolean(message.deleted_at)
        const isEditing = editingId === message.id
        const attachments = message.attachments ?? []
        const hasAttachments = attachments.length > 0

        return (
          <div
            key={message.id}
            className={
              'flex w-full ' +
              (isMine ? 'justify-end' : 'justify-start')
            }
          >
            <article
              className={[
                'max-w-[92%] rounded-2xl px-3 py-2.5 shadow-sm sm:max-w-[75%] sm:px-4 sm:py-3',
                isMine
                  ? 'rounded-br-md bg-primary-600 text-white'
                  : 'rounded-bl-md border border-gray-200 bg-white text-gray-800',
              ].join(' ')}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {isGroup && !isMine && (
                <div className="mb-1.5 flex items-center gap-2">
                  <Avatar
                    name={senderName}
                    avatarUrl={message.sender.avatar_url}
                    size="sm"
                  />
                  <span className="min-w-0 truncate text-xs font-semibold text-gray-600">
                    {senderName}
                  </span>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editingBody}
                    onChange={(event) =>
                      setEditingBody(event.target.value)
                    }
                    disabled={isPending}
                    autoFocus
                    rows={3}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    className="w-full resize-none rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/60 focus:border-white/60 sm:text-base"
                  />

                  <div
                    className={
                      'flex flex-wrap gap-2 ' +
                      (isArabic
                        ? 'justify-start'
                        : 'justify-end')
                    }
                  >
                    <button
                      type="button"
                      onClick={() => saveEdit(message.id)}
                      disabled={!editingBody.trim() || isPending}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPending
                        ? '...'
                        : isArabic
                          ? 'حفظ'
                          : 'Save'}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isPending}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {hasAttachments && !isDeleted && (
                    <>
                      <MessageMediaGrid
                        items={attachments
                          .filter(
                            (attachment) =>
                              attachment.attachment_type === 'image',
                          )
                          .map((attachment) => ({
                            id: attachment.id,
                            url: mediaUrls[attachment.id] ?? null,
                            fileName: attachment.file_name,
                            loading: loadingMedia[attachment.id],
                          }))}
                        isArabic={isArabic}
                        onOpen={(attachmentId) =>
                          openMessageImage(message, attachmentId)
                        }
                      />

                      <div className="mb-2 flex flex-col gap-2">
                        {attachments
                          .filter(
                            (attachment) =>
                              attachment.attachment_type !== 'image',
                          )
                          .map((attachment) => (
                            <a
                              key={attachment.id}
                              href={undefined}
                              onClick={async (event) => {
                                event.preventDefault()

                                const result =
                                  await getMessageAttachmentUrl(
                                    attachment.media_ref,
                                  )

                                if (result.success) {
                                  window.open(
                                    result.url,
                                    '_blank',
                                    'noopener,noreferrer',
                                  )
                                }
                              }}
                              className={[
                                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                                isMine
                                  ? 'border-white/20 bg-white/10 hover:bg-white/15'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                              ].join(' ')}
                            >
                              <span className="text-xl">📎</span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium sm:text-sm">
                                  {attachment.file_name}
                                </span>

                                <span
                                  className={
                                    'mt-0.5 block text-[10px] ' +
                                    (isMine
                                      ? 'text-primary-100'
                                      : 'text-gray-400')
                                  }
                                >
                                  {formatFileSize(
                                    attachment.file_size,
                                    isArabic,
                                  )}
                                </span>
                              </span>
                            </a>
                          ))}
                      </div>
                    </>
                  )}

                  {message.body && (
                    <p
                      className={[
                        'whitespace-pre-wrap break-words text-sm leading-6 sm:text-base',
                        isDeleted
                          ? isMine
                            ? 'italic text-primary-100'
                            : 'italic text-gray-400'
                          : '',
                      ].join(' ')}
                    >
                      {isDeleted
                        ? isArabic
                          ? 'تم حذف هذه الرسالة'
                          : 'This message was deleted'
                        : message.body}
                    </p>
                  )}

                  {isDeleted && !message.body && (
                    <p
                      className={
                        'italic text-sm leading-6 ' +
                        (isMine
                          ? 'text-primary-100'
                          : 'text-gray-400')
                      }
                    >
                      {isArabic
                        ? 'تم حذف هذه الرسالة'
                        : 'This message was deleted'}
                    </p>
                  )}

                  <div
                    className={[
                      'mt-1 flex items-center gap-1 text-[10px] sm:text-xs',
                      isMine
                        ? 'justify-end text-primary-100'
                        : 'justify-start text-gray-400',
                    ].join(' ')}
                  >
                    <time>
                      {new Intl.DateTimeFormat(
                        isArabic ? 'ar' : 'en',
                        {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        },
                      ).format(new Date(message.created_at))}
                    </time>

                    {message.edited_at && !isDeleted && (
                      <span>
                        {isArabic ? '· معدلة' : '· edited'}
                      </span>
                    )}
                  </div>

                  {isMine && !isDeleted && (
                    <div
                      className={
                        'mt-2 flex gap-2 ' +
                        (isArabic
                          ? 'justify-start'
                          : 'justify-end')
                      }
                    >
                      {message.body &&
                        !hasAttachments && (
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(message)
                            }
                            disabled={isPending}
                            className="text-[10px] font-medium text-primary-100 transition hover:text-white disabled:opacity-50 sm:text-xs"
                          >
                            {isArabic ? 'تعديل' : 'Edit'}
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(message.id)
                        }
                        disabled={isPending}
                        className="text-[10px] font-medium text-primary-100 transition hover:text-white disabled:opacity-50 sm:text-xs"
                      >
                        {isArabic ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
        )
      })}

      <div ref={bottomRef} aria-hidden="true" />

      {lightboxImages.length > 0 && (
        <MessageMediaLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isArabic={isArabic}
          onClose={closeMessageLightbox}
        />
      )}
    </div>
  )
}
