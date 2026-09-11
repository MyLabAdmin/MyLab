import { createClient } from '@/lib/supabase/server'
import {
  KNOWLEDGE_ACCESS_TIERS,
  KNOWLEDGE_ITEM_TYPES,
  type KnowledgeAccessTier,
  type KnowledgeItemType,
  type KnowledgeLocale,
} from './types'

export type KnowledgeDiscoveryFilters = {
  locale?: KnowledgeLocale
  search?: string
  itemTypes?: KnowledgeItemType[]
  categoryId?: string
  accessTier?: KnowledgeAccessTier
  page?: number
  pageSize?: number
}

export type KnowledgeDiscoveryCategory = {
  id: string
  code: string
  name: string
  parent_id: string | null
}

export type KnowledgeDiscoveryItem = {
  id: string
  item_type: KnowledgeItemType
  version_id: string
  version_number: number
  title: string
  subtitle: string | null
  summary: string | null
  published_at: string | null
  access_tier: KnowledgeAccessTier | null
  categories: KnowledgeDiscoveryCategory[]
}

export type KnowledgeDiscoveryResult = {
  items: KnowledgeDiscoveryItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type PublishedKnowledgeDiscoveryRow = {
  id: string
  item_type: KnowledgeItemType
  knowledge_item_versions: Array<{
    id: string
    version_number: number
    title: string
    subtitle: string | null
    summary: string | null
    published_at: string | null
  }>
  knowledge_item_categories: Array<{
    category_id: string
  }>
  knowledge_access_policies: Array<{
    knowledge_item_id: string
    access_tier: KnowledgeAccessTier
    active: boolean
  }>
}

function isKnowledgeItemType(value: string): value is KnowledgeItemType {
  return (KNOWLEDGE_ITEM_TYPES as readonly string[]).includes(value)
}

function isKnowledgeAccessTier(value: string): value is KnowledgeAccessTier {
  return (KNOWLEDGE_ACCESS_TIERS as readonly string[]).includes(value)
}

function normalizePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : 1
}

function normalizePageSize(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value <= 0) {
    return 24
  }

  return Math.min(value, 100)
}

export async function getKnowledgeDiscovery(
  filters: KnowledgeDiscoveryFilters = {},
): Promise<KnowledgeDiscoveryResult> {
  const supabase = await createClient()

  const page = normalizePage(filters.page)
  const pageSize = normalizePageSize(filters.pageSize)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const requestedTypes = (filters.itemTypes ?? []).filter(isKnowledgeItemType)

  if (filters.itemTypes && requestedTypes.length !== filters.itemTypes.length) {
    throw new Error('Unsupported knowledge item type')
  }

  if (filters.accessTier && !isKnowledgeAccessTier(filters.accessTier)) {
    throw new Error('Unsupported knowledge access tier')
  }

  const categoryRelation = filters.categoryId
    ? 'knowledge_item_categories!inner ( category_id )'
    : 'knowledge_item_categories ( category_id )'

  const accessRelation = filters.accessTier
    ? 'knowledge_access_policies!inner ( knowledge_item_id, access_tier, active )'
    : 'knowledge_access_policies ( knowledge_item_id, access_tier, active )'

  let query = supabase
    .from('knowledge_items')
    .select(
      `
        id,
        item_type,
        knowledge_item_versions!inner (
          id,
          version_number,
          title,
          subtitle,
          summary,
          published_at
        ),
        ${categoryRelation},
        ${accessRelation}
      `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .eq('knowledge_item_versions.status', 'published')
    .eq('knowledge_item_versions.review_status', 'approved')

  if (requestedTypes.length > 0) {
    query = query.in('item_type', requestedTypes)
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[%_]/g, '\\$&')
    query = query.or(
      `title.ilike.%${search}%,summary.ilike.%${search}%`,
      {
        referencedTable: 'knowledge_item_versions',
      },
    )
  }

  if (filters.categoryId) {
    query = query.eq(
      'knowledge_item_categories.category_id',
      filters.categoryId,
    )
  }

  if (filters.accessTier) {
    query = query
      .eq('knowledge_access_policies.access_tier', filters.accessTier)
      .eq('knowledge_access_policies.active', true)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`Failed to load knowledge discovery: ${error.message}`)
  }

  const rows = (data ?? []) as PublishedKnowledgeDiscoveryRow[]
  const accessPolicies = new Map<string, KnowledgeAccessTier>()

  for (const row of rows) {
    for (const policy of row.knowledge_access_policies) {
      if (policy.active && isKnowledgeAccessTier(policy.access_tier)) {
        accessPolicies.set(row.id, policy.access_tier)
      }
    }
  }

  const categoryIds = [
    ...new Set(
      rows.flatMap((row) =>
        row.knowledge_item_categories.map((category) => category.category_id),
      ),
    ),
  ]

  const categories = new Map<string, KnowledgeDiscoveryCategory>()

  if (categoryIds.length > 0) {
    const locale = filters.locale ?? 'en'

    const { data: categoryRows, error: categoryError } = await supabase
      .from('knowledge_categories')
      .select(
        `
          id,
          code,
          parent_id,
          knowledge_category_translations!inner (
            name
          )
        `,
      )
      .in('id', categoryIds)
      .eq('knowledge_category_translations.locale', locale)

    if (categoryError) {
      throw new Error(
        `Failed to load knowledge discovery categories: ${categoryError.message}`,
      )
    }

    for (const category of categoryRows ?? []) {
      const translation = Array.isArray(
        category.knowledge_category_translations,
      )
        ? category.knowledge_category_translations[0]
        : category.knowledge_category_translations

      categories.set(category.id, {
        id: category.id,
        code: category.code,
        name: translation?.name ?? category.code,
        parent_id: category.parent_id,
      })
    }
  }

  const items = rows
    .map((row) => {
      const version = row.knowledge_item_versions[0]

      if (!version) {
        return null
      }

      const accessTier = accessPolicies.get(row.id) ?? null

      return {
        id: row.id,
        item_type: row.item_type,
        version_id: version.id,
        version_number: version.version_number,
        title: version.title,
        subtitle: version.subtitle,
        summary: version.summary,
        published_at: version.published_at,
        access_tier: accessTier,
        categories: row.knowledge_item_categories
          .map((relation) => categories.get(relation.category_id))
          .filter(
            (category): category is KnowledgeDiscoveryCategory =>
              category !== undefined,
          ),
      }
    })
    .filter((item): item is KnowledgeDiscoveryItem => item !== null)

  const total = count ?? 0

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
