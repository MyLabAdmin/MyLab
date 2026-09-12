import { createClient } from '@/lib/supabase/server'
import { KNOWLEDGE_LOCALES, type KnowledgeLocale } from './types'

export type KnowledgeTranslation = {
  id: string
  knowledge_item_id: string
  source_version_id: string
  locale: KnowledgeLocale
  title: string
  subtitle: string | null
  summary: string | null
  content: string
  status: string
  published_at: string | null
}

export async function getPublishedKnowledgeTranslation(
  knowledgeItemId: string,
  sourceVersionId: string,
  locale: KnowledgeLocale,
): Promise<KnowledgeTranslation | null> {
  if (!KNOWLEDGE_LOCALES.includes(locale)) {
    throw new Error('Unsupported knowledge locale')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_item_translations')
    .select(
      `
        id,
        knowledge_item_id,
        source_version_id,
        locale,
        title,
        subtitle,
        summary,
        content,
        status,
        published_at
      `,
    )
    .eq('knowledge_item_id', knowledgeItemId)
    .eq('source_version_id', sourceVersionId)
    .eq('locale', locale)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to load Knowledge translation: ${error.message}`,
    )
  }

  if (!data) {
    return null
  }

  return {
    ...data,
    locale: data.locale as KnowledgeLocale,
  }
}
