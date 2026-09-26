'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ConversationPresenceProps = {
  conversationId: string
  currentUserId: string
  memberIds: string[]
  otherMemberId?: string
  isGroup: boolean
  locale: string
}

type PresenceRow = {
  user_id: string
  last_seen_at: string
}

function formatLastSeen(value: string, locale: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (locale === 'ar') {
    if (minutes < 1) return 'آخر ظهور الآن'
    if (minutes === 1) return 'آخر ظهور منذ دقيقة'
    if (minutes < 60) return `آخر ظهور منذ ${minutes} دقيقة`
    if (hours === 1) return 'آخر ظهور منذ ساعة'
    if (hours < 24) return `آخر ظهور منذ ${hours} ساعات`
    if (days === 1) return 'آخر ظهور أمس'
    if (days < 7) return `آخر ظهور منذ ${days} أيام`

    return `آخر ظهور ${new Intl.DateTimeFormat('ar', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))}`
  }

  if (minutes < 1) return 'Last seen just now'
  if (minutes === 1) return 'Last seen 1 minute ago'
  if (minutes < 60) return `Last seen ${minutes} minutes ago`
  if (hours === 1) return 'Last seen 1 hour ago'
  if (hours < 24) return `Last seen ${hours} hours ago`
  if (days === 1) return 'Last seen yesterday'
  if (days < 7) return `Last seen ${days} days ago`

  return `Last seen ${new Intl.DateTimeFormat('en', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))}`
}

export default function ConversationPresence({
  conversationId,
  currentUserId,
  memberIds,
  otherMemberId,
  isGroup,
  locale,
}: ConversationPresenceProps) {
  const supabase = useMemo(() => createClient(), [])
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})

  const isArabic = locale === 'ar'

  useEffect(() => {
    let mounted = true

    const targetMemberIds = memberIds.filter((id) => id !== currentUserId)

    async function updateLastSeen() {
      const now = new Date().toISOString()

      await supabase
        .from('user_presence')
        .upsert(
          {
            user_id: currentUserId,
            last_seen_at: now,
          },
          {
            onConflict: 'user_id',
          },
        )
    }

    async function loadPresence() {
      if (targetMemberIds.length === 0) return

      const { data } = await supabase
        .from('user_presence')
        .select('user_id, last_seen_at')
        .in('user_id', targetMemberIds)

      if (!mounted || !data) return

      const nextLastSeen: Record<string, string> = {}

      for (const row of data as PresenceRow[]) {
        nextLastSeen[row.user_id] = row.last_seen_at
      }

      setLastSeen(nextLastSeen)
    }

    function updateOnlineState(channel: ReturnType<typeof supabase.channel>) {
      if (!mounted) return

      const state = channel.presenceState()
      setOnlineIds(new Set(Object.keys(state)))
    }

    const channel = supabase.channel(
      `conversation:${conversationId}:presence`,
      {
        config: {
          private: true,
          presence: {
            key: currentUserId,
          },
        },
      },
    )

    channel
      .on('presence', { event: 'sync' }, () => {
        updateOnlineState(channel)
      })
      .on('presence', { event: 'join' }, () => {
        updateOnlineState(channel)
      })
      .on('presence', { event: 'leave' }, () => {
        updateOnlineState(channel)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updateLastSeen()

          await channel.track({
            user_id: currentUserId,
            last_seen_at: new Date().toISOString(),
          })

          await loadPresence()
        }
      })

    const heartbeat = window.setInterval(async () => {
      await updateLastSeen()
      await loadPresence()

      if (mounted) {
        await channel.track({
          user_id: currentUserId,
          last_seen_at: new Date().toISOString(),
        })
      }
    }, 60_000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void updateLastSeen()
        void loadPresence()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      window.clearInterval(heartbeat)
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [
    conversationId,
    currentUserId,
    memberIds,
    supabase,
  ])

  if (isGroup) {
    const onlineCount = memberIds.filter(
      (id) => id !== currentUserId && onlineIds.has(id),
    ).length

    return (
      <span className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
          aria-hidden="true"
        />

        <span>
          {isArabic
            ? onlineCount > 0
              ? `${onlineCount} متصلين الآن من ${memberIds.length} أعضاء`
              : `${memberIds.length} أعضاء`
            : onlineCount > 0
              ? `${onlineCount} online of ${memberIds.length} members`
              : `${memberIds.length} members`}
        </span>
      </span>
    )
  }

  const isOnline = otherMemberId
    ? onlineIds.has(otherMemberId)
    : false

  if (isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-emerald-600">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        {isArabic ? 'متصل الآن' : 'Online now'}
      </span>
    )
  }

  if (otherMemberId && lastSeen[otherMemberId]) {
    return <span>{formatLastSeen(lastSeen[otherMemberId], locale)}</span>
  }

  return <span>{isArabic ? 'غير متصل' : 'Offline'}</span>
}
