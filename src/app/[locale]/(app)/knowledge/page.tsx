import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { KnowledgeCard } from '@/components/knowledge/KnowledgeCard'
import { KnowledgeGrid } from '@/components/knowledge/KnowledgeGrid'
import { getKnowledgeDiscovery } from '@/lib/knowledge/discovery'
import {
  getKnowledgeTypeConfig,
  KNOWLEDGE_TYPE_CONFIG,
} from '@/lib/knowledge/type-config'
import {
  KNOWLEDGE_LOCALES,
  type KnowledgeLocale,
} from '@/lib/knowledge/types'
import { Link } from '@/i18n/navigation'

type KnowledgePageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function KnowledgePage({
  params,
}: KnowledgePageProps) {
  const { locale } = await params

  if (!KNOWLEDGE_LOCALES.includes(locale as KnowledgeLocale)) {
    notFound()
  }

  const knowledgeLocale = locale as KnowledgeLocale
  const t = await getTranslations({
    locale: knowledgeLocale,
    namespace: 'knowledge',
  })

  const discovery = await getKnowledgeDiscovery({
    locale: knowledgeLocale,
    page: 1,
    pageSize: 24,
  })

  const typeLabels = Object.fromEntries(
    Object.entries(KNOWLEDGE_TYPE_CONFIG).map(([type, config]) => [
      type,
      t(config.labelKey),
    ]),
  )

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('title')}
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              {t('title')}
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t('description')}
            </p>
          </div>

          <Link
            href="/knowledge/new"
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('create')}
          </Link>
        </div>

        {discovery.total > 0 ? (
          <p className="text-sm text-muted-foreground">
            {discovery.total} {t('results')}
          </p>
        ) : null}
      </header>

      {discovery.items.length === 0 ? (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="text-lg font-semibold">
            {t('emptyTitle')}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {t('emptyDescription')}
          </p>
        </section>
      ) : (
        <KnowledgeGrid>
          {discovery.items.map((item) => {
            const config = getKnowledgeTypeConfig(item.item_type)

            return (
              <KnowledgeCard
                key={item.id}
                item={item}
                typeLabel={typeLabels[item.item_type] ?? config.type}
                accessLabel={
                  item.access_tier
                    ? t(`access.${item.access_tier}`)
                    : null
                }
              />
            )
          })}
        </KnowledgeGrid>
      )}
    </main>
  )
}
