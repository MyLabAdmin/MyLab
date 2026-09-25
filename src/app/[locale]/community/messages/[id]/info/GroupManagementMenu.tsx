'use client'

import { useEffect, useState } from 'react'
import GroupInfoForm from './GroupInfoForm'
import AddMembersForm from './AddMembersForm'
import TransferOwnershipForm from './TransferOwnershipForm'

type Member = {
  user_id: string
  role: string
  display_name: string | null
  avatar_url: string | null
}

type Props = {
  conversationId: string
  locale: string
  currentUserId: string
  members: Member[]
  initialTitle: string
  initialDescription: string
  canEditInfo: boolean
  canAddMembers: boolean
  canTransferOwnership: boolean
}

type Action = 'edit' | 'add' | 'transfer' | null

export default function GroupManagementMenu({
  conversationId,
  locale,
  currentUserId,
  members,
  initialTitle,
  initialDescription,
  canEditInfo,
  canAddMembers,
  canTransferOwnership,
}: Props) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<Action>(null)

  const isArabic = locale === 'ar'

  const hasActions =
    canEditInfo || canAddMembers || canTransferOwnership

  useEffect(() => {
    if (!open && action) {
      setAction(null)
    }
  }, [open, action])

  if (!hasActions) return null

  function openAction(nextAction: Exclude<Action, null>) {
    setAction(nextAction)
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
    setAction(null)
  }

  return (
    <>
      <div className='fixed inset-x-0 bottom-0 z-40 pointer-events-none'>
        <div className='mx-auto flex w-full max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8'>
          <button
            type='button'
            onClick={() => setOpen((current) => !current)}
            aria-label={isArabic ? 'إدارة المجموعة' : 'Manage group'}
            aria-expanded={open}
            className='pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-lg transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:h-14 sm:w-14'
          >
            <span aria-hidden='true'>⚙</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className='fixed inset-0 z-50'>
          <button
            type='button'
            aria-label={isArabic ? 'إغلاق القائمة' : 'Close menu'}
            onClick={closeMenu}
            className='absolute inset-0 bg-black/30 backdrop-blur-[1px] md:bg-black/10'
          />

          <div className='absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-gray-200 bg-white shadow-2xl md:inset-x-auto md:end-6 md:bottom-24 md:w-[min(24rem,calc(100vw-3rem))] md:max-h-[80vh] md:rounded-2xl'>
            <div className='mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300 md:hidden' />

            <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
              <div className='min-w-0'>
                <h2 className='truncate text-base font-bold text-gray-900'>
                  {isArabic ? 'إدارة المجموعة' : 'Group management'}
                </h2>
                <p className='mt-1 text-xs text-gray-500'>
                  {isArabic
                    ? 'اختر الإجراء الذي تريد تنفيذه.'
                    : 'Choose an action to continue.'}
                </p>
              </div>

              <button
                type='button'
                onClick={closeMenu}
                aria-label={isArabic ? 'إغلاق' : 'Close'}
                className='ms-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                ×
              </button>
            </div>

            {!action ? (
              <div className='space-y-2 p-4'>
                {canEditInfo ? (
                  <button
                    type='button'
                    onClick={() => openAction('edit')}
                    className='flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-start transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  >
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm'>
                      ✏️
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-semibold text-gray-900'>
                        {isArabic ? 'تعديل معلومات المجموعة' : 'Edit group info'}
                      </span>
                      <span className='mt-0.5 block text-xs text-gray-500'>
                        {isArabic
                          ? 'تعديل الاسم والوصف.'
                          : 'Update the group name and description.'}
                      </span>
                    </span>
                  </button>
                ) : null}

                {canAddMembers ? (
                  <button
                    type='button'
                    onClick={() => openAction('add')}
                    className='flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-start transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  >
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm'>
                      ➕
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-semibold text-gray-900'>
                        {isArabic ? 'إضافة أعضاء' : 'Add members'}
                      </span>
                      <span className='mt-0.5 block text-xs text-gray-500'>
                        {isArabic
                          ? 'ابحث عن أعضاء وأضفهم للمجموعة.'
                          : 'Search for users and add them.'}
                      </span>
                    </span>
                  </button>
                ) : null}

                {canTransferOwnership ? (
                  <button
                    type='button'
                    onClick={() => openAction('transfer')}
                    className='flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-start transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  >
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm'>
                      🔄
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-semibold text-gray-900'>
                        {isArabic ? 'نقل ملكية المجموعة' : 'Transfer ownership'}
                      </span>
                      <span className='mt-0.5 block text-xs text-gray-500'>
                        {isArabic
                          ? 'نقل الملكية إلى عضو آخر.'
                          : 'Transfer ownership to another member.'}
                      </span>
                    </span>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className='p-4'>
                <button
                  type='button'
                  onClick={() => setAction(null)}
                  className='mb-2 inline-flex items-center rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  {isArabic ? '← رجوع' : '← Back'}
                </button>

                {action === 'edit' ? (
                  <GroupInfoForm
                    conversationId={conversationId}
                    initialTitle={initialTitle}
                    initialDescription={initialDescription}
                    locale={locale}
                  />
                ) : null}

                {action === 'add' ? (
                  <AddMembersForm
                    conversationId={conversationId}
                    locale={locale}
                  />
                ) : null}

                {action === 'transfer' ? (
                  <TransferOwnershipForm
                    conversationId={conversationId}
                    locale={locale}
                    currentUserId={currentUserId}
                    members={members}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
