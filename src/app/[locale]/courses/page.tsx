import { createClient } from '@/lib/supabase/server';
import CoursesFilters from './CoursesFilters';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function CoursesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  const isArabic = locale === 'ar';
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, pricing, price, currency_code, delivery_mode, level, cover_image_url, course_translations(locale, title, description)')
    .eq('status', 'published')
    .eq('is_suspended', false)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Failed to load courses:', error.message);
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Failed to get current user:', authError.message);
  }

  const user = authData.user;
  let enrollmentStatusByCourse = new Map<string, 'studying' | 'completed'>();

  if (user) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('course_id, completed_at')
      .eq('user_id', user.id);

    if (enrollmentsError) {
      console.error('Failed to load course enrollments:', enrollmentsError.message);
    } else {
      enrollmentStatusByCourse = new Map(
        (enrollments ?? []).map((enrollment) => [
          enrollment.course_id,
          enrollment.completed_at ? 'completed' as const : 'studying' as const,
        ]),
      );
    }
  }

  const search = q.trim().toLocaleLowerCase();

  const visibleCourses = (courses ?? []).map((course) => {
    const translations = Array.isArray(course.course_translations)
      ? course.course_translations
      : [];
    const translation =
      translations.find((item) => item.locale === locale) ??
      translations[0];

    return {
      id: course.id,
      slug: course.slug,
      pricing: course.pricing,
      price: course.price,
      currencyCode: course.currency_code,
      deliveryMode: course.delivery_mode,
      level: course.level,
      coverImageUrl: course.cover_image_url,
      title: translation?.title ?? course.slug,
      description: translation?.description ?? '',
      enrollmentStatus: enrollmentStatusByCourse.get(course.id) ?? null,
    };
  }).filter((course) => {
    if (!search) return true;
    return (
      course.title.toLocaleLowerCase().includes(search) ||
      course.description.toLocaleLowerCase().includes(search)
    );
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary-600">
          {isArabic ? 'الدورات التعليمية' : 'Courses'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isArabic ? 'اكتشف الدورات التعليمية المتاحة.' : 'Explore available learning courses.'}
        </p>
      </header>

      <form action="/courses" className="mb-8 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={isArabic ? 'ابحث عن دورة...' : 'Search courses...'}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3"
        />
        <button type="submit" className="rounded-xl bg-primary-600 px-5 py-3 font-medium text-white">
          {isArabic ? 'بحث' : 'Search'}
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 p-4 text-red-700">
          {isArabic ? 'تعذر تحميل الدورات. حاول لاحقًا.' : 'Could not load courses. Please try again later.'}
        </p>
      ) : (
        <CoursesFilters courses={visibleCourses} locale={locale} query={q} />
      )}
    </main>
  );
}
