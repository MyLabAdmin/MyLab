'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import {
  createGroupConversation,
  getOrCreateDirectConversation,
} from '@/app/[locale]/actions/messaging'

type Friend = {
  id: string
  user_id: string
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

type ConversationType = 'direct' | 'group'

export default function NewConversationForm({
  locale,
  initialType,
  friends,
  embedded = false,
  onClose,
}: {
  locale: string
  initialType: ConversationType
  friends: Friend[]
  embedded?: boolean
  onClose?: () => void
}) {
  const router = useRouter()
  const isArabic = locale === 'ar'

  const [type, setType] =
    useState<ConversationType>(initialType)
  const [selectedFriendIds, setSelectedFriendIds] =
    useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleFriend(userId: string) {
    setSelectedFriendIds((current) => {
      if (type === 'direct') {
        return current.includes(userId) ? [] : [userId]
      }

      return current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    })
  }

  function changeType(nextType: ConversationType) {
    setType(nextType)
    setSelectedFriendIds([])
    setSearch('')
    setError(null)
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError(null)

    if (type === 'direct') {
      if (selectedFriendIds.length !== 1) {
        setError(
          isArabic
            ? 'اختر صديقًا واحدًا'
            : 'Choose one friend',
        )
        return
      }
    } else {
      if (!title.trim()) {
        setError(
          isArabic
            ? 'اكتب اسم المجموعة'
            : 'Enter a group name',
        )
        return
      }

      if (selectedFriendIds.length === 0) {
        setError(
          isArabic
            ? 'اختر صديقًا واحدًا على الأقل'
            : 'Choose at least one friend',
        )
        return
      }
    }

    setSubmitting(true)

    try {
      if (type === 'direct') {
        const result =
          await getOrCreateDirectConversation(
            selectedFriendIds[0],
          )

        if (!result.success) {
          setError(result.error)
          return
        }

        onClose?.()
        router.push(
          '/community/messages/' +
            result.conversation.id,
        )
        return
      }

      const result = await createGroupConversation(
        title,
        description,
        selectedFriendIds,
      )

      if (!result.success) {
        setError(
          result.error === 'GROUP_TITLE_ALREADY_EXISTS'
            ? isArabic
              ? 'اسم المجموعة مستخدم بالفعل، اختر اسمًا آخر.'
              : 'A group with this name already exists. Please choose another name.'
            : result.error,
        )
        return
      }

      onClose?.()
      router.push(
        '/community/messages/' +
          result.conversation.id,
      )
    } catch {
      setError(
        isArabic
          ? 'حدث خطأ غير متوقع'
          : 'Something went wrong',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={embedded ? 'p-4 sm:p-5' : ''}
    >
      {!embedded && (
        <header className="mb-5 flex items-center gap-3 sm:mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary-700 sm:text-2xl">
              {isArabic
                ? 'محادثة جديدة'
                : 'New conversation'}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {isArabic
                ? 'ابدأ محادثة مع أصدقائك'
                : 'Start a conversation with your friends'}
            </p>
          </div>
        </header>
      )}

      <form
        onSubmit={handleSubmit}
        className={
          embedded
            ? 'rounded-2xl border border-gray-100 bg-gray-50 p-3 shadow-none sm:p-4'
            : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6'
        }
      >
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => changeType('direct')}
            className={
              type === 'direct'
                ? 'rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-primary-700 shadow-sm'
                : 'rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500'
            }
          >
            {isArabic ? 'مباشرة' : 'Direct'}
          </button>

          <button
            type="button"
            onClick={() => changeType('group')}
            className={
              type === 'group'
                ? 'rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-primary-700 shadow-sm'
                : 'rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500'
            }
          >
            {isArabic ? 'مجموعة' : 'Group'}
          </button>
        </div>

        {type === 'group' && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {isArabic ? 'اسم المجموعة' : 'Group name'}
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder={
                  isArabic
                    ? 'مثال: فريق العمل'
                    : 'Example: Work team'
                }
                maxLength={120}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {isArabic ? 'وصف المجموعة' : 'Group description'}
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder={
                  isArabic
                    ? 'اكتب وصفًا مختصرًا للمجموعة'
                    : 'Write a short description for the group'
                }
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white"
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-gray-700">
              {type === 'direct'
                ? isArabic
                  ? 'اختر صديقًا'
                  : 'Choose a friend'
                : isArabic
                  ? 'اختر الأصدقاء'
                  : 'Choose friends'}
            </label>

            {type === 'group' &&
              selectedFriendIds.length > 0 && (
                <span className="text-xs font-medium text-primary-600">
                  {selectedFriendIds.length}{' '}
                  {isArabic ? 'محدد' : 'selected'}
                </span>
              )}
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              isArabic
                ? 'ابحث عن صديق...'
                : 'Search for a friend...'
            }
            aria-label={
              isArabic
                ? 'البحث عن صديق'
                : 'Search for a friend'
            }
            className="mb-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white"
          />

          {friends.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">
                {isArabic
                  ? 'ليس لديك أصدقاء مقبولون بعد'
                  : 'You do not have any accepted friends yet'}
              </p>
            </div>
          ) : (
            (() => {
              const normalizedSearch = search.trim().toLowerCase()
              const filteredFriends = friends.filter((friend) => {
                const name =
                  friend.profile.display_name ||
                  (isArabic ? 'مستخدم' : 'User')

                return name
                  .toLowerCase()
                  .includes(normalizedSearch)
              })

              if (filteredFriends.length === 0) {
                return (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-500">
                      {isArabic
                        ? 'لا يوجد صديق بهذا الاسم'
                        : 'No friend found with this name'}
                    </p>
                  </div>
                )
              }

              return (
                <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {filteredFriends.map((friend) => {
                      const selected =
                        selectedFriendIds.includes(
                          friend.user_id,
                        )

                      const name =
                        friend.profile.display_name ||
                        (isArabic ? 'مستخدم' : 'User')

                      return (
                        <button
                          key={friend.user_id}
                          type="button"
                          onClick={() =>
                            toggleFriend(friend.user_id)
                          }
                          className={[
                            'flex w-full items-center gap-3 p-3 text-start transition-colors',
                            selected
                              ? 'bg-primary-50'
                              : 'hover:bg-gray-50',
                          ].join(' ')}
                        >
                          {friend.profile.avatar_url ? (
                            <img
                              src={friend.profile.avatar_url}
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                            {name}
                          </span>

                          <span
                            className={[
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs',
                              selected
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : 'border-gray-300 text-transparent',
                            ].join(' ')}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting || friends.length === 0
          }
          className="mt-5 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? isArabic
              ? 'جارٍ الإنشاء...'
              : 'Creating...'
            : type === 'direct'
              ? isArabic
                ? 'بدء المحادثة'
                : 'Start conversation'
              : isArabic
                ? 'إنشاء المجموعة'
                : 'Create group'}
        </button>
      </form>
    </div>
  )
}
