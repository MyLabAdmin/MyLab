'use client'

import { useMemo, useState, useTransition } from 'react'
import Avatar from '@/components/community/Avatar'
import { Link } from '@/i18n/navigation'
import {
  acceptFriendRequest,
  blockUser,
  followUser,
  unfollowUser,
  cancelFriendRequest,
  hidePersonFromDiscovery,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockUser,
  type BlockedUser,
  type FriendProfile,
  type FriendRelationship,
} from '@/app/[locale]/actions/friends'

type FriendItem = {
  friendshipId: string | null
  userId: string
  profile: FriendProfile
  relationship: FriendRelationship
  following: boolean
}

type Props = {
  people: FriendItem[]
  incoming: FriendItem[]
  sent: FriendItem[]
  friends: FriendItem[]
  blockedUsers: BlockedUser[]
  locale: string
}

type Tab =
  | 'people'
  | 'friends'
  | 'incoming'
  | 'sent'
  | 'blocked'

export default function FriendsBrowser({
  people,
  incoming,
  sent,
  friends,
  blockedUsers,
  locale,
}: Props) {
  const [tab, setTab] = useState<Tab>('people')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const t = (ar: string, en: string) =>
    locale === 'ar' ? ar : en

  const currentItems = useMemo(() => {
    if (tab === 'friends') return friends
    if (tab === 'incoming') return incoming
    if (tab === 'sent') return sent

    if (tab === 'blocked') {
      return []
    }

    const query = search.trim().toLowerCase()

    if (!query) return people

    return people.filter((item) =>
      (item.profile.display_name ?? '')
        .toLowerCase()
        .includes(query),
    )
  }, [
    friends,
    incoming,
    people,
    search,
    sent,
    tab,
  ])

  const run = (
    action: () => Promise<{
      success: boolean
      error?: string
      cleanupFailed?: number
    }>,
  ) => {
    startTransition(async () => {
      const result = await action()

      if (!result.success) {
        window.alert(
          result.error === 'ALREADY_FRIENDS'
            ? t(
                'أنتم أصدقاء بالفعل',
                'You are already friends',
              )
            : result.error === 'REQUEST_ALREADY_SENT'
              ? t(
                  'تم إرسال الطلب بالفعل',
                  'The request was already sent',
                )
              : result.error === 'REQUEST_ALREADY_RECEIVED'
                ? t(
                    'لديك طلب صداقة وارد من هذا الشخص',
                    'You already have an incoming request from this person',
                  )
                : t(
                    'تعذر تنفيذ العملية',
                    'The action could not be completed',
                  ),
        )

        return
      }

      if (
        typeof result.cleanupFailed === 'number' &&
        result.cleanupFailed > 0
      ) {
        window.alert(
          t(
            'تم الحظر، لكن تعذر حذف بعض ملفات الوسائط القديمة.',
            'The user was blocked, but some old media files could not be deleted.',
          ),
        )
      }

      window.location.reload()
    })
  }

  const renderBlockButton = (
    item: FriendItem,
    primary = false,
  ) => (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          t(
            'هل تريد حظر هذا الشخص؟ سيتم حذف علاقة الصداقة والمحادثة المباشرة ولن يتمكن الطرفان من التواصل مباشرة.',
            'Block this person? Your friendship and direct conversation will be removed and direct communication will be disabled.',
          ),
        )

        if (!confirmed) return

        run(() => blockUser(item.userId))
      }}
      className={
        primary
          ? 'w-32 rounded-lg border border-red-600 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50'
          : 'btn-secondary w-auto shrink-0 px-3 py-1.5 text-xs'
      }
    >
      {t('حظر', 'Block')}
    </button>
  )

  const renderAction = (item: FriendItem) => {
    const friendshipId = item.friendshipId

    const followButton = (
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(() =>
            item.following
              ? unfollowUser(item.userId)
              : followUser(item.userId),
          )
        }
        className={
          item.following
            ? 'btn-secondary w-32 shrink-0 px-3 py-1.5 text-xs'
            : 'w-32 shrink-0 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50'
        }
      >
        {item.following
          ? t('إلغاء المتابعة', 'Unfollow')
          : t('متابعة', 'Follow')}
      </button>
    )

    if (
      tab === 'friends' ||
      item.relationship === 'accepted'
    ) {
      if (!friendshipId) return null

      return (
        <div className="flex shrink-0 flex-wrap gap-2">
          {followButton}

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => removeFriend(friendshipId))
            }
            className="btn-secondary w-auto shrink-0 px-3 py-1.5 text-xs"
          >
            {t('إزالة', 'Remove')}
          </button>

          {renderBlockButton(item)}
        </div>
      )
    }

    if (item.relationship === 'sent') {
      if (!friendshipId) return null

      return (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => cancelFriendRequest(friendshipId))
            }
            className="btn-secondary w-auto shrink-0 px-3 py-1.5 text-xs"
          >
            {t('إلغاء الطلب', 'Cancel request')}
          </button>

          {renderBlockButton(item)}
        </div>
      )
    }

    if (item.relationship === 'received') {
      if (!friendshipId) return null

      return (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => acceptFriendRequest(friendshipId))
            }
            className="btn-primary w-auto px-3 py-1.5 text-xs"
          >
            {t('قبول', 'Accept')}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => rejectFriendRequest(friendshipId))
            }
            className="btn-secondary w-auto px-3 py-1.5 text-xs"
          >
            {t('رفض', 'Reject')}
          </button>

          {renderBlockButton(item)}
        </div>
      )
    }

    return (
      <div className="flex w-full min-w-0 overflow-x-auto overscroll-x-contain flex-nowrap justify-start gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() => sendFriendRequest(item.userId))
          }
          className="btn-primary w-32 px-3 py-1.5 text-xs"
        >
          {t('إضافة صديق', 'Add friend')}
        </button>

        {followButton}

        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() =>
              hidePersonFromDiscovery(item.userId),
            )
          }
          className="w-32 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
        >
          {t('تخطي', 'Skip')}
        </button>

      </div>
    )
  }

  const renderBlockedUsers = () => {
    if (blockedUsers.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-gray-500">
          {t(
            'لا توجد حسابات محظورة.',
            'No blocked users.',
          )}
        </div>
      )
    }

    return (
      <div className="divide-y divide-gray-100">
        {blockedUsers.map((item) => (
          <div
            key={item.userId}
            className="flex flex-col gap-3 p-3 sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-3">

              <Avatar
                name={item.display_name ?? '—'}
                avatarUrl={item.avatar_url}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-gray-900">
                  {item.display_name ??
                    t('مستخدم', 'User')}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {t('محظور', 'Blocked')}
                </p>
              </div>

            </div>

            <div className="flex w-full justify-center">
              <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const confirmed = window.confirm(
                  t(
                    'هل تريد إلغاء حظر هذا الشخص؟',
                    'Unblock this person?',
                  ),
                )

                if (!confirmed) return

                run(() => unblockUser(item.userId))
              }}
              className="w-32 shrink-0 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-xs font-medium text-green-600 transition hover:bg-green-50 disabled:opacity-50"
            >
              {t('إلغاء الحظر', 'Unblock')}
            </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-2">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <div className="flex min-w-max justify-center gap-2 pb-1">
            {(
              [
                ['people', t('الأشخاص', 'People')],
                ['friends', t('أصدقائي', 'My friends')],
                ['incoming', t('الواردة', 'Incoming')],
                ['sent', t('المرسلة', 'Sent')],
                ['blocked', t('المحظورون', 'Blocked')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={
                  tab === value
                    ? 'shrink-0 rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white'
                    : 'shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600'
                }
              >
                {label}

                {value === 'incoming' &&
                incoming.length > 0
                  ? ' (' + incoming.length + ')'
                  : null}

                {value === 'blocked' &&
                blockedUsers.length > 0
                  ? ' (' + blockedUsers.length + ')'
                  : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'people' ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={t(
              'ابحث عن شخص...',
              'Search people...',
            )}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400"
          />
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {tab === 'blocked' ? (
          renderBlockedUsers()
        ) : currentItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {tab === 'people'
              ? t(
                  'لا يوجد أشخاص مطابقون.',
                  'No people found.',
                )
              : tab === 'friends'
                ? t(
                    'لا يوجد أصدقاء بعد.',
                    'No friends yet.',
                  )
                : tab === 'incoming'
                  ? t(
                      'لا توجد طلبات واردة.',
                      'No incoming requests.',
                    )
                  : t(
                      'لا توجد طلبات مرسلة.',
                      'No sent requests.',
                    )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentItems.map((item) => (
              <div
                key={item.userId}
                className="flex flex-col gap-3 p-3 sm:p-4"
              >
                <Link
                  href={'/community/profile/' + item.userId}
                  className="flex min-w-0 items-center gap-3 rounded-xl outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Avatar
                    name={
                      item.profile.display_name ?? '—'
                    }
                    avatarUrl={item.profile.avatar_url}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-gray-900">
                      {item.profile.display_name ??
                        t('مستخدم', 'User')}
                    </p>

                    {item.relationship ===
                    'accepted' ? (
                      <p className="mt-0.5 text-xs text-green-600">
                        {t('صديق', 'Friend')}
                      </p>
                    ) : null}
                  </div>
                </Link>

                <div className="flex flex-wrap gap-2">
                  {renderAction(item)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
