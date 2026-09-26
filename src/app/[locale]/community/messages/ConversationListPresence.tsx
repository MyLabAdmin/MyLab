'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PresenceRow = {
  user_id: string
  last_seen_at: string
}

type Props = {
  userId: string
  locale: string
}

const ONLINE_THRESHOLD_MS = 90 * 1000

function formatLastSeen(
  value: string,
  locale: string,
  now: number,
) {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(value).getTime()) / 1000),
  )

  if (seconds < 60) {
    return locale === 'ar' ? 'منذ لحظات' : 'Just now'
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return locale === 'ar'
      ? 'آخر ظهور منذ ' + minutes + ' د'
      : 'Last seen ' + minutes + 'm ago'
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return locale === 'ar'
      ? 'آخر ظهور منذ ' + hours + ' س'
      : 'Last seen ' + hours + 'h ago'
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return locale === 'ar'
      ? 'آخر ظهور منذ ' + days + ' ي'
      : 'Last seen ' + days + 'd ago'
  }

  return new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar' : 'en',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value))
}

export default function ConversationListPresence({
  userId,
  locale,
}: Props) {
  const [presence, setPresence] = useState<PresenceRow | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const loadPresence = useCallback(async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('user_presence')
      .select('user_id, last_seen_at')
      .eq('user_id', userId)
      .maybeSingle()

    setPresence(data)
    setNow(Date.now())
  }, [userId])

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()

      const { data } = await supabase
        .from('user_presence')
        .select('user_id, last_seen_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (!active) return

      setPresence(data)
      setNow(Date.now())
    }

    void load()

    const interval = window.setInterval(() => {
      void loadPresence()
    }, 30000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [loadPresence, userId])

  if (!presence) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-gray-300"
          aria-hidden="true"
        />
        <span>
          {locale === 'ar' ? 'غير متصل' : 'Offline'}
        </span>
      </span>
    )
  }

  const isOnline =
    now - new Date(presence.last_seen_at).getTime() <=
    ONLINE_THRESHOLD_MS

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span
        className={
          isOnline
            ? 'h-2 w-2 shrink-0 rounded-full bg-green-500'
            : 'h-2 w-2 shrink-0 rounded-full bg-gray-300'
        }
        aria-hidden="true"
      />
      <span className="truncate">
        {isOnline
          ? locale === 'ar'
            ? 'متصل الآن'
            : 'Online now'
          : formatLastSeen(
              presence.last_seen_at,
              locale,
              now,
            )}
      </span>
    </span>
  )
}
