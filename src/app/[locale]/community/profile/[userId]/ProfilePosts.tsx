'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { getFeed } from '@/app/[locale]/actions/community'
import PostCard, { type Post } from '../../PostCard'

export default function ProfilePosts({
  userId,
  initialPosts,
  initialCursor,
  currentUserId,
  isAdmin,
  canManagePosts,
  canDeletePosts,
}: {
  userId: string
  initialPosts: Post[]
  initialCursor: string | null
  currentUserId?: string
  isAdmin: boolean
  canManagePosts?: boolean
  canDeletePosts?: boolean
}) {
  const locale = useLocale()
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return

    setLoading(true)

    try {
      const result = await getFeed(cursor, null, userId)

      setPosts((prev) => [...prev, ...(result.posts as Post[])])
      setCursor(result.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [cursor, loading, userId])

  useEffect(() => {
    const element = sentinelRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: '300px' },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col gap-4">
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {locale === 'ar' ? 'لا توجد منشورات بعد.' : 'No posts yet.'}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canManagePosts={canManagePosts ?? false}
            canDeletePosts={canDeletePosts ?? false}
            onDeleted={() =>
              setPosts((prev) => prev.filter((item) => item.id !== post.id))
            }
          />
        ))
      )}

      {cursor ? (
        <div ref={sentinelRef} className="py-4 text-center">
          {loading ? (
            <p className="text-sm text-gray-400">...</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
