import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/navigation/AppHeader';
import { resolveAvatarUrl } from '@/lib/storage/avatar-server';
import { redirect, Link } from '@/i18n/navigation';

type Params = Promise<{ locale: string; slug: string }>;

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
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

  const { data: course, error } = await supabase
    .from('courses')
    .select(
      'id, slug, status, pricing, price, currency_code, delivery_mode, level, language_code, cover_image_url, is_suspended, suspension_reason, created_at, published_at, course_translations(locale, title, description)'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error || !course) {
    return (
      <main className="mx-auto max-w-5xl p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {locale === 'ar' ? 'تعذر العثور على الدورة.' : 'Course not found.'}
        </p>
        <Link className="mt-4 inline-block underline" href="/admin/courses">
          {locale === 'ar' ? 'العودة إلى الدورات' : 'Back to courses'}
        </Link>
      </main>
    );
  }

  const translations = Array.isArray(course.course_translations)
    ? course.course_translations
    : [];
  const selected =
    translations.find((item) => item.locale === locale) ??
    translations.find((item) => item.locale === 'ar') ??
    translations[0];

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, description, sort_order')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  const moduleIds = (modules ?? []).map((item) => item.id);
  const { data: moduleTranslations } = moduleIds.length
    ? await supabase
        .from('course_module_translations')
        .select('module_id, locale, title, description')
        .in('module_id', moduleIds)
        .eq('locale', locale)
    : { data: [] };

  const { data: lessons } = moduleIds.length
    ? await supabase
        .from('course_lessons')
        .select('id, module_id, title, lesson_type, sort_order, duration_seconds, is_preview')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true })
    : { data: [] };

  const lessonIds = (lessons ?? []).map((item) => item.id);
  const { data: lessonTranslations } = lessonIds.length
    ? await supabase
        .from('course_lesson_translations')
        .select('lesson_id, locale, title')
        .in('lesson_id', lessonIds)
        .eq('locale', locale)
    : { data: [] };

  const moduleTitle = (moduleId: string, fallback: string) =>
    moduleTranslations?.find((item) => item.module_id === moduleId)?.title || fallback;

  const lessonTitle = (lessonId: string, fallback: string) =>
    lessonTranslations?.find((item) => item.lesson_id === lessonId)?.title || fallback;

  const ar = locale === 'ar';
  const statusLabels: Record<string, string> = {
    draft: ar ? 'مسودة' : 'Draft',
    in_review: ar ? 'قيد المراجعة' : 'In review',
    published: ar ? 'منشورة' : 'Published',
    archived: ar ? 'مؤرشفة' : 'Archived',
  };

  return (
    <>

      <AppHeader
        locale={locale === 'ar' ? 'ar' : 'en'}
        userId={user.id}
        displayName={displayName}
        avatarUrl={avatarUrl}
        title={selected?.title || course.slug}
      />
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6" dir={ar ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-center justify-between gap-3">
<Link
          href={('/admin/courses/' + encodeURIComponent(course.slug) + '/edit') as '/admin/courses'}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {ar ? 'تعديل الدورة' : 'Edit course'}
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info label={ar ? 'الحالة' : 'Status'} value={statusLabels[course.status] ?? course.status} />
        <Info label={ar ? 'التسعير' : 'Pricing'} value={course.pricing} />
        <Info label={ar ? 'المستوى' : 'Level'} value={course.level ?? '—'} />
        <Info label={ar ? 'طريقة التقديم' : 'Delivery'} value={course.delivery_mode ?? '—'} />
      </section>

      {course.is_suspended && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <strong>{ar ? 'الدورة موقوفة' : 'Course suspended'}</strong>
          {course.suspension_reason && <p className="mt-1">{course.suspension_reason}</p>}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">{ar ? 'وصف الدورة' : 'Course description'}</h2>
        <p className="mt-3 whitespace-pre-wrap leading-8 text-gray-700">
          {selected?.description || (ar ? 'لا يوجد وصف.' : 'No description.')}
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{ar ? 'محتوى الدورة' : 'Course curriculum'}</h2>
          <span className="text-sm text-gray-500">
            {(modules ?? []).length} {ar ? 'وحدات' : 'modules'} · {(lessons ?? []).length} {ar ? 'دروس' : 'lessons'}
          </span>
        </div>

        {!modules?.length ? (
          <p className="mt-4 rounded-xl bg-gray-50 p-4 text-gray-500">
            {ar ? 'لا توجد وحدات مضافة بعد.' : 'No modules have been added yet.'}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {modules.map((module, index) => {
              const moduleLessons = (lessons ?? []).filter(
                (lesson) => lesson.module_id === module.id
              );
              return (
                <article key={module.id} className="rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold">
                    {index + 1}. {moduleTitle(module.id, module.title)}
                  </h3>
                  {module.description && (
                    <p className="mt-1 text-sm text-gray-600">{module.description}</p>
                  )}
                  {moduleLessons.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">
                      {ar ? 'لا توجد دروس في هذه الوحدة.' : 'No lessons in this module.'}
                    </p>
                  ) : (
                    <ol className="mt-3 space-y-2">
                      {moduleLessons.map((lesson, lessonIndex) => (
                        <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <span>
                            {lessonIndex + 1}. {lessonTitle(lesson.id, lesson.title)}
                          </span>
                          <span className="text-gray-500">
                            {lesson.lesson_type}
                            {lesson.is_preview ? (ar ? ' · معاينة' : ' · Preview') : ''}
                            {lesson.duration_seconds
                              ? ' · ' + Math.round(lesson.duration_seconds / 60) + (ar ? ' د' : ' min')
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">

      </p>
    </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 font-semibold text-gray-900">{value}</p>
    </div>
  );
}
