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

  const { data: itemId, error } = await supabase.rpc('create_knowledge_item', {
    p_category_id: input.categoryId,
    p_slug: slugify(input.titleEn),
    p_title_en: input.titleEn,
    p_title_ar: input.titleAr,
    p_excerpt_en: input.excerptEn,
    p_excerpt_ar: input.excerptAr,
    p_cover_image_ref: input.coverImageRef || null,
    p_status: input.status,
    p_blocks: input.blocks,
  })

  if (error || !itemId) {
    return {
      success: false,
      error: error?.message ?? 'Failed to create item',
    }
  }

  return { success: true, itemId }
}
