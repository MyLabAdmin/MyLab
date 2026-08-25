import { getTranslations } from 'next-intl/server'

type DashboardPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function DashboardPage({
  params,
}: DashboardPageProps) {
  const { locale } = await params

  const t = await getTranslations({
    locale,
    namespace: 'dashboard',
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        {t('title')}
      </h1>

      <p className="mt-2 text-neutral-600">
        {t('welcome')}
      </p>
    </div>
  )
}
