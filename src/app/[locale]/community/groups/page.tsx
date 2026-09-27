import { getGroups } from '@/app/[locale]/actions/groups'
import GroupsBrowser from './GroupsBrowser'
import { Link } from '@/i18n/navigation'

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const groups = await getGroups()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-primary-700">
          {locale === 'ar' ? 'المجموعات' : 'Groups'}
        </h1>

        <Link
          href="/community/groups/new"
          className="btn-primary w-auto shrink-0 px-3 py-1.5 text-sm"
        >
          {locale === 'ar' ? '+ مجموعة جديدة' : '+ New Group'}
        </Link>
      </div>

      <GroupsBrowser groups={groups} locale={locale} />
    </main>
  )
}
