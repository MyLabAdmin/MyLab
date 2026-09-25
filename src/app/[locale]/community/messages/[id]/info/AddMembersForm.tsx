'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addConversationMember,
  searchGroupMembers,
} from '@/app/[locale]/actions/messaging'
import Avatar from '@/components/community/Avatar'

type UserResult = {
  id: string
  display_name: string | null
  avatar_url: string | null
}

type Props = {
  conversationId: string
  locale: string
}

export default function AddMembersForm({
  conversationId,
  locale,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [addedUserId, setAddedUserId] = useState<string | null>(null)

  const isArabic = locale === 'ar'

  useEffect(() => {
    const cleanSearch = search.trim()

    if (cleanSearch.length < 2) {
      setUsers([])
      setSearching(false)
      return
    }

    let cancelled = false

    const timer = window.setTimeout(async () => {
      setSearching(true)
      setError(null)

      const result = await searchGroupMembers(
        conversationId,
        cleanSearch,
      )

      if (cancelled) return

      setSearching(false)

      if (!result.success) {
        setError(result.error)
        setUsers([])
        return
      }

      setUsers(result.users)
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [conversationId, search])

  function handleAdd(userId: string) {
    setError(null)
    setAddedUserId(null)

    startTransition(async () => {
      const result = await addConversationMember(
        conversationId,
        userId,
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      setAddedUserId(userId)
      setUsers((current) =>
        current.filter((user) => user.id !== userId),
      )
      router.refresh()
    })
  }

  return (
    <section className='mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4'>
      <div className='mb-4'>
        <h2 className='font-semibold text-gray-900'>
          {isArabic ? 'إضافة أعضاء' : 'Add members'}
        </h2>
        <p className='mt-1 text-xs text-gray-500'>
          {isArabic
            ? 'ابحث عن أحد أصدقائك لإضافته إلى المجموعة.'
            : 'Search your friends to add to the group.'}
        </p>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={
          isArabic ? 'ابحث بالاسم...' : 'Search friends by name...'
        }
        maxLength={100}
        className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
      />

      {search.trim().length > 0 && search.trim().length < 2 ? (
        <p className='mt-2 text-xs text-gray-500'>
          {isArabic
            ? 'اكتب حرفين على الأقل.'
            : 'Enter at least 2 characters.'}
        </p>
      ) : null}

      {searching ? (
        <p className='mt-3 text-sm text-gray-500'>
          {isArabic ? 'جارٍ البحث...' : 'Searching...'}
        </p>
      ) : null}

      {error ? (
        <p className='mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      ) : null}

      {addedUserId ? (
        <p className='mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700'>
          {isArabic ? 'تمت إضافة العضو.' : 'Member added.'}
        </p>
      ) : null}

      {!searching && search.trim().length >= 2 && users.length === 0 && !error ? (
        <p className='mt-3 text-sm text-gray-500'>
          {isArabic ? 'لم يتم العثور على أصدقاء.' : 'No friends found.'}
        </p>
      ) : null}

      {users.length > 0 ? (
        <div className='mt-3 space-y-2'>
          {users.map((user) => {
            const name =
              user.display_name ||
              (isArabic ? 'مستخدم' : 'User')

            return (
              <div
                key={user.id}
                className='flex items-center gap-3 rounded-xl bg-white p-3'
              >
                <Avatar
                  name={name}
                  avatarUrl={user.avatar_url}
                  size='lg'
                />

                <p className='min-w-0 flex-1 truncate text-sm font-medium text-gray-900'>
                  {name}
                </p>

                <button
                  type='button'
                  onClick={() => handleAdd(user.id)}
                  disabled={isPending}
                  className='shrink-0 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {isPending
                    ? isArabic
                      ? 'جارٍ...'
                      : 'Adding...'
                    : isArabic
                      ? 'إضافة'
                      : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
