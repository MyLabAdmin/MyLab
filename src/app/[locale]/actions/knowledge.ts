'use server'

import { createClient } from '@/lib/supabase/server'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'

export type BlockInput = {
  blockType: 'text' | 'image' | 'video' | 'list' | 'quote'
  isPaid: boolean
  mediaRef?: string
  subtitleEn?: string
  subtitleAr?: string
  contentEn: string
  contentAr: string
}

export type KnowledgeItemInput = {
  categoryId: string
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  coverImageRef?: string
  blocks: BlockInput[]
  status: 'draft' | 'published'
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) + '-' + Date.now().toString(36)
  )
}

export async function getImagePreviewUrl(path: string) {
  return getImagekitSignedUrl(path)
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, section, slug, category_translations(locale, name)')
    .order('position')

  if (error) return { categories: [], error: error.message }
  return { categories: data, error: null }
}

export async function createKnowledgeItem(input: KnowledgeItemInput) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false, error: 'Not authenticated' }

  const { data: item, error: itemError } = await supabase
    .from('knowledge_items')
    .insert({
      category_id: input.categoryId,
      slug: slugify(input.titleEn),
      status: input.status,
      pricing: input.blocks.every((b) => !b.isPaid)
        ? 'free'
        : input.blocks.every((b) => b.isPaid)
          ? 'paid'
          : 'mixed',
      cover_image_url: input.coverImageRef || null,
      created_by: userData.user.id,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (itemError || !item) {
    return { success: false, error: itemError?.message ?? 'Failed to create item' }
  }

  await supabase.from('knowledge_item_translations').insert([
    { item_id: item.id, locale: 'en', title: input.titleEn, excerpt: input.excerptEn },
    { item_id: item.id, locale: 'ar', title: input.titleAr, excerpt: input.excerptAr },
  ])

  for (let i = 0; i < input.blocks.length; i++) {
    const b = input.blocks[i]
    const { data: block, error: blockError } = await supabase
      .from('knowledge_blocks')
      .insert({
        item_id: item.id,
        block_type: b.blockType,
        is_paid: b.isPaid,
        order_index: i,
        media_url: b.mediaRef || null,
      })
      .select('id')
      .single()

    if (blockError || !block) continue

    await supabase.from('knowledge_block_translations').insert([
      { block_id: block.id, locale: 'en', content: { text: b.contentEn, subtitle: b.subtitleEn || null } },
      { block_id: block.id, locale: 'ar', content: { text: b.contentAr, subtitle: b.subtitleAr || null } },
    ])
  }

  return { success: true, itemId: item.id }
}
