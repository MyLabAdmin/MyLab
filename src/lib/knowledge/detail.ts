import { createClient } from '@/lib/supabase/server'
import type {
  KnowledgeItem,
  KnowledgeItemVersion,
  KnowledgeLocale,
} from './types'
import { getPublishedKnowledgeTranslation } from './translations'

export type KnowledgeDetailCategory = {
  id: string
  code: string
  name: string
  parent_id: string | null
}

export type KnowledgeDetailReference = {
  id: string
  reference_type: string
  title: string
  authors: string | null
  publication_year: number | null
  publisher: string | null
  url: string | null
  citation: string | null
}

export type KnowledgeDetailMedia = {
  id: string
  image_url: string
  alt_text: string | null
  sort_order: number
}

export type KnowledgeDetailAccess = {
  tier: string
  preview_enabled: boolean
  preview_content: string | null
}

export type KnowledgeDetail = {
  item: KnowledgeItem
  version: KnowledgeItemVersion
  title: string
  subtitle: string | null
  summary: string | null
  content: string | null
  pre_test_preparation: string | null
  categories: KnowledgeDetailCategory[]
  references: KnowledgeDetailReference[]
  media: KnowledgeDetailMedia[]
  access: KnowledgeDetailAccess | null
  translation: Awaited<
    ReturnType<typeof getPublishedKnowledgeTranslation>
  >
}

export async function getPublishedKnowledgeDetail(
  knowledgeItemId: string,
  locale: KnowledgeLocale,
): Promise<KnowledgeDetail | null> {
  const supabase = await createClient()

  const { data: item, error: itemError } = await supabase
    .from('knowledge_items')
    .select(
      `
        id,
        item_type,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at,
        knowledge_item_versions (
          id,
          knowledge_item_id,
          version_number,
          title,
          subtitle,
          summary,
          content,
          pre_test_preparation,
          status,
          review_status,
          created_by,
          created_at,
          published_at
        )
      `,
    )
    .eq('id', knowledgeItemId)
    .eq('status', 'published')
    .maybeSingle()

  if (itemError) {
    throw new Error(
      `Failed to load Knowledge detail: ${itemError.message}`,
    )
  }

  if (!item) {
    return null
  }

  const versions = Array.isArray(item.knowledge_item_versions)
    ? item.knowledge_item_versions
    : []

  const version = versions.find(
    (candidate) =>
      candidate.status === 'published' &&
      candidate.review_status === 'approved',
  )

  if (!version) {
    return null
  }

  const [
    categoriesResult,
    referencesResult,
    mediaResult,
    accessResult,
    translation,
  ] = await Promise.all([
    supabase
      .from('knowledge_item_categories')
      .select(
        `
          knowledge_category_id,
          knowledge_categories (
            id,
            code,
            parent_id,
            knowledge_category_translations (
              name,
              locale
            )
          )
        `,
      )
      .eq('knowledge_item_id', knowledgeItemId),

    supabase
      .from('knowledge_references')
      .select(
        `
          id,
          reference_type,
          title,
          authors,
          publication_year,
          publisher,
          url,
          citation
        `,
      )
      .eq('knowledge_item_id', knowledgeItemId),

    supabase
      .from('knowledge_version_images')
      .select(
        `
          id,
          image_url,
          alt_text,
          sort_order
        `,
      )
      .eq('knowledge_item_version_id', version.id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('knowledge_access_policies')
      .select(
        `
          tier,
          preview_enabled,
          preview_content
        `,
      )
      .eq('knowledge_item_id', knowledgeItemId)
      .eq('active', true)
      .maybeSingle(),

    getPublishedKnowledgeTranslation(
      knowledgeItemId,
      version.id,
      locale,
    ),
  ])

  const firstError =
    categoriesResult.error ??
    referencesResult.error ??
    mediaResult.error ??
    accessResult.error

  if (firstError) {
    throw new Error(
      `Failed to load Knowledge detail relations: ${firstError.message}`,
    )
  }

  const categories: KnowledgeDetailCategory[] = (
    categoriesResult.data ?? []
  ).flatMap((row) => {
    const category = Array.isArray(row.knowledge_categories)
      ? row.knowledge_categories[0]
      : row.knowledge_categories

    if (!category) {
      return []
    }

    const translation = Array.isArray(
      category.knowledge_category_translations,
    )
      ? category.knowledge_category_translations.find(
          (candidate) => candidate.locale === locale,
        )
      : null

    return [
      {
        id: category.id,
        code: category.code,
        name: translation?.name ?? category.code,
        parent_id: category.parent_id,
      },
    ]
  })

  return {
    item: {
      id: item.id,
      item_type: item.item_type,
      status: item.status,
      created_by: item.created_by,
      updated_by: item.updated_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    },
    version: version as KnowledgeItemVersion,
    title: translation?.title ?? version.title,
    subtitle: translation?.subtitle ?? version.subtitle,
    summary: translation?.summary ?? version.summary,
    content: translation?.content ?? version.content,
    pre_test_preparation: version.pre_test_preparation,
    categories,
    references: referencesResult.data ?? [],
    media: mediaResult.data ?? [],
    access: accessResult.data ?? null,
    translation,
  }
}
