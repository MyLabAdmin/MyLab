import { getConversation } from '@/app/[locale]/actions/messaging'
import Avatar from '@/components/community/Avatar'
import { Link } from '@/i18n/navigation'
import LeaveConversationButton from './LeaveConversationButton'
import GroupMemberActions from './GroupMemberActions'
import GroupManagementMenu from './GroupManagementMenu'
import ModeratorPermissionsForm from './ModeratorPermissionsForm'

export default async function GroupConversationInfoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const result = await getConversation(id)

  if (result.success === false) {
    return (
      <main className='min-h-screen bg-gray-50 p-4 sm:p-6'>
        <div className='mx-auto max-w-2xl rounded-3xl bg-red-50 p-6 text-red-700'>
          {result.error}
        </div>
      </main>
    )
  }

  const conversation = result.conversation

  if (conversation.type !== 'group') {
    return (
      <main className='min-h-screen bg-gray-50 p-4 sm:p-6'>
        <div className='mx-auto max-w-2xl rounded-3xl bg-white p-6 text-center shadow-sm'>
          <p className='mb-4 text-gray-700'>{locale === 'ar' ? 'هذه الصفحة للمحادثات الجماعية فقط.' : 'This page is only for group conversations.'}</p>
          <Link href={'/community/messages/' + id} className='font-medium text-primary-600'>{locale === 'ar' ? 'العودة للمحادثة' : 'Back to conversation'}</Link>
        </div>
      </main>
    )
  }

  const members = conversation.conversation_members
  const currentMember = members.find(
    (member) => member.user_id === result.currentUserId,
  )
  const isOwner =
    result.currentUserId === conversation.created_by

  const canEditInfo =
    isOwner ||
    (currentMember?.role === 'moderator' && currentMember.can_edit_info)

  const canTransferOwnership = isOwner

  const canAddMembers =
    isOwner ||
    (currentMember?.role === 'moderator' && currentMember.can_add_members)

  const canRemoveMembers =
    isOwner ||
    (currentMember?.role === 'moderator' && currentMember.can_remove_members)

  const title = conversation.title || (locale === 'ar' ? 'محادثة جماعية' : 'Group conversation')
  const description = conversation.description?.trim() || null
  const owner = members.find((member) => member.user_id === conversation.created_by)

  return (
    <main className='min-h-screen bg-gray-50 px-3 py-4 sm:p-6'>
      <div className='mx-auto max-w-2xl space-y-4'>
        <header className='rounded-3xl bg-white p-5 shadow-sm sm:p-6'>
          <div className='flex items-center gap-4'>
            <Link href={'/community/messages/' + id} className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 text-xl text-gray-700 transition hover:bg-gray-100' aria-label={locale === 'ar' ? 'العودة للمحادثة' : 'Back to conversation'}>
              <span dir='ltr' aria-hidden='true'>←</span>
            </Link>
            <div className='min-w-0 flex-1'>
              <h1 className='truncate text-xl font-bold text-gray-900 sm:text-2xl'>{title}</h1>
              <p className='mt-1 text-sm text-gray-500'>{members.length} {locale === 'ar' ? 'أعضاء' : 'members'}</p>
            </div>
          </div>

          <div className='mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
            <div className='shrink-0'>
              <Avatar name={title} size='lg' />
            </div>
            <div className='min-w-0'>
              <h2 className='font-semibold text-gray-900'>{title}</h2>
              {description ? <p className='mt-1 text-sm leading-6 text-gray-600'>{description}</p> : null}
            </div>
          </div>


          {owner ? (
            <div className='mt-4 flex items-center gap-3 rounded-2xl bg-primary-50 p-4'>
              <Avatar name={owner.display_name || (locale === 'ar' ? 'المالك' : 'Owner')} avatarUrl={owner.avatar_url} size='lg' />
              <div className='min-w-0'>
                <p className='text-xs font-medium text-primary-700'>{locale === 'ar' ? 'مالك المجموعة' : 'Group owner'}</p>
                <p className='mt-1 truncate font-semibold text-gray-900'>{owner.display_name || (locale === 'ar' ? 'مستخدم' : 'User')}</p>
              </div>
            </div>
          ) : null}

          <GroupManagementMenu
            conversationId={id}
            locale={locale}
            currentUserId={result.currentUserId}
            members={members}
            initialTitle={title}
            initialDescription={description ?? ''}
            canEditInfo={canEditInfo}
            canAddMembers={canAddMembers}
            canTransferOwnership={canTransferOwnership}
          />

          <div className='mt-5'>
            <LeaveConversationButton conversationId={id} locale={locale} isOwner={result.currentUserId === conversation.created_by} />
          </div>
        </header>

        <section className='rounded-3xl bg-white p-4 shadow-sm sm:p-5'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>{locale === 'ar' ? 'أعضاء المجموعة' : 'Group members'}</h2>

            </div>
            <span className='shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600'>{members.length}</span>
          </div>

          <div className='max-h-[32rem] space-y-2 overflow-y-auto pr-1'>
            {members.map((member) => {
              const name = member.display_name || (locale === 'ar' ? 'مستخدم' : 'User')
              const roleLabel = member.role === 'owner'
                ? (locale === 'ar' ? 'مالك المجموعة' : 'Owner')
                : member.role === 'moderator'
                  ? (locale === 'ar' ? 'مشرف' : 'Moderator')
                  : (locale === 'ar' ? 'عضو' : 'Member')

              return (
                <div key={member.user_id}>
                  <Link href={'/community/profile/' + member.user_id} className='group flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition hover:bg-gray-100 active:scale-[0.99]'>
                    <Avatar name={name} avatarUrl={member.avatar_url} size='lg' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium text-gray-900 group-hover:text-primary-700'>{name}</p>
                      <p className='mt-1 text-xs text-gray-500'>{roleLabel}</p>
                    </div>
                    <span className='text-gray-300' aria-hidden='true'>›</span>
                  </Link>

                  {canRemoveMembers &&
                  member.user_id !== conversation.created_by ? (
                    <>
                      <GroupMemberActions
                        conversationId={id}
                        memberId={member.user_id}
                        isModerator={member.role === 'moderator'}
                        locale={locale}
                        canManageModerators={isOwner}
                      />

                      {isOwner && member.role === 'moderator' ? (
                        <ModeratorPermissionsForm
                          conversationId={id}
                          memberId={member.user_id}
                          initialPermissions={{
                            canEditInfo: member.can_edit_info,
                            canAddMembers: member.can_add_members,
                            canRemoveMembers: member.can_remove_members,
                          }}
                          locale={locale}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
