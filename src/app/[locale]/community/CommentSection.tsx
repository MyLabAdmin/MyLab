'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { addComment, addReply } from '@/app/[locale]/actions/community'
import ReactionPicker from './ReactionPicker'
import ReactionDetails from './ReactionDetails'
import PostTimestamp from './PostTimestamp'
import type { ReactionKey } from '@/components/community/ReactionIcons'

type Reply = {
  id: string
  content: string
  authorName: string
  createdAt: string
  replyToName: string | null
  reactionCounts: Record<string, number>
  myReaction: ReactionKey | null
}
type Comment = {
  id: string
  content: string
  authorName: string
  createdAt: string
  reactionCounts: Record<string, number>
  myReaction: ReactionKey | null
  replies: Reply[]
}

export default function CommentSection({ postId, comments }: { postId: string; comments: Comment[] }) {
  const locale = useLocale()
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [details, setDetails] = useState<{ type: 'comment' | 'reply'; id: string } | null>(null)

  async function handleSubmitComment() {
    if (!text.trim()) return
    setSubmitting(true)
    await addComment(postId, text)
    setText('')
    setSubmitting(false)
    router.refresh()
  }

  async function handleSubmitReply(commentId: string, replyToUserId?: string) {
    if (!replyText.trim()) return
    await addReply(commentId, replyText, replyToUserId)
    setReplyText('')
    setReplyingTo(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
      {comments.map((c) => (
        <div key={c.id} className="flex flex-col gap-1.5">
          <div className="text-sm">
            <span className="font-medium text-gray-800">{c.authorName}</span>{' '}
            <span className="text-gray-600" dir="auto">{c.content}</span>
          </div>
          <div className="flex items-center gap-3">
            <PostTimestamp createdAt={c.createdAt} />
            <ReactionPicker
              targetType="comment"
              targetId={c.id}
              counts={c.reactionCounts}
              myReaction={c.myReaction}
              onOpenDetails={() => setDetails({ type: 'comment', id: c.id })}
            />
            <button
              type="button"
              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              className="text-xs text-primary-600"
            >
              {locale === 'ar' ? 'رد' : 'Reply'}
            </button>
          </div>

          {c.replies.map((r) => (
            <div key={r.id} className="ms-6 flex flex-col gap-1">
              <div className="text-sm">
                <span className="font-medium text-gray-800">{r.authorName}</span>
                {r.replyToName && <span className="text-primary-500"> @{r.replyToName}</span>}{' '}
                <span className="text-gray-600" dir="auto">{r.content}</span>
              </div>
              <div className="flex items-center gap-3">
                <PostTimestamp createdAt={r.createdAt} />
                <ReactionPicker
                  targetType="reply"
                  targetId={r.id}
                  counts={r.reactionCounts}
                  myReaction={r.myReaction}
                  onOpenDetails={() => setDetails({ type: 'reply', id: r.id })}
                />
                <button
                  type="button"
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="text-xs text-primary-600"
                >
                  {locale === 'ar' ? 'رد' : 'Reply'}
                </button>
              </div>
            </div>
          ))}

          {replyingTo === c.id && (
            <div className="ms-6 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={locale === 'ar' ? 'اكتب رد...' : 'Write a reply...'}
                className="input flex-1 text-sm"
                dir="auto"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(c.id)}
              />
              <button
                type="button"
                onClick={() => handleSubmitReply(c.id)}
                className="text-sm text-primary-600 font-medium px-2"
              >
                {locale === 'ar' ? 'إرسال' : 'Send'}
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={locale === 'ar' ? 'اكتب تعليق...' : 'Write a comment...'}
          className="input flex-1 text-sm"
          dir="auto"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
        />
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmitComment}
          className="text-sm text-primary-600 font-medium px-2 disabled:opacity-60"
        >
          {locale === 'ar' ? 'إرسال' : 'Send'}
        </button>
      </div>

      {details && (
        <ReactionDetails targetType={details.type} targetId={details.id} onClose={() => setDetails(null)} />
      )}
    </div>
  )
}
