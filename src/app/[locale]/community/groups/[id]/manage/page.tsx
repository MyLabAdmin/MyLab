import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getGroupDetail } from '@/app/[locale]/actions/groups'
import GroupInfoForm from './GroupInfoForm'
import GroupManagementMembers from './GroupManagementMembers'
import GroupManagementShell from './GroupManagementShell'

export default async function GroupManagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const group = await getGroupDetail(id)

  if (!group) {
    redirect(`/${locale}/community/groups`)
  }

  const isManager =
    group.myStatus === 'active' &&
    (group.myRole === 'owner' || group.myRole === 'moderator')

  const canEditGroup =
    group.myRole === 'owner' ||
    group.moderatorPermissions?.canEditGroup === true

  if (!isManager || !canEditGroup) {
    redirect(`/${locale}/community/groups/${id}`)
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 pb-24 pt-3 sm:gap-5 sm:p-4 sm:pb-8">
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:items-center sm:p-4">
        <Link
          href={`/${locale}/community/groups/${id}`}
          className="shrink-0 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          {locale === 'ar' ? 'رجوع' : 'Back'}
        </Link>

        <div>
          <h1 className="text-xl font-bold text-primary-700">
            {locale === 'ar' ? 'إدارة المجموعة' : 'Manage Group'}
          </h1>

          <p className="text-sm text-gray-500">{group.name}</p>
        </div>
      </div>

      <GroupInfoForm
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          coverImageRef: group.coverImageRef,
          privacy: group.privacy,
          joinPolicy: group.joinPolicy,
        }}
        locale={locale}
      />

      <GroupManagementMembers
        groupId={group.id}
        locale={locale}
      />

      <GroupManagementShell
        groupId={group.id}
        locale={locale}
        isOwner={group.myRole === 'owner'}
        canAddMembers={
          group.myRole === 'owner' ||
          group.moderatorPermissions?.canAddMembers === true
        }
        canRemoveMembers={
          group.myRole === 'owner' ||
          group.moderatorPermissions?.canRemoveMembers === true
        }
        canManageJoinRequests={
          group.myRole === 'owner' ||
          group.moderatorPermissions?.canManageJoinRequests === true
        }
        canManageModerators={
          group.myRole === 'owner' ||
          group.moderatorPermissions?.canManageModerators === true
        }
        canTransferOwnership={group.myRole === 'owner'}
      />
    </main>
  )
}
