import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { hasRole } from '@/lib/authorization/service'
import {
  getLaboratoryTestCategories,
  type KnowledgeLocale,
} from '@/lib/knowledge/categories'
import { CreateLaboratoryTestForm } from '@/components/knowledge/CreateLaboratoryTestForm'

type LaboratoryTestPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function LaboratoryTestPage({
  params,
}: LaboratoryTestPageProps) {
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

  const validLocale: KnowledgeLocale =
    locale === 'ar' ? 'ar' : 'en'

  const [t, categories] = await Promise.all([
    getTranslations({
      locale: validLocale,
      namespace: 'knowledge.laboratoryTest',
    }),
    getLaboratoryTestCategories(validLocale),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('title')}
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t('description')}
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateLaboratoryTestForm
          parents={categories.parents}
          subcategories={categories.subcategories}
        />
      </section>
    </div>
  )
}
