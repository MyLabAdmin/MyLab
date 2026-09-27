'use client'

import { useState } from 'react'

import GroupManagementMenu from './GroupManagementMenu'
import GroupManagementPanels from './GroupManagementPanels'

type Panel = 'members' | 'requests' | 'moderators' | 'transfer' | null

export default function GroupManagementShell({
  groupId,
  locale,
  isOwner,
  canAddMembers,
  canRemoveMembers,
  canManageJoinRequests,
  canManageModerators,
  canTransferOwnership,
}: {
  groupId: string
  locale: string
  isOwner: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canManageJoinRequests: boolean
  canManageModerators: boolean
  canTransferOwnership: boolean
}) {
  const [panel, setPanel] = useState<Panel>(null)

  return (
    <>
      <GroupManagementMenu
        locale={locale}
        isOwner={isOwner}
        canEditGroup={true}
        canAddMembers={canAddMembers}
        canManageJoinRequests={canManageJoinRequests}
        canManageModerators={canManageModerators}
        canTransferOwnership={canTransferOwnership}
        onSelectPanel={setPanel}
      />

      <GroupManagementPanels
        groupId={groupId}
        locale={locale}
        panel={panel}
        canRemoveMembers={canRemoveMembers}
        canManageJoinRequests={canManageJoinRequests}
        canManageModerators={canManageModerators}
        canTransferOwnership={canTransferOwnership}
        onClose={() => setPanel(null)}
      />
    </>
  )
}
