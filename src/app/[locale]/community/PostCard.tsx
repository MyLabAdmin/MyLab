'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import ReactionDetailsWrapper from './ReactionDetailsWrapper'
import PostActionsBar from './PostActionsBar'
import PostTimestamp from './PostTimestamp'
import CommentSection from './CommentSection'
import ExpandableText from './ExpandableText'
import ImageLightbox from './ImageLightbox'
import Avatar from '@/components/community/Avatar'
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
  replyCount: number
  replies: Reply[]
}
type SharedPost = {
  id: string
  content: string
  authorName: string
  media: { type: string; url: string }[]
  reactionCounts: Record<string, number>
  commentCount: number
}
export type Post = {
  id: string
  authorId: string
  content: string
  createdAt: string
  authorName: string
  media: { type: string; url: string }[]
  reactionCounts: Record<string, number>
  myReaction: ReactionKey | null
  bookmarked: boolean
  muted: boolean
  commentCount: number
  topLevelCommentCount: number
  comments: Comment[]
  sharedPost?: SharedPost | null
}

function ImageGrid({
  images,
  onOpen,
}: {
  images: string[]
  onOpen: (index: number) => void
}) {
  if (images.length === 0) return null

  const visible = images.slice(0, 4)
  const extraCount = Math.max(0, images.length - 4)

  function renderItem(
    src: string,
    index: number,
    className = '',
  ) {
    return (
      <button
        key={index}
        type="button"
        onClick={() => onOpen(index)}
        className={[
          'group relative min-h-0 overflow-hidden rounded-xl bg-black/5 text-left',
          'cursor-pointer',
          className,
        ].join(' ')}
        aria-label={`Open image ${index + 1}`}
      >
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
        />

        {index === 3 && extraCount > 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-semibold text-white">
            +{extraCount}
          </span>
        )}
      </button>
    )
  }

  if (images.length === 1) {
    return (
      <div className="mb-2 max-w-full overflow-hidden rounded-xl">
        {renderItem(images[0], 0, 'max-h-80')}
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="mb-2 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
        {visible.map((src, index) =>
          renderItem(src, index, 'aspect-square'),
        )}
      </div>
    )
  }

  if (images.length === 3) {
    return (
      <div className="mb-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
        {renderItem(visible[0], 0, 'row-span-2 aspect-[1/2]')}
        {renderItem(visible[1], 1, 'aspect-square')}
        {renderItem(visible[2], 2, 'aspect-square')}
      </div>
    )
  }

  return (
    <div className="mb-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
      {visible.map((src, index) =>
        renderItem(src, index, 'aspect-square'),
      )}
    </div>
  )
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin,
  canManagePosts,
  canDeletePosts,
  onDeleted,
}: {
  post: Post
  currentUserId?: string
  isAdmin: boolean
  canManagePosts?: boolean
  canDeletePosts?: boolean
  onDeleted: () => void
}) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const imageUrls = post.media.filter((m) => m.type === 'image').map((m) => m.url)
  const sharedImageUrls = post.sharedPost?.media.filter((m) => m.type === 'image').map((m) => m.url) ?? []

  function openLightbox(images: string[], index: number) {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }

  return (
    <div id={post.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Avatar name={post.authorName} />
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 text-sm">{post.authorName}</span>
          <PostTimestamp createdAt={post.createdAt} />
        </div>
      </div>

      {post.content && (
        <p className="text-gray-700 whitespace-pre-wrap">
          <ExpandableText text={post.content} maxLength={150} />
        </p>
      )}

      {imageUrls.length > 0 && <ImageGrid images={imageUrls} onOpen={(i) => openLightbox(imageUrls, i)} />}

      {post.sharedPost && (
        <Link
          href={`/community/post/${post.sharedPost.id}`}
          className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-gray-50 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Avatar name={post.sharedPost.authorName} size="sm" />
            <span className="text-xs font-medium text-gray-500">{post.sharedPost.authorName}</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            <ExpandableText text={post.sharedPost.content} maxLength={150} />
          </p>
          {sharedImageUrls.length > 0 && (
            <div onClick={(e) => { e.preventDefault(); openLightbox(sharedImageUrls, 0) }}>
              <ImageGrid images={sharedImageUrls} onOpen={(i) => openLightbox(sharedImageUrls, i)} />
            </div>
          )}
          <span className="text-xs text-gray-400">
            {Object.values(post.sharedPost.reactionCounts ?? {}).reduce((a, b) => a + b, 0)} reactions · {post.sharedPost.commentCount ?? 0} comments
          </span>
        </Link>
      )}

      <ReactionDetailsWrapper
        targetType="post"
        targetId={post.id}
        counts={post.reactionCounts}
        myReaction={post.myReaction}
      />

      <PostActionsBar
        postId={post.id}
        authorId={post.authorId}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        canManagePosts={canManagePosts ?? false}
        canDeletePosts={canDeletePosts ?? false}
        initialBookmarked={post.bookmarked}
        initialMuted={post.muted}
        commentCount={commentCount}
        onToggleComments={() => setShowComments(!showComments)}
        onEditRequest={() => router.push(`/community/edit/${post.id}`)}
        onDeleted={onDeleted}
      />

      {showComments && (
        <CommentSection
          postId={post.id}
          initialComments={post.comments}
          initialCommentCount={commentCount}
          initialTopLevelCount={post.topLevelCommentCount}
          onCommentCountChange={setCommentCount}
          onClose={() => setShowComments(false)}
        />
      )}

      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          postId={post.id}
          reactionCounts={post.reactionCounts}
          myReaction={post.myReaction}
          commentCount={commentCount}
          onOpenComments={() => setShowComments(true)}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  )
}
