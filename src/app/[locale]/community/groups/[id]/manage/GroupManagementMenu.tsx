'use client'

import { useState } from 'react'

type Panel = 'members' | 'requests' | 'moderators' | 'transfer'

export default function GroupManagementMenu({
  locale,
  isOwner,
  canEditGroup,
  canAddMembers,
  canManageJoinRequests,
  canManageModerators,
  canTransferOwnership,
  onSelectPanel,
}: {
  locale: string
  isOwner: boolean
  canEditGroup: boolean
  canAddMembers: boolean
  canManageJoinRequests: boolean
  canManageModerators: boolean
  canTransferOwnership: boolean
  onSelectPanel: (panel: Panel) => void
}) {
  const [open, setOpen] = useState(false)

  const actions = [
    canEditGroup
      ? {
          key: 'edit',
          label:
            locale === 'ar'
              ? 'تعديل معلومات المجموعة'
              : 'Edit group information',
          onClick: () => {
            setOpen(false)
            window.dispatchEvent(new Event('group-edit-request'))
          },
        }
      : null,

    canAddMembers
      ? {
          key: 'members',
          label: locale === 'ar' ? 'إدارة الأعضاء' : 'Manage members',
          onClick: () => {
            setOpen(false)
            onSelectPanel('members')
          },
        }
      : null,

    canManageJoinRequests
      ? {
          key: 'requests',
          label:
            locale === 'ar'
              ? 'طلبات الانضمام'
              : 'Join requests',
          onClick: () => {
            setOpen(false)
            onSelectPanel('requests')
          },
        }
      : null,

    canManageModerators
      ? {
          key: 'moderators',
          label:
            locale === 'ar'
              ? 'إدارة المشرفين'
              : 'Manage moderators',
          onClick: () => {
            setOpen(false)
            onSelectPanel('moderators')
          },
        }
      : null,

    canTransferOwnership
      ? {
          key: 'transfer',
          label:
            locale === 'ar'
              ? 'نقل الملكية'
              : 'Transfer ownership',
          onClick: () => {
            setOpen(false)
            onSelectPanel('transfer')
          },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    onClick: () => void
  }>

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={
            locale === 'ar'
              ? 'إغلاق الإعدادات'
              : 'Close settings'
          }
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4"
      >
        {open && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="font-bold text-gray-800">
                  {locale === 'ar'
                    ? 'إعدادات المجموعة'
                    : 'Group settings'}
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  {locale === 'ar'
                    ? 'إدارة المجموعة حسب صلاحياتك'
                    : 'Manage the group based on your permissions'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-start text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>{action.label}</span>
                  <span className="text-gray-400">›</span>
                </button>
              ))}

              {isOwner && (
                <div className="px-4 py-3 text-xs text-gray-400">
                  {locale === 'ar'
                    ? 'أنت مالك المجموعة.'
                    : 'You are the group owner.'}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={
            locale === 'ar'
              ? 'إعدادات المجموعة'
              : 'Group settings'
          }
          aria-expanded={open}
          className="ms-auto flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-lg transition hover:bg-gray-50"
        >
          {open ? '×' : '⚙'}
        </button>
      </div>
    </>
  )
}
