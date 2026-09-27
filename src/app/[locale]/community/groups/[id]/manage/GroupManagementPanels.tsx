'use client'

import GroupMembersPanel from '../GroupMembersPanel'
import PendingMembersPanel from '../PendingMembersPanel'
import ModeratorManagementPanel from '../ModeratorManagementPanel'
import TransferOwnershipForm from './TransferOwnershipForm'

type Panel = 'members' | 'requests' | 'moderators' | 'transfer' | null

export default function GroupManagementPanels({
  groupId,
  locale,
  panel,
  canRemoveMembers,
  canManageJoinRequests,
  canManageModerators,
  canTransferOwnership,
  onClose,
}: {
  groupId: string
  locale: string
  panel: Panel
  canRemoveMembers: boolean
  canManageJoinRequests: boolean
  canManageModerators: boolean
  canTransferOwnership: boolean
  onClose: () => void
}) {
  if (panel === 'members' && canRemoveMembers) {
    return (
      <GroupMembersPanel
        groupId={groupId}
        locale={locale}
        canRemoveMembers={canRemoveMembers}
        onClose={onClose}
      />
    )
  }

  if (panel === 'requests' && canManageJoinRequests) {
    return (
      <PendingMembersPanel
        groupId={groupId}
        onClose={onClose}
      />
    )
  }

  if (panel === 'moderators' && canManageModerators) {
    return (
      <ModeratorManagementPanel
        groupId={groupId}
        locale={locale}
        onClose={onClose}
      />
    )
  }

  if (panel === 'transfer' && canTransferOwnership) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === 'ar' ? 'نقل ملكية المجموعة' : 'Transfer ownership'}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              className="rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <TransferOwnershipForm
            groupId={groupId}
            locale={locale}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  return null
}
