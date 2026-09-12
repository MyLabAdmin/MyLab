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

type KnowledgeDiscoveryRow = {
  id: string
  item_type: string
  version_id: string
  version_number: number
  title: string
  subtitle: string | null
  summary: string | null
  published_at: string | null
  access_tier: string | null
  categories: Array<{
    id: string
    code: string
    name: string
    parent_id: string | null
  }>
  total_count: number
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
  const requestedTypes = (filters.itemTypes ?? []).filter(isKnowledgeItemType)

  if (filters.itemTypes && requestedTypes.length !== filters.itemTypes.length) {
    throw new Error('Unsupported knowledge item type')
  }

  if (filters.accessTier && !isKnowledgeAccessTier(filters.accessTier)) {
    throw new Error('Unsupported knowledge access tier')
  }

  const { data, error } = await supabase.rpc('get_knowledge_discovery', {
    p_locale: filters.locale ?? 'en',
    p_search: filters.search?.trim() || null,
    p_item_types: requestedTypes.length > 0 ? requestedTypes : null,
    p_category_id: filters.categoryId ?? null,
    p_access_tier: filters.accessTier ?? null,
    p_page: page,
    p_page_size: pageSize,
  })

  if (error) {
    throw new Error(`Failed to load knowledge discovery: ${error.message}`)
  }

  const rows = (data ?? []) as KnowledgeDiscoveryRow[]
  const total = rows[0]?.total_count ?? 0

  const items = rows
    .map((row) => {
      if (!isKnowledgeItemType(row.item_type)) {
        return null
      }

      const accessTier =
        row.access_tier && isKnowledgeAccessTier(row.access_tier)
          ? row.access_tier
          : null

      return {
        id: row.id,
        item_type: row.item_type,
        version_id: row.version_id,
        version_number: row.version_number,
        title: row.title,
        subtitle: row.subtitle,
        summary: row.summary,
        published_at: row.published_at,
        access_tier: accessTier,
        categories: row.categories,
      }
    })
    .filter((item): item is KnowledgeDiscoveryItem => item !== null)

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
