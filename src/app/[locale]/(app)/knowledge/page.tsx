import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { hasRole } from '@/lib/authorization/service'
import { getPublishedKnowledgeItems } from '@/lib/knowledge/items'

type KnowledgePageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function KnowledgePage({
  params,
}: KnowledgePageProps) {
  const { locale } = await params

  const t = await getTranslations({
    locale,
    namespace: 'knowledge',
  })

  const canManageKnowledge =
    (await hasRole('knowledge_manager')) ||
    (await hasRole('super_admin'))

  const items = await getPublishedKnowledgeItems()

  return (
    <div className="p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('title')}
        </h1>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-neutral-600">
            {t('description')}
          </p>
          {canManageKnowledge && (
            <Link
              href="/knowledge/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              {t('create')}
            </Link>
          )}
        </div>
      </header>

      <section className="mt-8">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('emptyTitle')}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">
              {t('emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
                  {item.item_type}
                </p>

                <h2 className="mt-2 text-lg font-semibold text-neutral-900">
                  {item.version.title}
                </h2>

                {item.version.summary && (
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.version.summary}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
