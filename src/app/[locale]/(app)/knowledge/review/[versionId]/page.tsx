import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { hasRole } from '@/lib/authorization/service'
import { getKnowledgeReviewDetail } from '@/lib/knowledge/review-detail'

type KnowledgeReviewDetailPageProps = {
  params: Promise<{
    locale: string
    versionId: string
  }>
}

export default async function KnowledgeReviewDetailPage({
  params,
}: KnowledgeReviewDetailPageProps) {
  const { locale, versionId } = await params

  const t = await getTranslations({
    locale,
    namespace: 'knowledge.reviewDetail',
  })

  const canReview =
    (await hasRole('knowledge_reviewer')) ||
    (await hasRole('super_admin'))

  if (!canReview) {
    notFound()
  }

  const detail = await getKnowledgeReviewDetail(versionId)

  return (
    <div className="space-y-8 p-6">
      <header className="space-y-3">
        <Link
          href={`/${locale}/knowledge/review`}
          className="text-sm font-medium text-primary-700 hover:underline"
        >
          ← {t('backToQueue')}
        </Link>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
            {detail.item_type}
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-neutral-900">
            {detail.title}
          </h1>

          {detail.subtitle && (
            <p className="mt-2 text-base text-neutral-600">
              {detail.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
          <span>
            <strong className="text-neutral-900">
              {t('version')}:
            </strong>{' '}
            {detail.version_number}
          </span>

          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            {t('pending')}
          </span>
        </div>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('overview')}
        </h2>

        {detail.summary && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('summary')}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {detail.summary}
            </p>
          </div>
        )}

        {detail.content && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('content')}
            </h3>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {detail.content}
            </div>
          </div>
        )}

        {detail.pre_test_preparation && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('preTestPreparation')}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {detail.pre_test_preparation}
            </p>
          </div>
        )}
      </section>

      {detail.item_type === 'laboratory_test' && (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('laboratoryTest')}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {t('testCode')}
                </p>
                <p className="mt-1 font-mono text-sm text-neutral-900">
                  {detail.test_code ?? '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {t('loincCode')}
                </p>
                <p className="mt-1 font-mono text-sm text-neutral-900">
                  {detail.loinc_code ?? '—'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('specimens')}
            </h2>

            {detail.specimens.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                {t('none')}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {detail.specimens.map((specimen, index) => (
                  <article
                    key={`${specimen.specimen_type}-${index}`}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <p className="font-medium text-neutral-900">
                      {specimen.specimen_type}
                    </p>

                    {specimen.container && (
                      <p className="mt-2 text-sm text-neutral-600">
                        <strong>{t('container')}:</strong>{' '}
                        {specimen.container}
                      </p>
                    )}

                    {specimen.handling_instructions && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                        <strong>{t('handling')}:</strong>{' '}
                        {specimen.handling_instructions}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('methods')}
            </h2>

            {detail.methods.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                {t('none')}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {detail.methods.map((method, index) => (
                  <article
                    key={`${method.method_name}-${index}`}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <p className="font-medium text-neutral-900">
                      {method.method_name}
                    </p>

                    {method.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                        {method.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('interpretations')}
            </h2>

            {detail.interpretations.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                {t('none')}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {detail.interpretations.map((item, index) => (
                  <article
                    key={`${item.condition}-${index}`}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <p className="font-medium text-neutral-900">
                      {item.condition}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                      {item.interpretation}
                    </p>

                    {item.clinical_significance && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                        <strong>{t('clinicalSignificance')}:</strong>{' '}
                        {item.clinical_significance}
                      </p>
                    )}

                    {item.notes && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                        <strong>{t('notes')}:</strong>{' '}
                        {item.notes}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('referenceRanges')}
            </h2>

            {detail.reference_ranges.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                {t('none')}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {detail.reference_ranges.map((range, index) => (
                  <article
                    key={`${range.population_label ?? 'range'}-${index}`}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {t('population')}
                        </p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {range.population_label ?? '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {t('sex')}
                        </p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {range.sex ?? '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {t('range')}
                        </p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {range.lower_value} – {range.upper_value}{' '}
                          {range.unit ?? ''}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {t('age')}
                        </p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {range.age_min ?? '—'} – {range.age_max ?? '—'}{' '}
                          {range.age_unit ?? ''}
                        </p>
                      </div>

                      {range.specimen_type && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            {t('specimen')}
                          </p>
                          <p className="mt-1 text-sm text-neutral-900">
                            {range.specimen_type}
                          </p>
                        </div>
                      )}

                      {range.method_name && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            {t('method')}
                          </p>
                          <p className="mt-1 text-sm text-neutral-900">
                            {range.method_name}
                          </p>
                        </div>
                      )}
                    </div>

                    {range.notes && (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                        <strong>{t('notes')}:</strong>{' '}
                        {range.notes}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
