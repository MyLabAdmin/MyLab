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

function ImageGrid({ images, onOpen }: { images: string[]; onOpen: (index: number) => void }) {
  if (images.length === 1) {
    return <img src={images[0]} alt="" onClick={() => onOpen(0)} className="w-full rounded-lg cursor-pointer" />
  }
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 h-56">
        {images.map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => onOpen(i)} className="w-full h-full object-cover rounded-lg cursor-pointer" />
        ))}
      </div>
    )
  }
  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 h-64">
        <img src={images[0]} alt="" onClick={() => onOpen(0)} className="row-span-2 w-full h-full object-cover rounded-lg cursor-pointer" />
        <img src={images[1]} alt="" onClick={() => onOpen(1)} className="w-full h-full object-cover rounded-lg cursor-pointer" />
        <img src={images[2]} alt="" onClick={() => onOpen(2)} className="w-full h-full object-cover rounded-lg cursor-pointer" />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-64">
      {images.slice(0, 4).map((src, i) => (
        <img key={i} src={src} alt="" onClick={() => onOpen(i)} className="w-full h-full object-cover rounded-lg cursor-pointer" />
      ))}
    </div>
  )
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin,
  onDeleted,
}: {
  post: Post
  currentUserId?: string
  isAdmin: boolean
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
