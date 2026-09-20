'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { REACTIONS } from '@/components/community/ReactionIcons'
import { getReactionDetails } from '@/app/[locale]/actions/community'
import Avatar from '@/components/community/Avatar'

type TargetType = 'post' | 'comment' | 'reply'

export default function ReactionDetails({
  targetType,
  targetId,
  onClose,
}: {
  targetType: TargetType
  targetId: string
  onClose: () => void
}) {
  const locale = useLocale()
  const [data, setData] = useState<{ counts: Record<string, number>; byReaction: Record<string, string[]> } | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    getReactionDetails(targetType, targetId).then(setData)
  }, [targetType, targetId])

  if (!data) return null

  const names = filter ? data.byReaction[filter] ?? [] : Object.values(data.byReaction).flat()

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${!filter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {locale === 'ar' ? 'الكل' : 'All'} ({Object.values(data.counts).reduce((a, b) => a + b, 0)})
          </button>
          {REACTIONS.map(({ key, Icon, labelEn, labelAr }) =>
            data.counts[key] ? (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full whitespace-nowrap ${filter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <Icon className="w-4 h-4" />
                {locale === 'ar' ? labelAr : labelEn} ({data.counts[key]})
              </button>
            ) : null
          )}
        </div>

        <div className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar name={name} size="sm" />
              <p className="text-sm text-gray-700">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
