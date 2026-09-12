import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { KnowledgeMediaGallery } from '@/components/knowledge/KnowledgeMediaGallery'
import { getPublishedKnowledgeDetail } from '@/lib/knowledge/detail'
import { KNOWLEDGE_LOCALES, type KnowledgeLocale } from '@/lib/knowledge/types'

type KnowledgeDetailPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

function isKnowledgeLocale(locale: string): locale is KnowledgeLocale {
  return KNOWLEDGE_LOCALES.includes(locale as KnowledgeLocale)
}

export default async function KnowledgeDetailPage({
  params,
}: KnowledgeDetailPageProps) {
  const { locale, id } = await params

  if (!isKnowledgeLocale(locale)) {
    notFound()
  }

  const t = await getTranslations({
    locale,
    namespace: 'knowledge',
  })

  const detail = await getPublishedKnowledgeDetail(id, locale)

  if (!detail) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-700">
          {detail.item.item_type}
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-neutral-900">
          {detail.title}
        </h1>

        {detail.subtitle && (
          <p className="mt-2 text-lg text-neutral-600">
            {detail.subtitle}
          </p>
        )}

        {detail.summary && (
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
            {detail.summary}
          </p>
        )}

        {detail.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-8 space-y-8">
        {detail.access && (
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              {t('detail.access')}
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              {detail.access.tier}
            </p>
          </section>
        )}

        {detail.content && (
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              {t('detail.content')}
            </h2>

            <div className="mt-3 whitespace-pre-wrap leading-7 text-neutral-700">
              {detail.content}
            </div>
          </section>
        )}

        {detail.pre_test_preparation && (
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              {t('detail.preTestPreparation')}
            </h2>

            <div className="mt-3 whitespace-pre-wrap leading-7 text-neutral-700">
              {detail.pre_test_preparation}
            </div>
          </section>
        )}

        <KnowledgeMediaGallery
          title={detail.title}
          media={detail.media}
          heading={t('detail.media')}
        />

        {detail.references.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              {t('detail.references')}
            </h2>

            <ul className="mt-4 space-y-3">
              {detail.references.map((reference) => (
                <li
                  key={reference.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <p className="font-medium text-neutral-900">
                    {reference.title}
                  </p>

                  {reference.citation && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {reference.citation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
