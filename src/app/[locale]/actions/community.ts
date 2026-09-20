'use server'

import { createClient } from '@/lib/supabase/server'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import { parseMediaRef } from '@/lib/storage'
import type { ReactionKey } from '@/components/community/ReactionIcons'

type TargetType = 'post' | 'comment' | 'reply'

async function resolveMedia(ref: string) {
  const { provider, path } = parseMediaRef(ref)
  if (provider === 'imagekit') return getImagekitSignedUrl(path)
  return ref
}

export async function createPost(content: string, mediaRefs: { type: 'image' | 'video'; ref: string }[]) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false as const, error: 'Not authenticated' }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ author_id: userData.user.id, content })
    .select('id, created_at')
    .single()

  if (error || !post) return { success: false as const, error: error?.message }

  let media: { type: string; url: string }[] = []
  if (mediaRefs.length > 0) {
    await supabase.from('post_media').insert(
      mediaRefs.map((m, i) => ({ post_id: post.id, media_type: m.type, media_ref: m.ref, order_index: i }))
    )
    media = await Promise.all(mediaRefs.map(async (m) => ({ type: m.type, url: await resolveMedia(m.ref) })))
  }

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userData.user.id).single()

  return {
    success: true as const,
    post: {
      id: post.id,
      authorId: userData.user.id,
      content,
      createdAt: post.created_at,
      authorName: profile?.display_name ?? '—',
      media,
      reactionCounts: {} as Record<string, number>,
      myReaction: null,
      bookmarked: false,
      muted: false,
      commentCount: 0,
      comments: [] as any[],
    },
  }
}

export async function toggleReaction(targetType: TargetType, targetId: string, reaction: ReactionKey) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { data: existing } = await supabase
    .from('reactions')
    .select('id, reaction')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (existing && existing.reaction === reaction) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else if (existing) {
    await supabase.from('reactions').update({ reaction }).eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({ target_type: targetType, target_id: targetId, user_id: userData.user.id, reaction })
  }

  return { success: true }
}

export async function getReactionDetails(targetType: TargetType, targetId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reactions')
    .select('reaction, user_id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)

  if (!data || data.length === 0) return { counts: {}, byReaction: {} }

  const userIds = Array.from(new Set(data.map((r) => r.user_id)))
  const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', userIds)
  const nameOf = (id: string) => profilesData?.find((p) => p.id === id)?.display_name ?? '—'

  const counts: Record<string, number> = {}
  const byReaction: Record<string, string[]> = {}
  for (const r of data) {
    counts[r.reaction] = (counts[r.reaction] ?? 0) + 1
    byReaction[r.reaction] = [...(byReaction[r.reaction] ?? []), nameOf(r.user_id)]
  }
  return { counts, byReaction }
}

export async function addComment(postId: string, content: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false as const }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: userData.user.id, content })
    .select('id, content, created_at')
    .single()

  if (error || !data) return { success: false as const }

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userData.user.id).single()

  return {
    success: true as const,
    comment: {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      authorName: profile?.display_name ?? '—',
      reactionCounts: {} as Record<string, number>,
      myReaction: null as ReactionKey | null,
      replyCount: 0,
      replies: [] as any[],
    },
  }
}

export async function addReply(commentId: string, content: string, replyToUserId?: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false as const }

  const { data, error } = await supabase
    .from('comment_replies')
    .insert({ comment_id: commentId, author_id: userData.user.id, content, reply_to_user_id: replyToUserId || null })
    .select('id, content, created_at')
    .single()

  if (error || !data) return { success: false as const }

  const authorIds = [userData.user.id, ...(replyToUserId ? [replyToUserId] : [])]
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? '—'

  return {
    success: true as const,
    reply: {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      authorName: nameOf(userData.user.id),
      replyToName: replyToUserId ? nameOf(replyToUserId) : null,
      reactionCounts: {} as Record<string, number>,
      myReaction: null as ReactionKey | null,
    },
  }
}

export async function toggleBookmark(targetType: TargetType, targetId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false, bookmarked: false }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id)
    return { success: true, bookmarked: false }
  }
  await supabase.from('bookmarks').insert({ target_type: targetType, target_id: targetId, user_id: userData.user.id })
  return { success: true, bookmarked: true }
}

export async function toggleNotificationMute(postId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false, muted: false }

  const { data: existing } = await supabase
    .from('post_notification_mutes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_notification_mutes').delete().eq('id', existing.id)
    return { success: true, muted: false }
  }
  await supabase.from('post_notification_mutes').insert({ post_id: postId, user_id: userData.user.id })
  return { success: true, muted: true }
}

export async function reportContent(targetType: TargetType, targetId: string, reason: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { error } = await supabase
    .from('reports')
    .insert({ target_type: targetType, target_id: targetId, reporter_id: userData.user.id, reason })
  return { success: !error }
}

export async function repostPost(originalPostId: string, content: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  // لو البوست اللي بنشاركه هو نفسه مشاركة، نرجع للأصل الحقيقي (منع سلسلة مشاركات فاضية)
  const { data: target } = await supabase
    .from('posts')
    .select('id, shared_post_id')
    .eq('id', originalPostId)
    .single()

  const rootId = target?.shared_post_id ?? originalPostId

  const { error } = await supabase
    .from('posts')
    .insert({ author_id: userData.user.id, content, shared_post_id: rootId })
  return { success: !error }
}

export async function editPost(postId: string, content: string, mediaRefs: { type: 'image' | 'video'; ref: string }[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('posts').update({ content, updated_at: new Date().toISOString() }).eq('id', postId)
  if (error) return { success: false }

  await supabase.from('post_media').delete().eq('post_id', postId)
  if (mediaRefs.length > 0) {
    await supabase.from('post_media').insert(
      mediaRefs.map((m, i) => ({ post_id: postId, media_type: m.type, media_ref: m.ref, order_index: i }))
    )
  }
  return { success: true }
}

export async function getPostForEdit(postId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, content, author_id, post_media(media_type, media_ref, order_index)')
    .eq('id', postId)
    .single()

  if (!data) return null

  const images = (data.post_media ?? [])
    .filter((m: any) => m.media_type === 'image')
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((m: any) => m.media_ref)

  return { id: data.id, content: data.content, authorId: data.author_id, imageRefs: images }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  return { success: !error }
}

export async function getBookmarkFolders() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data } = await supabase
    .from('bookmark_folders')
    .select('id, name')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function createBookmarkFolder(name: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { data, error } = await supabase
    .from('bookmark_folders')
    .insert({ user_id: userData.user.id, name })
    .select('id, name')
    .single()

  if (error || !data) return { success: false }
  return { success: true, folder: data }
}

export async function saveBookmark(targetType: TargetType, targetId: string, folderId: string | null) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('bookmarks').update({ folder_id: folderId }).eq('id', existing.id)
  } else {
    await supabase.from('bookmarks').insert({ target_type: targetType, target_id: targetId, user_id: userData.user.id, folder_id: folderId })
  }

  return { success: true }
}

export async function unsaveBookmark(targetType: TargetType, targetId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  await supabase
    .from('bookmarks')
    .delete()
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userData.user.id)

  return { success: true }
}

const POSTS_PAGE_SIZE = 10
const COMMENTS_PREVIEW_SIZE = 3
const REPLIES_PREVIEW_SIZE = 2

export async function getFeed(cursor: string | null = null) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  let query = supabase
    .from('posts')
    .select(`
      id, content, created_at, author_id, shared_post_id,
      post_media(id, media_type, media_ref, order_index),
      post_comments(id, content, created_at, author_id,
        comment_replies(id, content, created_at, author_id, reply_to_user_id))
    `)
    .order('created_at', { ascending: false })
    .limit(POSTS_PAGE_SIZE)

  if (cursor) query = query.lt('created_at', cursor)

  const { data: posts, error } = await query
  if (error || !posts) return { posts: [], nextCursor: null }

  const sharedPostIds = Array.from(new Set(posts.map((p: any) => p.shared_post_id).filter(Boolean)))
  const sharedPostsMap = new Map<string, { id: string; content: string; authorName: string; media: { type: string; url: string }[]; reactionCounts: Record<string, number>; commentCount: number }>()
  if (sharedPostIds.length > 0) {
    const { data: sharedPostsData } = await supabase
      .from('posts')
      .select('id, content, author_id, post_media(media_type, media_ref, order_index), post_comments(id, comment_replies(id))')
      .in('id', sharedPostIds)

    const sharedAuthorIds = Array.from(new Set((sharedPostsData ?? []).map((sp: any) => sp.author_id)))
    const { data: sharedProfiles } = await supabase.from('profiles').select('id, display_name').in('id', sharedAuthorIds)
    const sharedNameOf = (id: string) => sharedProfiles?.find((pr) => pr.id === id)?.display_name ?? '—'

    const { data: sharedReactionsData } = await supabase
      .from('reactions')
      .select('target_id, reaction')
      .eq('target_type', 'post')
      .in('target_id', sharedPostIds)

    for (const sp of sharedPostsData ?? []) {
      const media = await Promise.all(
        ((sp as any).post_media ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map(async (m: any) => ({ type: m.media_type, url: await resolveMedia(m.media_ref) }))
      )
      const reactionCounts: Record<string, number> = {}
      ;(sharedReactionsData ?? []).filter((r: any) => r.target_id === sp.id).forEach((r: any) => {
        reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1
      })
      const sharedComments = (sp as any).post_comments ?? []
      const commentCount = sharedComments.length + sharedComments.reduce((sum: number, cc: any) => sum + (cc.comment_replies?.length ?? 0), 0)
      sharedPostsMap.set(sp.id, { id: sp.id, content: sp.content, authorName: sharedNameOf(sp.author_id), media, reactionCounts, commentCount })
    }
  }

  const authorIds = Array.from(new Set([
    ...posts.map((p: any) => p.author_id),
    ...posts.flatMap((p: any) => (p.post_comments ?? []).map((c: any) => c.author_id)),
    ...posts.flatMap((p: any) => (p.post_comments ?? []).flatMap((c: any) => (c.comment_replies ?? []).map((r: any) => r.author_id))),
  ]))

  const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
  const nameOf = (id: string) => profilesData?.find((pr) => pr.id === id)?.display_name ?? '—'

  const allTargetIds: string[] = []
  posts.forEach((p: any) => {
    allTargetIds.push(p.id)
    ;(p.post_comments ?? []).forEach((c: any) => {
      allTargetIds.push(c.id)
      ;(c.comment_replies ?? []).forEach((r: any) => allTargetIds.push(r.id))
    })
  })

  const { data: reactionsData } = await supabase
    .from('reactions')
    .select('target_type, target_id, reaction, user_id')
    .in('target_id', allTargetIds)

  function reactionsFor(type: TargetType, id: string) {
    const rows = (reactionsData ?? []).filter((r) => r.target_type === type && r.target_id === id)
    const counts: Record<string, number> = {}
    rows.forEach((r) => { counts[r.reaction] = (counts[r.reaction] ?? 0) + 1 })
    const mine = rows.find((r) => r.user_id === currentUserId)?.reaction ?? null
    return { counts, mine }
  }

  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select('target_type, target_id')
    .eq('user_id', currentUserId ?? '')

  function isBookmarked(type: TargetType, id: string) {
    return (bookmarksData ?? []).some((b) => b.target_type === type && b.target_id === id)
  }

  const { data: mutesData } = await supabase
    .from('post_notification_mutes')
    .select('post_id')
    .eq('user_id', currentUserId ?? '')

  function isMuted(postId: string) {
    return (mutesData ?? []).some((m) => m.post_id === postId)
  }

  const result = await Promise.all(
    posts.map(async (p: any) => {
      const postReactions = reactionsFor('post', p.id)
      const allComments = p.post_comments ?? []
      const commentsPreview = allComments
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, COMMENTS_PREVIEW_SIZE)

      return {
        id: p.id,
        authorId: p.author_id,
        sharedPost: p.shared_post_id ? sharedPostsMap.get(p.shared_post_id) ?? null : null,
        content: p.content,
        createdAt: p.created_at,
        authorName: nameOf(p.author_id),
        media: await Promise.all(
          (p.post_media ?? [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map(async (m: any) => ({ type: m.media_type, url: await resolveMedia(m.media_ref) }))
        ),
        reactionCounts: postReactions.counts,
        myReaction: postReactions.mine,
        bookmarked: isBookmarked('post', p.id),
        muted: isMuted(p.id),
        commentCount: allComments.length + allComments.reduce((sum: number, c: any) => sum + (c.comment_replies?.length ?? 0), 0),
        topLevelCommentCount: allComments.length,
        comments: commentsPreview.map((c: any) => {
          const commentReactions = reactionsFor('comment', c.id)
          const allReplies = c.comment_replies ?? []
          const repliesPreview = allReplies
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, REPLIES_PREVIEW_SIZE)
          return {
            id: c.id,
            content: c.content,
            createdAt: c.created_at,
            authorName: nameOf(c.author_id),
            reactionCounts: commentReactions.counts,
            myReaction: commentReactions.mine,
            replyCount: allReplies.length,
            replies: repliesPreview.map((r: any) => {
              const replyReactions = reactionsFor('reply', r.id)
              return {
                id: r.id,
                content: r.content,
                createdAt: r.created_at,
                authorName: nameOf(r.author_id),
                replyToName: r.reply_to_user_id ? nameOf(r.reply_to_user_id) : null,
                reactionCounts: replyReactions.counts,
                myReaction: replyReactions.mine,
              }
            }),
          }
        }),
      }
    })
  )

  const nextCursor = posts.length === POSTS_PAGE_SIZE ? posts[posts.length - 1].created_at : null

  return { posts: result, nextCursor }
}

export async function loadMoreComments(postId: string, skipIds: string[]) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: allComments } = await supabase
    .from('post_comments')
    .select(`id, content, created_at, author_id,
      comment_replies(id, content, created_at, author_id, reply_to_user_id)`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const filtered = (allComments ?? []).filter((c) => !skipIds.includes(c.id))
  const nextBatch = filtered.slice(0, COMMENTS_PREVIEW_SIZE)

  const authorIds = Array.from(new Set([
    ...nextBatch.map((c: any) => c.author_id),
    ...nextBatch.flatMap((c: any) => (c.comment_replies ?? []).map((r: any) => r.author_id)),
  ]))
  const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
  const nameOf = (id: string) => profilesData?.find((pr) => pr.id === id)?.display_name ?? '—'

  const targetIds = nextBatch.flatMap((c: any) => [c.id, ...(c.comment_replies ?? []).map((r: any) => r.id)])
  const { data: reactionsData } = await supabase
    .from('reactions')
    .select('target_type, target_id, reaction, user_id')
    .in('target_id', targetIds)

  function reactionsFor(type: TargetType, id: string) {
    const rows = (reactionsData ?? []).filter((r) => r.target_type === type && r.target_id === id)
    const counts: Record<string, number> = {}
    rows.forEach((r) => { counts[r.reaction] = (counts[r.reaction] ?? 0) + 1 })
    const mine = rows.find((r) => r.user_id === currentUserId)?.reaction ?? null
    return { counts, mine }
  }

  const comments = nextBatch.map((c: any) => {
    const commentReactions = reactionsFor('comment', c.id)
    const allReplies = c.comment_replies ?? []
    const repliesPreview = allReplies.slice(0, REPLIES_PREVIEW_SIZE)
    return {
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      authorName: nameOf(c.author_id),
      reactionCounts: commentReactions.counts,
      myReaction: commentReactions.mine,
      replyCount: allReplies.length,
      replies: repliesPreview.map((r: any) => {
        const replyReactions = reactionsFor('reply', r.id)
        return {
          id: r.id,
          content: r.content,
          createdAt: r.created_at,
          authorName: nameOf(r.author_id),
          replyToName: r.reply_to_user_id ? nameOf(r.reply_to_user_id) : null,
          reactionCounts: replyReactions.counts,
          myReaction: replyReactions.mine,
        }
      }),
    }
  })

  return { comments, hasMore: filtered.length > COMMENTS_PREVIEW_SIZE }
}

export async function loadMoreReplies(commentId: string, skipIds: string[]) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: allReplies } = await supabase
    .from('comment_replies')
    .select('id, content, created_at, author_id, reply_to_user_id')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true })

  const filtered = (allReplies ?? []).filter((r) => !skipIds.includes(r.id))
  const nextBatch = filtered.slice(0, REPLIES_PREVIEW_SIZE)

  const authorIds = Array.from(new Set(nextBatch.flatMap((r: any) => [r.author_id, r.reply_to_user_id].filter(Boolean))))
  const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
  const nameOf = (id: string) => profilesData?.find((pr) => pr.id === id)?.display_name ?? '—'

  const { data: reactionsData } = await supabase
    .from('reactions')
    .select('reaction, user_id, target_id')
    .eq('target_type', 'reply')
    .in('target_id', nextBatch.map((r: any) => r.id))

  const replies = nextBatch.map((r: any) => {
    const rows = (reactionsData ?? []).filter((x) => x.target_id === r.id)
    const counts: Record<string, number> = {}
    rows.forEach((x) => { counts[x.reaction] = (counts[x.reaction] ?? 0) + 1 })
    const mine = rows.find((x) => x.user_id === currentUserId)?.reaction ?? null
    return {
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      authorName: nameOf(r.author_id),
      replyToName: r.reply_to_user_id ? nameOf(r.reply_to_user_id) : null,
      reactionCounts: counts,
      myReaction: mine,
    }
  })

  return { replies, hasMore: filtered.length > REPLIES_PREVIEW_SIZE }
}

export async function getPostDetail(postId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: p, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, author_id, shared_post_id,
      post_media(id, media_type, media_ref, order_index),
      post_comments(id, content, created_at, author_id,
        comment_replies(id, content, created_at, author_id, reply_to_user_id))
    `)
    .eq('id', postId)
    .single()

  if (error || !p) return null

  const authorIds = Array.from(new Set([
    p.author_id,
    ...((p.post_comments ?? []).map((c: any) => c.author_id)),
    ...((p.post_comments ?? []).flatMap((c: any) => (c.comment_replies ?? []).map((r: any) => r.author_id))),
  ]))
  const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
  const nameOf = (id: string) => profilesData?.find((pr) => pr.id === id)?.display_name ?? '—'

  const allTargetIds: string[] = [p.id]
  ;(p.post_comments ?? []).forEach((c: any) => {
    allTargetIds.push(c.id)
    ;(c.comment_replies ?? []).forEach((r: any) => allTargetIds.push(r.id))
  })

  const { data: reactionsData } = await supabase
    .from('reactions')
    .select('target_type, target_id, reaction, user_id')
    .in('target_id', allTargetIds)

  function reactionsFor(type: TargetType, id: string) {
    const rows = (reactionsData ?? []).filter((r) => r.target_type === type && r.target_id === id)
    const counts: Record<string, number> = {}
    rows.forEach((r) => { counts[r.reaction] = (counts[r.reaction] ?? 0) + 1 })
    const mine = rows.find((r) => r.user_id === currentUserId)?.reaction ?? null
    return { counts, mine }
  }

  const { data: bookmarkRow } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('target_type', 'post')
    .eq('target_id', p.id)
    .eq('user_id', currentUserId ?? '')
    .maybeSingle()

  const { data: muteRow } = await supabase
    .from('post_notification_mutes')
    .select('id')
    .eq('post_id', p.id)
    .eq('user_id', currentUserId ?? '')
    .maybeSingle()

  let sharedPost = null
  if (p.shared_post_id) {
    const { data: sp } = await supabase
      .from('posts')
      .select('id, content, author_id, post_media(media_type, media_ref, order_index), post_comments(id, comment_replies(id))')
      .eq('id', p.shared_post_id)
      .single()

    if (sp) {
      const { data: spProfile } = await supabase.from('profiles').select('display_name').eq('id', sp.author_id).single()
      const media = await Promise.all(
        ((sp as any).post_media ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map(async (m: any) => ({ type: m.media_type, url: await resolveMedia(m.media_ref) }))
      )
      const { data: spReactions } = await supabase
        .from('reactions')
        .select('reaction')
        .eq('target_type', 'post')
        .eq('target_id', sp.id)
      const reactionCounts: Record<string, number> = {}
      ;(spReactions ?? []).forEach((r: any) => { reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1 })
      const spComments = (sp as any).post_comments ?? []
      const commentCount = spComments.length + spComments.reduce((sum: number, c: any) => sum + (c.comment_replies?.length ?? 0), 0)
      sharedPost = {
        id: sp.id,
        content: sp.content,
        authorName: spProfile?.display_name ?? '—',
        media,
        reactionCounts,
        commentCount,
      }
    }
  }

  const postReactions = reactionsFor('post', p.id)
  const allComments = p.post_comments ?? []

  return {
    id: p.id,
    authorId: p.author_id,
    content: p.content,
    createdAt: p.created_at,
    authorName: nameOf(p.author_id),
    media: await Promise.all(
      (p.post_media ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map(async (m: any) => ({ type: m.media_type, url: await resolveMedia(m.media_ref) }))
    ),
    reactionCounts: postReactions.counts,
    myReaction: postReactions.mine,
    bookmarked: !!bookmarkRow,
    muted: !!muteRow,
    commentCount: allComments.length + allComments.reduce((sum: number, c: any) => sum + (c.comment_replies?.length ?? 0), 0),
    topLevelCommentCount: allComments.length,
    comments: allComments.map((c: any) => {
      const commentReactions = reactionsFor('comment', c.id)
      return {
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        authorName: nameOf(c.author_id),
        reactionCounts: commentReactions.counts,
        myReaction: commentReactions.mine,
        replyCount: (c.comment_replies ?? []).length,
        replies: (c.comment_replies ?? []).map((r: any) => {
          const replyReactions = reactionsFor('reply', r.id)
          return {
            id: r.id,
            content: r.content,
            createdAt: r.created_at,
            authorName: nameOf(r.author_id),
            replyToName: r.reply_to_user_id ? nameOf(r.reply_to_user_id) : null,
            reactionCounts: replyReactions.counts,
            myReaction: replyReactions.mine,
          }
        }),
      }
    }),
    sharedPost,
  }
}
