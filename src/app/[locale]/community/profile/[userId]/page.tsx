'use server'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/community/Avatar'
import { Link } from '@/i18n/navigation'
import { getOrCreateDirectConversation } from '@/app/[locale]/actions/messaging'
import { getProfileFriendship } from '@/app/[locale]/actions/friends'
import ProfilePosts from './ProfilePosts'

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

  const [{ data: profile, error }, { data: education }, { data: work }, friendship, feed] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, display_name, avatar_url, bio, country, city, is_verified_professional, base_degree, base_university, base_graduation_year',
        )
        .eq('id', userId)
        .maybeSingle(),

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

      getProfileFriendship(userId),

      import('@/app/[locale]/actions/community').then(({ getFeed }) =>
        getFeed(null, null, userId),
      ),
    ])

  if (error || !profile) {
    notFound()
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
        <Link
          href={returnHref}
          aria-label={isArabic ? 'رجوع' : 'Back'}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          <BackIcon />
        </Link>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-b from-primary-50/70 to-white px-5 pb-6 pt-8 text-center sm:px-8">
            <div className="flex justify-center pt-12">
              <div className="scale-200">
                <Avatar
                  name={displayName}
                  avatarUrl={profile.avatar_url}
                  size="xl"
                />
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
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
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <form action={startDirectMessage}>
                  <input type="hidden" name="otherUserId" value={userId} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    disabled={relationship !== 'accepted'}
                    className="btn-secondary w-auto px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isArabic ? 'رسالة' : 'Message'}
                  </button>
                </form>

                <Link
                  href={
                    relationship === 'accepted'
                      ? '/community/friends'
                      : '/community/friends'
                  }
                  className="btn-primary w-auto px-4 py-2 text-sm"
                >
                  {friendshipLabel}
                </Link>
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
                  {isArabic ? 'نبذة ومعلومات عامة' : 'About and general information'}
                </p>
              </div>
            </div>

            {isOwner ? (
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400"
              >
                {isArabic ? 'تعديل' : 'Edit'}
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">
                {isArabic ? 'الموقع' : 'Location'}
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {[profile.city, profile.country]
                  .filter(Boolean)
                  .join('، ') || '—'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">
                {isArabic ? 'التحقق المهني' : 'Professional verification'}
              </p>
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
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SectionIcon>
                <EducationIcon />
              </SectionIcon>
              <h2 className="font-bold text-gray-900">
                {isArabic ? 'التعليم' : 'Education'}
              </h2>
            </div>

            {isOwner ? (
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400"
              >
                {isArabic ? 'تعديل' : 'Edit'}
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {profile.base_degree || profile.base_university ? (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">
                  {[profile.base_degree, profile.base_university]
                    .filter(Boolean)
                    .join(' — ')}
                </p>
                {profile.base_graduation_year ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {isArabic ? 'سنة التخرج: ' : 'Graduation: '}
                    {profile.base_graduation_year}
                  </p>
                ) : null}
              </div>
            ) : null}

            {(education ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-100 bg-white p-4"
              >
                <p className="font-semibold text-gray-900">
                  {item.degree}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {item.university}
                </p>
                {item.year_obtained ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {item.year_obtained}
                  </p>
                ) : null}
              </div>
            ))}

            {!profile.base_degree &&
            !profile.base_university &&
            (education ?? []).length === 0 ? (
              <p className="py-4 text-sm text-gray-500">
                {isArabic ? 'لا توجد بيانات تعليمية.' : 'No education information.'}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SectionIcon>
                <WorkIcon />
              </SectionIcon>
              <h2 className="font-bold text-gray-900">
                {isArabic ? 'العمل والخبرة' : 'Work & experience'}
              </h2>
            </div>

            {isOwner ? (
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400"
              >
                {isArabic ? 'تعديل' : 'Edit'}
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {(work ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-gray-50 p-4"
              >
                <p className="font-semibold text-gray-900">
                  {item.job_title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {item.employer}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.start_year ?? '—'} — {item.end_year ?? (isArabic ? 'حتى الآن' : 'Present')}
                </p>
              </div>
            ))}

            {(work ?? []).length === 0 ? (
              <p className="py-4 text-sm text-gray-500">
                {isArabic ? 'لا توجد خبرات عمل.' : 'No work experience.'}
              </p>
            ) : null}
          </div>
        </section>

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
