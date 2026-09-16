'use client'

import { useState, useTransition } from 'react'
import { useLocale } from 'next-intl'
import { REACTIONS, ReactionCircleIcon, type ReactionKey } from '@/components/community/ReactionIcons'
import { toggleReaction } from '@/app/[locale]/actions/community'

type TargetType = 'post' | 'comment' | 'reply'

export default function ReactionPicker({
  targetType,
  targetId,
  counts,
  myReaction,
  onOpenDetails,
}: {
  targetType: TargetType
  targetId: string
  counts: Record<string, number>
  myReaction: ReactionKey | null
  onOpenDetails?: () => void
}) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(myReaction)
  const [localCounts, setLocalCounts] = useState(counts)
  const [, startTransition] = useTransition()

  function pick(key: ReactionKey) {
    setOpen(false)
    const prev = current
    const nextCounts = { ...localCounts }

    if (prev) nextCounts[prev] = Math.max(0, (nextCounts[prev] ?? 1) - 1)
    if (prev === key) {
      setCurrent(null)
    } else {
      nextCounts[key] = (nextCounts[key] ?? 0) + 1
      setCurrent(key)
    }
    setLocalCounts(nextCounts)

    startTransition(() => {
      toggleReaction(targetType, targetId, key)
    })
  }

  const total = Object.values(localCounts).reduce((a, b) => a + b, 0)
  const currentReaction = REACTIONS.find((r) => r.key === current)
  const CurrentIcon = currentReaction?.Icon ?? ReactionCircleIcon
  const currentLabel = currentReaction ? (locale === 'ar' ? currentReaction.labelAr : currentReaction.labelEn) : null

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-full ${current ? 'text-primary-600' : 'text-gray-400'}`}
      >
        <CurrentIcon className="w-5 h-5" />
        {currentLabel && <span>{currentLabel}</span>}
      </button>

      {total > 0 && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="text-xs text-gray-500 hover:underline"
        >
          {total}
        </button>
      )}

      {open && (
        <div className="absolute bottom-full mb-1 flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-md z-10">
          {REACTIONS.map(({ key, Icon, labelEn, labelAr }) => (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-primary-50 ${current === key ? 'text-primary-600' : 'text-gray-500'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] whitespace-nowrap">{locale === 'ar' ? labelAr : labelEn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
