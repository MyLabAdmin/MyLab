'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { addComment, addReply, loadMoreComments, loadMoreReplies } from '@/app/[locale]/actions/community'
import { useToast } from '@/components/ui/Toast'
import ReactionPicker from './ReactionPicker'
import ReactionDetails from './ReactionDetails'
import PostTimestamp from './PostTimestamp'
import ExpandableText from './ExpandableText'
import type { ReactionKey } from '@/components/community/ReactionIcons'
import Avatar from '@/components/community/Avatar'

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
  replyCount: number
  replies: Reply[]
}

function RepliesAutoLoader({ comment, onLoaded }: { comment: Comment; onLoaded: (replies: Reply[]) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !loadingRef.current) {
        loadingRef.current = true
        const skipIds = comment.replies.map((r) => r.id)
        const { replies } = await loadMoreReplies(comment.id, skipIds)
        onLoaded(replies)
        loadingRef.current = false
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [comment.id, comment.replies, onLoaded])

  return <div ref={ref} className="h-2" />
}

export default function CommentSection({
  postId,
  initialComments,
  initialCommentCount,
  initialTopLevelCount,
  onCommentCountChange,
  onClose,
}: {
  postId: string
  initialComments: Comment[]
  initialCommentCount: number
  initialTopLevelCount: number
  onCommentCountChange: (count: number) => void
  onClose: () => void
}) {
  const locale = useLocale()
  const { showToast } = useToast()
  const [comments, setComments] = useState(initialComments)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [topLevelCount, setTopLevelCount] = useState(initialTopLevelCount)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [details, setDetails] = useState<{ type: 'comment' | 'reply'; id: string } | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingCommentsRef = useRef(false)

  const hasMoreComments = comments.length < topLevelCount

  const loadMoreCommentsHandler = useCallback(async () => {
    if (loadingCommentsRef.current || !hasMoreComments) return
    loadingCommentsRef.current = true
    const skipIds = comments.map((c) => c.id)
    const { comments: more } = await loadMoreComments(postId, skipIds)
    setComments((prev) => [...prev, ...more])
    loadingCommentsRef.current = false
  }, [postId, comments, hasMoreComments])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreCommentsHandler()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMoreCommentsHandler])

  async function handleSubmitComment() {
    if (!text.trim()) return
    setSubmitting(true)
    const result = await addComment(postId, text)
    if (result.success) {
      setComments((prev) => [...prev, result.comment])
      const next = commentCount + 1
      setCommentCount(next)
      setTopLevelCount((n) => n + 1)
      onCommentCountChange(next)
      setText('')
      showToast(locale === 'ar' ? 'تم إضافة التعليق' : 'Comment added')
    }
    setSubmitting(false)
  }

  async function handleSubmitReply(commentId: string, replyToUserId?: string) {
    if (!replyText.trim()) return
    const result = await addReply(commentId, replyText, replyToUserId)
    if (result.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, result.reply], replyCount: c.replyCount + 1 } : c))
      )
      setReplyText('')
      setReplyingTo(null)
      const next = commentCount + 1
      setCommentCount(next)
      onCommentCountChange(next)
      showToast(locale === 'ar' ? 'تم إضافة الرد' : 'Reply added')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md h-[85vh] sm:h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">
            {locale === 'ar' ? `التعليقات (${commentCount})` : `Comments (${commentCount})`}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl w-7 h-7 flex items-center justify-center">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2 text-sm">
                <Avatar name={c.authorName} size="sm" />
                <div>
                  <span className="font-medium text-gray-800">{c.authorName}</span>{' '}
                  <ExpandableText text={c.content} maxLength={100} />
                </div>
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
                <button type="button" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-xs text-primary-600">
                  {locale === 'ar' ? 'رد' : 'Reply'}
                </button>
              </div>

              {c.replies.map((r) => (
                <div key={r.id} className="ms-6 flex flex-col gap-1">
                  <div className="flex items-start gap-2 text-sm">
                    <Avatar name={r.authorName} size="sm" />
                    <div>
                      <span className="font-medium text-gray-800">{r.authorName}</span>
                      {r.replyToName && <span className="text-primary-500"> @{r.replyToName}</span>}{' '}
                      <ExpandableText text={r.content} maxLength={100} />
                    </div>
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
                    <button type="button" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-xs text-primary-600">
                      {locale === 'ar' ? 'رد' : 'Reply'}
                    </button>
                  </div>
                </div>
              ))}

              {c.replies.length < c.replyCount && (
                <RepliesAutoLoader
                  comment={c}
                  onLoaded={(more) =>
                    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, replies: [...x.replies, ...more] } : x)))
                  }
                />
              )}

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
                  <button type="button" onClick={() => handleSubmitReply(c.id)} className="text-sm text-primary-600 font-medium px-2">
                    {locale === 'ar' ? 'إرسال' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {hasMoreComments && <div ref={sentinelRef} className="h-2" />}
        </div>

        {!replyingTo && (
          <div className="flex gap-2 p-3 border-t border-gray-100">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={locale === 'ar' ? 'اكتب تعليق...' : 'Write a comment...'}
              className="input flex-1 text-sm"
              dir="auto"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button type="button" disabled={submitting} onClick={handleSubmitComment} className="text-sm text-primary-600 font-medium px-2 disabled:opacity-60">
              {locale === 'ar' ? 'إرسال' : 'Send'}
            </button>
          </div>
        )}
      </div>

      {details && <ReactionDetails targetType={details.type} targetId={details.id} onClose={() => setDetails(null)} />}
    </div>
  )
}
