'use client'

import { useState } from 'react'
import ReactionPicker from './ReactionPicker'
import ReactionDetails from './ReactionDetails'
import type { ReactionKey } from '@/components/community/ReactionIcons'

type TargetType = 'post' | 'comment' | 'reply'

export default function ReactionDetailsWrapper({
  targetType,
  targetId,
  counts,
  myReaction,
}: {
  targetType: TargetType
  targetId: string
  counts: Record<string, number>
  myReaction: ReactionKey | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReactionPicker
        targetType={targetType}
        targetId={targetId}
        counts={counts}
        myReaction={myReaction}
        onOpenDetails={() => setOpen(true)}
      />
      {open && <ReactionDetails targetType={targetType} targetId={targetId} onClose={() => setOpen(false)} />}
    </>
  )
}
