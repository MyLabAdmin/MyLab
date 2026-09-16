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
  if (!userData.user) return { success: false, error: 'Not authenticated' }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ author_id: userData.user.id, content })
    .select('id')
    .single()

  if (error || !post) return { success: false, error: error?.message }

  if (mediaRefs.length > 0) {
    await supabase.from('post_media').insert(
      mediaRefs.map((m, i) => ({ post_id: post.id, media_type: m.type, media_ref: m.ref, order_index: i }))
    )
  }

  return { success: true, postId: post.id }
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
  if (!userData.user) return { success: false }

  const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_id: userData.user.id, content })
  return { success: !error }
}

export async function addReply(commentId: string, content: string, replyToUserId?: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { error } = await supabase
    .from('comment_replies')
    .insert({ comment_id: commentId, author_id: userData.user.id, content, reply_to_user_id: replyToUserId || null })
  return { success: !error }
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

export async function repostPost(originalPostId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { error } = await supabase
    .from('posts')
    .insert({ author_id: userData.user.id, content: '', shared_post_id: originalPostId })
  return { success: !error }
}

export async function getFeed() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, author_id,
      post_media(id, media_type, media_ref, order_index),
      post_comments(id, content, created_at, author_id,
        comment_replies(id, content, created_at, author_id, reply_to_user_id))
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !posts) return []

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

  return Promise.all(
    posts.map(async (p: any) => {
      const postReactions = reactionsFor('post', p.id)
      return {
        id: p.id,
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
        comments: (p.post_comments ?? []).map((c: any) => {
          const commentReactions = reactionsFor('comment', c.id)
          return {
            id: c.id,
            content: c.content,
            createdAt: c.created_at,
            authorName: nameOf(c.author_id),
            reactionCounts: commentReactions.counts,
            myReaction: commentReactions.mine,
            bookmarked: isBookmarked('comment', c.id),
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
      }
    })
  )
}
