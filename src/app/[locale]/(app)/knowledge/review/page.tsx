import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasRole } from '@/lib/authorization/service'
import { getKnowledgeReviewQueue } from '@/lib/knowledge/review-queue'

type KnowledgeReviewPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function KnowledgeReviewPage({
  params,
}: KnowledgeReviewPageProps) {
  const { locale } = await params

  const t = await getTranslations({
    locale,
    namespace: 'knowledge.review',
  })

  const canReview =
    (await hasRole('knowledge_reviewer')) ||
    (await hasRole('super_admin'))

  if (!canReview) {
    notFound()
  }

  const items = await getKnowledgeReviewQueue()

  return (
    <div className="p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {t('title')}
        </h1>

        <p className="mt-2 text-neutral-600">
          {t('description')}
        </p>
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
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.knowledge_item_version_id}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
                      {item.item_type}
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-neutral-900">
                      <Link
                        href={`/${locale}/knowledge/review/${item.knowledge_item_version_id}`}
                        className="hover:text-primary-700 hover:underline"
                      >
                        {item.title}
                      </Link>
                    </h2>

                    {item.summary && (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {t('pending')}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-neutral-600 sm:grid-cols-3">
                  <div>
                    <span className="font-medium text-neutral-900">
                      {t('version')}
                    </span>{' '}
                    {item.version_number}
                  </div>

                  <div>
                    <span className="font-medium text-neutral-900">
                      {t('submitted')}
                    </span>{' '}
                    {new Date(
                      item.review_updated_at ?? item.created_at,
                    ).toLocaleDateString(locale)}
                  </div>

                  <div>
                    <span className="font-medium text-neutral-900">
                      {t('author')}
                    </span>{' '}
                    <span className="font-mono text-xs">
                      {item.created_by.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
