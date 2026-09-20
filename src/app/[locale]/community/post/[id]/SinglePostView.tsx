'use client'

import { useRouter } from '@/i18n/navigation'
import PostCard, { type Post } from '../../PostCard'

export default function SinglePostView({
  post,
  currentUserId,
  isAdmin,
}: {
  post: Post
  currentUserId: string
  isAdmin: boolean
}) {
  const router = useRouter()

  return (
    <PostCard
      post={post}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      onDeleted={() => router.push('/community')}
    />
  )
}
