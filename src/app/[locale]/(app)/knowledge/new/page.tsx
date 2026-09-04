import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { hasRole } from '@/lib/authorization/service'
import { CreateKnowledgeItemForm } from '@/components/knowledge/CreateKnowledgeItemForm'

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

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('title')}
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t('description')}
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateKnowledgeItemForm />
      </section>
    </div>
  )
}
