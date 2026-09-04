import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { notFound } from 'next/navigation'

import { hasRole } from '@/lib/authorization/service'
import {
  getLaboratoryTestCategories,
  type KnowledgeLocale,
} from '@/lib/knowledge/categories'
import { getLaboratoryTestDraft } from '@/lib/knowledge/laboratory-test-draft'
import { CreateLaboratoryTestForm } from '@/components/knowledge/CreateLaboratoryTestForm'

type LaboratoryTestEditPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function LaboratoryTestEditPage({
  params,
}: LaboratoryTestEditPageProps) {
  const { locale, id } = await params

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

  const [t, categories, draft] = await Promise.all([
    getTranslations({
      locale: validLocale,
      namespace: 'knowledge.laboratoryTest',
    }),
    getLaboratoryTestCategories(validLocale),
    getLaboratoryTestDraft(id),
  ])

  if (!draft) {
    return notFound()
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('editTitle')}
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t('editDescription')}
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateLaboratoryTestForm
          parents={categories.parents}
          subcategories={categories.subcategories}
          initialData={draft}
          mode="edit"
        />
      </section>
    </div>
  )
}
