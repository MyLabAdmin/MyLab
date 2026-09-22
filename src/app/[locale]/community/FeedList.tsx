'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { getFeed } from '@/app/[locale]/actions/community'
import PostComposerTrigger from './PostComposerTrigger'
import PostCard, { type Post } from './PostCard'

export default function FeedList({
  initialPosts,
  initialCursor,
  canAddImage,
  currentUserId,
  isAdmin,
  groupId,
}: {
  initialPosts: Post[]
  initialCursor: string | null
  canAddImage: boolean
  currentUserId?: string
  isAdmin: boolean
  groupId?: string
}) {
  const locale = useLocale()
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    const { posts: more, nextCursor } = await getFeed(cursor, groupId ?? null)
    setPosts((prev) => [...prev, ...(more as Post[])])
    setCursor(nextCursor)
    setLoading(false)
  }, [cursor, loading, groupId])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      <PostComposerTrigger canAddImage={canAddImage} groupId={groupId} />

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
          />
        ))}

        {posts.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            {locale === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
        )}

        {cursor && (
          <div ref={sentinelRef} className="text-center py-4">
            {loading && <p className="text-sm text-gray-400">...</p>}
          </div>
        )}
      </div>
    </>
  )
}
