'use server'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/community/Avatar'
import ProfileAvatarUpload from '@/components/community/ProfileAvatarUpload'
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import { Link } from '@/i18n/navigation'
import { getOrCreateDirectConversation } from '@/app/[locale]/actions/messaging'
import { cancelFriendRequest, acceptFriendRequest, removeFriend, sendFriendRequest, getProfileFriendship } from '@/app/[locale]/actions/friends'
import ProfilePosts from './ProfilePosts'
import ProfilePersonalEdit from '@/components/community/ProfilePersonalEdit'
import ProfileEducationWorkEdit from '@/components/community/ProfileEducationWorkEdit'
import ProfileActionsMenu from '../ProfileActionsMenu'

type ProfileRecord = {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  country: string | null
  preferred_locale: string | null
  is_verified_professional: boolean
  created_at: string
  updated_at: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  city: string | null
  phone: string | null
  base_degree: string | null
  base_university: string | null
  base_graduation_year: number | null
}

async function startDirectMessage(formData: FormData) {
  'use server'

  const otherUserId = String(formData.get('otherUserId') ?? '')
  const locale = String(formData.get('locale') ?? 'en')

  const result = await getOrCreateDirectConversation(otherUserId)

  if (result.success && result.conversation?.id) {
    redirect('/' + locale + '/community/messages/' + result.conversation.id)
  }

  redirect('/' + locale + '/community/friends')
}

async function handleFriendshipAction(formData: FormData) {
  'use server'

  const action = String(formData.get('action') ?? '')
  const friendshipId = String(formData.get('friendshipId') ?? '')
  const userId = String(formData.get('userId') ?? '')

  if (action === 'send') {
    await sendFriendRequest(userId)
    return
  }

  if (!friendshipId) {
    return
  }

  if (action === 'cancel') {
    await cancelFriendRequest(friendshipId)
    return
  }

  if (action === 'accept') {
    await acceptFriendRequest(friendshipId)
    return
  }

  if (action === 'remove') {
    await removeFriend(friendshipId)
  }
}

function SectionIcon({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
      {children}
    </span>
  )
}

function PersonalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c.8-3.1 3-4.7 6.5-4.7s5.7 1.6 6.5 4.7" />
    </svg>
  )
}

function EducationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 11.2v4.1c2.8 2.1 7.2 2.1 10 0v-4.1" />
      <path d="M21 10v5" />
    </svg>
  )
}

function WorkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3.5" y="7" width="17" height="12" rx="2" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 11h17M10 11v2h4v-2" />
    </svg>
  )
}

function PostsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

function ArticlesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" />
      <path d="M8 4v14M11 8h4M11 12h4M11 16h3" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; userId: string }>
  searchParams: Promise<{
    from?: string
    conversation?: string
    post?: string
  }>
}) {
  const { locale, userId } = await params
  const query = await searchParams
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id
  const isOwner = currentUserId === userId
  const isArabic = locale === 'ar'

  const [
    { data: rawProfile, error },
    { data: education },
    { data: work },
    { data: visibilityRows },
    friendship,
    feed,
  ] = await Promise.all([
    supabase.rpc('get_profile_for_viewer', { target_user_id: userId }).maybeSingle(),
    supabase
      .from('higher_education')
      .select('id, university, degree, year_obtained')
      .eq('user_id', userId)
      .order('year_obtained', { ascending: false, nullsFirst: false }),
    supabase
      .from('job_history')
      .select('id, employer, job_title, start_year, end_year')
      .eq('user_id', userId)
      .order('start_year', { ascending: false, nullsFirst: false }),
    supabase
      .from('profile_field_visibility')
      .select('field_key, is_public')
      .eq('user_id', userId),
    getProfileFriendship(userId),
    import('@/app/[locale]/actions/community').then(({ getFeed }) =>
      getFeed(null, null, userId),
    ),
  ])

  const visibility = Object.fromEntries(
    (visibilityRows ?? []).map((row) => [row.field_key, row.is_public]),
  )

  const profile = rawProfile as ProfileRecord | null
  if (error || !profile) {
    notFound()
  }

  let resolvedAvatarUrl = profile.avatar_url

  if (profile.avatar_url) {
    const parsedAvatar = parseMediaRef(profile.avatar_url)

    if (parsedAvatar.provider === 'imagekit' && parsedAvatar.path.trim()) {
      resolvedAvatarUrl = await getImagekitSignedUrl(parsedAvatar.path)
    }
  }

  const displayName =
    profile.display_name ?? (isArabic ? 'مستخدم' : 'User')

  const returnHref =
    query.from === 'messages'
      ? '/community/messages'
      : query.from === 'group' && query.conversation
        ? '/community/messages/' + query.conversation + '/info'
        : query.from === 'post' && query.post
          ? '/community#' + query.post
          : query.from === 'friends'
            ? '/community/friends'
            : '/community/friends'

  const relationship = friendship.relationship

  const friendshipLabel =
    relationship === 'accepted'
      ? isArabic
        ? 'إزالة الصداقة'
        : 'Remove friend'
      : relationship === 'sent'
        ? isArabic
          ? 'إلغاء الطلب'
          : 'Cancel request'
        : relationship === 'received'
          ? isArabic
            ? 'قبول الطلب'
            : 'Accept request'
          : isArabic
            ? 'إضافة صديق'
            : 'Add friend'

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <Link
            href={returnHref}
            aria-label={isArabic ? 'رجوع' : 'Back'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <BackIcon />
          </Link>

          {!isOwner ? <ProfileActionsMenu userId={userId} /> : null}
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-b from-primary-50/70 to-white px-5 pb-6 pt-8 text-center sm:px-8">
            <div className="flex flex-col items-center pt-8">
              <div className="flex h-40 w-40 items-center justify-center">
                <div className="scale-200">
                  <Avatar
                    name={displayName}
                    avatarUrl={resolvedAvatarUrl}
                    size="xl"
                  />
                </div>
              </div>

              {isOwner ? (
                <div className="mt-4">
                  <ProfileAvatarUpload
                    avatarUrl={resolvedAvatarUrl}
                    avatarFileName={
                      profile.avatar_url
                        ? parseMediaRef(profile.avatar_url).path.split('/').pop() || 'profile-avatar'
                        : 'profile-avatar'
                    }
                    isArabic={isArabic}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {displayName}
              </h1>

              {profile.is_verified_professional ? (
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  {isArabic ? 'موثق مهنيًا' : 'Professionally verified'}
                </span>
              ) : null}
            </div>

            {profile.bio ? (
              <p className="mx-auto mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {profile.bio}
              </p>
            ) : null}

            {!isOwner ? (
              <div className="mt-5 flex flex-wrap justify-center gap-10">
                <form action={startDirectMessage}>
                  <input type="hidden" name="otherUserId" value={userId} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="w-auto rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    {isArabic ? 'رسالة' : 'Message'}
                  </button>
                </form>

                <form action={handleFriendshipAction}>
                  <input
                    type="hidden"
                    name="action"
                    value={
                      relationship === 'accepted'
                        ? 'remove'
                        : relationship === 'sent'
                          ? 'cancel'
                          : relationship === 'received'
                            ? 'accept'
                            : 'send'
                    }
                  />
                  <input
                    type="hidden"
                    name="friendshipId"
                    value={friendship.friendshipId ?? ''}
                  />
                  <input
                    type="hidden"
                    name="userId"
                    value={userId}
                  />
                  <button
                    type="submit"
                    className="btn-primary w-auto px-4 py-2 text-sm"
                  >
                    {friendshipLabel}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SectionIcon>
                <PersonalIcon />
              </SectionIcon>
              <div>
                <h2 className="font-bold text-gray-900">
                  {isArabic ? 'المعلومات الشخصية' : 'Personal information'}
                </h2>
                <p className="text-xs text-gray-500">
                  {isArabic ? 'المعلومات العامة الظاهرة في الملف' : 'Public information shown on the profile'}
                </p>
              </div>
            </div>

            {isOwner ? (
              <ProfilePersonalEdit
                profile={{
                  display_name: profile.display_name,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  bio: profile.bio,
                  country: profile.country,
                  city: profile.city,
                  date_of_birth: profile.date_of_birth,
                  gender: profile.gender,
                  phone: profile.phone,
                  base_degree: profile.base_degree,
                  base_university: profile.base_university,
                  base_graduation_year: profile.base_graduation_year,
                }}
                visibility={visibility}
                isArabic={isArabic}
              />
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">
                  {isArabic ? 'الموقع' : 'Location'}
                </p>
                {isOwner ? (
                  <span
                    className="text-xs text-gray-400"
                    title={
                      visibility.country === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                    aria-label={
                      visibility.country === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                  >
                    {visibility.country === false ? '🔒' : '🌐'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-semibold text-gray-900">
                {[profile.city, profile.country].filter(Boolean).join('، ') || '—'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">
                  {isArabic ? 'تاريخ الميلاد' : 'Date of birth'}
                </p>
                {isOwner ? (
                  <span
                    className="text-xs text-gray-400"
                    title={
                      visibility.date_of_birth === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                    aria-label={
                      visibility.date_of_birth === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                  >
                    {visibility.date_of_birth === false ? '🔒' : '🌐'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-semibold text-gray-900">
                {profile.date_of_birth || '—'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">
                  {isArabic ? 'الجنس' : 'Gender'}
                </p>
                {isOwner ? (
                  <span
                    className="text-xs text-gray-400"
                    title={
                      visibility.gender === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                    aria-label={
                      visibility.gender === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                  >
                    {visibility.gender === false ? '🔒' : '🌐'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-semibold text-gray-900">
                {profile.gender === 'male'
                  ? isArabic ? 'ذكر' : 'Male'
                  : profile.gender === 'female'
                    ? isArabic ? 'أنثى' : 'Female'
                    : '—'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-500">
                  {isArabic ? 'رقم الهاتف' : 'Phone'}
                </p>
                {isOwner ? (
                  <span
                    className="text-xs text-gray-400"
                    title={
                      visibility.phone === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                    aria-label={
                      visibility.phone === false
                        ? isArabic ? 'خاص' : 'Private'
                        : isArabic ? 'عام' : 'Public'
                    }
                  >
                    {visibility.phone === false ? '🔒' : '🌐'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-semibold text-gray-900">
                {profile.phone || '—'}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-500">
                {isArabic ? 'التحقق المهني' : 'Professional verification'}
              </p>
            </div>
            <p className="mt-1 font-semibold text-gray-900">
              {profile.is_verified_professional
                ? isArabic
                  ? 'موثق مهنيًا'
                  : 'Professionally verified'
                : isArabic
                  ? 'غير موثق'
                  : 'Not verified'}
            </p>
          </div>
        </section>

        <ProfileEducationWorkEdit
          isArabic={isArabic}
          isOwner={isOwner}
          education={education ?? []}
          work={work ?? []}
          baseDegree={profile.base_degree}
          baseUniversity={profile.base_university}
          baseGraduationYear={profile.base_graduation_year}
        />

        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
            <div className="flex min-w-max gap-2">
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <PostsIcon />
                {isArabic ? 'المنشورات' : 'Posts'}
              </button>

              <button
                type="button"
                disabled
                className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400"
              >
                <ArticlesIcon />
                {isArabic ? 'المقالات' : 'Articles'}
              </button>
            </div>
          </div>

          <ProfilePosts
            userId={userId}
            initialPosts={feed.posts}
            initialCursor={feed.nextCursor}
            currentUserId={currentUserId}
            isAdmin={false}
            canManagePosts={isOwner}
            canDeletePosts={isOwner}
          />
        </section>
      </div>
    </main>
  )
}
