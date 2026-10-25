import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/navigation/AppHeader';
import CourseAdminTable, {
  type AdminCourse,
} from '@/components/admin/CourseAdminTable';
import { resolveAvatarUrl } from '@/lib/storage/avatar-server';
import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCoursesPage({ params }: Props) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  const uiLocale = isArabic ? 'ar' : 'en';
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect({ href: '/login', locale });
    return null;
  }

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError || !roles?.some((item) => item.role === 'admin')) {
    redirect({ href: '/', locale });
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles_public')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? null;
  const avatarUrl = await resolveAvatarUrl(profile?.avatar_url);

  const { data: courses, error } = await supabase
    .from('courses')
    .select(
      'id, slug, status, pricing, price, currency_code, delivery_mode, level, is_suspended, suspension_reason, created_at, published_at, course_translations(locale, title)',
    )
    .order('created_at', { ascending: false });

  const courseIds = (courses ?? []).map((course) => course.id);

  const {
    data: enrollments,
    error: enrollmentsError,
  } = courseIds.length
    ? await supabase
        .from('course_enrollments')
        .select('course_id, user_id, completed_at, enrolled_at')
        .in('course_id', courseIds)
    : { data: [], error: null };

  const enrollmentStats = new Map<
    string,
    { total: number; completed: number; incomplete: number }
  >();

  for (const enrollment of enrollments ?? []) {
    const stats = enrollmentStats.get(enrollment.course_id) ?? {
      total: 0,
      completed: 0,
      incomplete: 0,
    };

    stats.total += 1;

    if (enrollment.completed_at) {
      stats.completed += 1;
    } else {
      stats.incomplete += 1;
    }

    enrollmentStats.set(enrollment.course_id, stats);
  }

  const learnerIds = [
    ...new Set((enrollments ?? []).map((item) => item.user_id)),
  ];

  const { data: learnerProfiles } = learnerIds.length
    ? await supabase
        .from('profiles_public')
        .select('id, display_name, avatar_url')
        .in('id', learnerIds)
    : {
        data: [] as {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
        }[],
      };

  const resolvedLearnerProfiles = await Promise.all(
    (learnerProfiles ?? []).map(async (learnerProfile) => ({
      ...learnerProfile,
      avatar_url: await resolveAvatarUrl(learnerProfile.avatar_url),
    })),
  );

  const learnerProfileById = new Map(
    resolvedLearnerProfiles.map((learnerProfile) => [
      learnerProfile.id,
      learnerProfile,
    ]),
  );

  const adminCourses: AdminCourse[] = (courses ?? []).map((course) => {
    const translations = Array.isArray(course.course_translations)
      ? course.course_translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
        }))
      : [];

    const learners = enrollmentsError
      ? []
      : (enrollments ?? [])
          .filter((item) => item.course_id === course.id)
          .map((item) => {
            const learnerProfile = learnerProfileById.get(item.user_id);

            return {
              userId: item.user_id,
              name: learnerProfile?.display_name ?? '—',
              avatarUrl: learnerProfile?.avatar_url ?? null,
              enrolledAt: item.enrolled_at,
              completed: Boolean(item.completed_at),
            };
          });

    const stats = enrollmentStats.get(course.id);

    return {
      id: course.id,
      slug: course.slug,
      status: course.status,
      pricing: course.pricing,
      price: course.price,
      currency_code: course.currency_code,
      delivery_mode: course.delivery_mode,
      level: course.level,
      is_suspended: course.is_suspended,
      suspension_reason: course.suspension_reason,
      created_at: course.created_at,
      published_at: course.published_at,
      translations,
      learners,
      enrollmentStats: enrollmentsError
        ? null
        : stats ?? { total: 0, completed: 0, incomplete: 0 },
    };
  });

  const text = {
    title: isArabic ? 'إدارة الدورات' : 'Course administration',
    create: isArabic ? 'إنشاء دورة جديدة' : 'Create New Course',
    loadError: isArabic
      ? 'تعذر تحميل الدورات. حاول لاحقًا.'
      : 'Could not load courses. Please try again later.',
  };

  return (
    <>
      <AppHeader
        title={text.title}
        locale={uiLocale}
        userId={user.id}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />

      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6"
      >
        <div
          className={
            'mb-6 flex ' + (isArabic ? 'justify-end' : 'justify-start')
          }
        >
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <span aria-hidden="true">+</span>
            {text.create}
          </Link>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 p-4 text-red-700"
          >
            {text.loadError}
          </p>
        ) : (
          <CourseAdminTable
            courses={adminCourses}
            locale={uiLocale}
            enrollmentLoadError={Boolean(enrollmentsError)}
          />
        )}
      </main>
    </>
  );
}
