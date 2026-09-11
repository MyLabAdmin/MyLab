import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { hasRole } from '@/lib/authorization/service'
import {
  getKnowledgeCategories,
  type KnowledgeLocale,
} from '@/lib/knowledge/categories'
import { CreateGenericKnowledgeItemForm } from '@/components/knowledge/CreateGenericKnowledgeItemForm'

type NewKnowledgePageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function NewKnowledgePage({
  params,
}: NewKnowledgePageProps) {
  const { locale } = await params

  const canManageKnowledge =
    (await hasRole('knowledge_manager')) ||
    (await hasRole('super_admin'))

  if (!canManageKnowledge) {
    return redirect({
      href: '/knowledge',
      locale: locale as 'en' | 'ar',
    })
  }

  const t = await getTranslations({
    locale,
    namespace: 'knowledge.new',
  })

  const categories = await getKnowledgeCategories(
    locale as KnowledgeLocale,
  )

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
      parent_name:
        parentNames.get(category.parent_id ?? '') ?? null,
    }))

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('title')}
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t('description')}
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateGenericKnowledgeItemForm
          parents={parents}
          subcategories={subcategories}
        />
      </section>
    </div>
  )
}
