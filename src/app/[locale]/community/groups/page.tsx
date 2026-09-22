import { getGroups } from '@/app/[locale]/actions/groups'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const groups = await getGroups()

  const myGroups = groups.filter((g) => g.myStatus === 'active')
  const discoverGroups = groups.filter((g) => g.myStatus !== 'active')

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-primary-700">
          {locale === 'ar' ? 'المجموعات' : 'Groups'}
        </h1>
        <Link href="/community/groups/new" className="btn-primary w-auto px-4 text-sm">
          {locale === 'ar' ? '+ مجموعة جديدة' : '+ New Group'}
        </Link>
      </div>

      {myGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-500">
            {locale === 'ar' ? 'مجموعاتي' : 'My Groups'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myGroups.map((g) => (
              <Link
                key={g.id}
                href={`/community/groups/${g.id}`}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {g.coverUrl && <img src={g.coverUrl} alt="" className="w-full h-24 object-cover" />}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800">{g.name}</h3>
                  <p className="text-xs text-gray-500">
                    {g.memberCount} {locale === 'ar' ? 'عضو' : 'members'} · {g.privacy === 'private' ? (locale === 'ar' ? 'خاصة' : 'Private') : (locale === 'ar' ? 'عامة' : 'Public')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">
          {locale === 'ar' ? 'اكتشف مجموعات' : 'Discover Groups'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {discoverGroups.map((g) => (
            <Link
              key={g.id}
              href={`/community/groups/${g.id}`}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {g.coverUrl && <img src={g.coverUrl} alt="" className="w-full h-24 object-cover" />}
              <div className="p-3">
                <h3 className="font-semibold text-gray-800">{g.name}</h3>
                <p className="text-xs text-gray-500">
                  {g.memberCount} {locale === 'ar' ? 'عضو' : 'members'} · {g.privacy === 'private' ? (locale === 'ar' ? 'خاصة' : 'Private') : (locale === 'ar' ? 'عامة' : 'Public')}
                  {g.myStatus === 'pending' && ` · ${locale === 'ar' ? 'بانتظار الموافقة' : 'Pending approval'}`}
                </p>
              </div>
            </Link>
          ))}
          {discoverGroups.length === 0 && (
            <p className="text-gray-400 text-sm col-span-full text-center py-4">
              {locale === 'ar' ? 'لا توجد مجموعات بعد' : 'No groups yet'}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
