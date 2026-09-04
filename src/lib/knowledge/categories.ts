import { createClient } from '@/lib/supabase/server'

export const KNOWLEDGE_LOCALES = ['en', 'ar'] as const

export type KnowledgeLocale = (typeof KNOWLEDGE_LOCALES)[number]

export type KnowledgeCategory = {
  id: string
  code: string
  name: string
  description: string | null
  parent_id: string | null
}

export type KnowledgeCategoryOption = KnowledgeCategory & {
  parent_name: string | null
}

function isKnowledgeLocale(value: string): value is KnowledgeLocale {
  return (KNOWLEDGE_LOCALES as readonly string[]).includes(value)
}

export async function getKnowledgeCategories(
  locale: KnowledgeLocale = 'en',
): Promise<KnowledgeCategory[]> {
  if (!isKnowledgeLocale(locale)) {
    throw new Error(`Unsupported knowledge locale: ${locale}`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_categories')
    .select(`
      id,
      code,
      description,
      parent_id,
      knowledge_category_translations!inner (
        name,
        description
      )
    `)
    .eq('knowledge_category_translations.locale', locale)
    .order('parent_id', { ascending: true })
    .order('code', { ascending: true })

  if (error) {
    throw new Error(`Failed to load knowledge categories: ${error.message}`)
  }

  return (data ?? []).map((item) => {
    const translation = Array.isArray(item.knowledge_category_translations)
      ? item.knowledge_category_translations[0]
      : item.knowledge_category_translations

    return {
      id: item.id,
      code: item.code,
      name: translation?.name ?? item.code,
      description:
        translation?.description ?? item.description ?? null,
      parent_id: item.parent_id,
    }
  })
}

export async function getLaboratoryTestCategories(
  locale: KnowledgeLocale = 'en',
): Promise<{
  parents: KnowledgeCategory[]
  subcategories: KnowledgeCategoryOption[]
}> {
  const categories = await getKnowledgeCategories(locale)

  const parents = categories
    .filter((category) => category.parent_id === null)
    .sort((a, b) => a.name.localeCompare(b.name, locale))

  const parentNames = new Map(
    parents.map((parent) => [parent.id, parent.name]),
  )

  const subcategories = categories
    .filter((category) => category.parent_id !== null)
    .map((category) => ({
      ...category,
      parent_name: parentNames.get(category.parent_id ?? '') ?? null,
    }))
    .sort((a, b) => {
      const parentCompare = (a.parent_name ?? '').localeCompare(
        b.parent_name ?? '',
        locale,
      )

      if (parentCompare !== 0) {
        return parentCompare
      }

      return a.name.localeCompare(b.name, locale)
    })

  return {
    parents,
    subcategories,
  }
}
