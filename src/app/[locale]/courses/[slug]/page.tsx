import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CourseEnrollmentButton from './CourseEnrollmentButton';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isArabic = locale === 'ar';
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(
      'id, slug, pricing, price, currency_code, delivery_mode, level, cover_image_url, course_translations(locale, title, description)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_suspended', false)
    .maybeSingle();

  if (courseError) {
    console.error('Failed to load course details:', courseError.message);

    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p role="alert" className="rounded-xl border border-red-200 p-4 text-red-700">
          {isArabic
            ? 'تعذر تحميل تفاصيل الدورة. حاول لاحقًا.'
            : 'Could not load course details. Please try again later.'}
        </p>
      </main>
    );
  }

  if (!course) notFound();

  const translations = Array.isArray(course.course_translations)
    ? course.course_translations
    : [];
  const translation =
    translations.find((item) => item.locale === locale);

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('id, title, description, sort_order')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  if (modulesError) {
    console.error('Failed to load course modules:', modulesError.message);
  }

  const moduleIds = (modules ?? []).map((module) => module.id);

  const { data: moduleTranslations, error: moduleTranslationsError } =
    moduleIds.length > 0
      ? await supabase
          .from('course_module_translations')
          .select('module_id, locale, title, description')
          .in('module_id', moduleIds)
          .eq('locale', locale)
      : { data: [], error: null };

  if (moduleTranslationsError) {
    console.error('Failed to load module translations:', moduleTranslationsError.message);
  }

  const moduleTranslationMap = new Map(
    (moduleTranslations ?? []).map((item) => [item.module_id, item]),
  );

  let lessons: {
    id: string;
    module_id: string;
    title: string;
    lesson_type: string;
    sort_order: number;
    duration_seconds: number | null;
    is_preview: boolean;
    content: Record<string, unknown> | null;
  }[] = [];

  if (moduleIds.length > 0) {
    const { data, error } = await supabase
      .from('course_lessons')
      .select(
        'id, module_id, title, lesson_type, content, sort_order, duration_seconds, is_preview',
      )
      .in('module_id', moduleIds)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to load course lessons:', error.message);
    } else {
      lessons = data ?? [];
    }
  }

  const title = translation?.title ?? null;
  const description = translation?.description ?? '';

  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: lessonTranslations, error: lessonTranslationsError } =
    lessonIds.length > 0
      ? await supabase
          .from('course_lesson_translations')
          .select('lesson_id, locale, title, content')
          .in('lesson_id', lessonIds)
          .eq('locale', locale)
      : { data: [], error: null };

  if (lessonTranslationsError) {
    console.error('Failed to load lesson translations:', lessonTranslationsError.message);
  }

  const lessonTranslationMap = new Map(
    (lessonTranslations ?? []).map((item) => [item.lesson_id, item]),
  );

  const getContentText = (value: unknown): string | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const text = (value as Record<string, unknown>).text;
    return typeof text === 'string' && text.trim() ? text : null;
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds == null || seconds <= 0) return null;

    const minutes = Math.ceil(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (isArabic) {
      if (hours > 0 && remainingMinutes > 0) {
        return `${hours} س ${remainingMinutes} د`;
      }
      if (hours > 0) return `${hours} ساعة`;
      return `${minutes} دقيقة`;
    }

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours} hr ${remainingMinutes} min`;
    }
    if (hours > 0) return `${hours} hr`;
    return `${minutes} min`;
  };

  const levelLabel = (level: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      beginner: { ar: 'مبتدئ', en: 'Beginner' },
      intermediate: { ar: 'متوسط', en: 'Intermediate' },
      advanced: { ar: 'متقدم', en: 'Advanced' },
      all_levels: { ar: 'جميع المستويات', en: 'All levels' },
    };

    return labels[level]?.[isArabic ? 'ar' : 'en'] ?? level;
  };

  const deliveryModeLabel = (mode: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      recorded: { ar: 'مسجلة', en: 'Recorded' },
      live: { ar: 'مباشرة', en: 'Live' },
      recorded_and_live: {
        ar: 'مسجلة ومباشرة',
        en: 'Recorded and live',
      },
    };

    return labels[mode]?.[isArabic ? 'ar' : 'en'] ?? mode;
  };

  const lessonTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      video: { ar: 'فيديو', en: 'Video' },
      text: { ar: 'نص', en: 'Text' },
      file: { ar: 'ملف', en: 'File' },
      live: { ar: 'درس مباشر', en: 'Live session' },
    };

    return labels[type]
      ? isArabic
        ? labels[type].ar
        : labels[type].en
      : type;
  };

    const { data: authData } = await supabase.auth.getUser();
  let isEnrolled = false;
  if (authData.user) {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', authData.user.id)
      .maybeSingle();
    if (enrollmentError) {
      console.error('Failed to check course enrollment:', enrollmentError.message);
    } else {
      isEnrolled = Boolean(enrollment);
    }
  }
return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 sm:py-10"
    >
      {!translation ? (
        <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          {isArabic
            ? 'ترجمة هذه الدورة غير متاحة باللغة العربية حاليًا.'
            : 'This course is not yet translated into English.'}
        </p>
      ) : null}

      {course.cover_image_url ? (
        <img
          src={course.cover_image_url}
          alt=""
          className="mb-8 max-h-96 w-full rounded-2xl object-cover"
        />
      ) : null}

      <header className="mb-4">
        <h1 className="text-3xl font-bold leading-tight text-primary-600 sm:text-4xl">
          {title ?? (isArabic ? 'ترجمة الدورة غير متاحة' : 'Course translation unavailable')}
        </h1>

        {description ? (
          <p className="mt-4 whitespace-pre-line leading-8 text-gray-700">
            {description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {levelLabel(course.level)}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {deliveryModeLabel(course.delivery_mode)}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {course.pricing === 'free'
              ? isArabic
                ? 'مجانية'
                : 'Free'
              : course.price != null
                ? `${course.price} ${course.currency_code}`
                : isArabic
                  ? 'راجع السعر'
                  : 'See course details'}
          </span>
        </div>
      </header>

      <CourseEnrollmentButton
  courseId={course.id}
  courseTitle={translation?.title ?? course.slug}
  locale={locale}
  pricing={course.pricing}
  price={course.price}
  currencyCode={course.currency_code}
  isArabic={isArabic}
  isEnrolled={isEnrolled}
/>
<section aria-labelledby="course-content-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="course-content-heading"
              className="text-2xl font-bold text-gray-900"
            >
              {isArabic ? 'محتوى الدورة' : 'Course content'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isArabic
                ? 'تصفّح الوحدات والدروس المتاحة في الدورة.'
                : 'Explore the modules and lessons in this course.'}
            </p>
          </div>

          {!modulesError && (modules ?? []).length > 0 ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {isArabic
                ? `${(modules ?? []).length} وحدة`
                : `${(modules ?? []).length} modules`}
            </span>
          ) : null}
        </div>

        {modulesError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 p-4 text-red-700"
          >
            {isArabic
              ? 'تعذر تحميل محتوى الدورة.'
              : 'Could not load course content.'}
          </p>
        ) : (modules ?? []).length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
            {isArabic
              ? 'يجري إعداد محتوى هذه الدورة.'
              : 'The content for this course is being prepared.'}
          </p>
        ) : (
          <div className="space-y-3">
            {(modules ?? []).map((module, index) => {
              const moduleLessons = lessons
                .filter((lesson) => lesson.module_id === module.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              const knownDuration = moduleLessons.reduce(
                (total, lesson) =>
                  total + (lesson.duration_seconds ?? 0),
                0,
              );
              const formattedTotal = formatDuration(knownDuration);

              return (
                <details
                  key={module.id}
                  open={index === 0 ? true : undefined}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-gray-50 sm:p-5 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-900">
                        {moduleTranslationMap.get(module.id)?.title ?? (isArabic ? 'ترجمة عنوان الوحدة غير متاحة' : 'Module title translation unavailable')}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          {isArabic
                            ? `${moduleLessons.length} درس`
                            : `${moduleLessons.length} lessons`}
                        </span>
                        {formattedTotal ? (
                          <span>
                            {isArabic ? 'المدة:' : 'Duration:'}{' '}
                            {formattedTotal}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </summary>

                  <div className="border-t border-gray-100 px-4 pb-3 sm:px-5">
                    {moduleTranslationMap.get(module.id)?.description ? (
                      <p className="py-4 text-sm leading-7 text-gray-600">
                        {moduleTranslationMap.get(module.id)?.description}
                      </p>
                    ) : null}

                    {moduleLessons.length === 0 ? (
                      <p className="py-4 text-sm text-gray-500">
                        {isArabic
                          ? 'يجري إعداد دروس هذه الوحدة.'
                          : 'Lessons for this module are being prepared.'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {moduleLessons.map((lesson) => {
                          const duration = formatDuration(
                            lesson.duration_seconds,
                          );

                          return (
                            <li
                              key={lesson.id}
                              className="flex flex-wrap items-center gap-3 py-4"
                            >
                              <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
                              >
                                {lesson.lesson_type === 'video'
                                  ? '▶'
                                  : lesson.lesson_type === 'text'
                                    ? '≡'
                                    : lesson.lesson_type === 'file'
                                      ? '↧'
                                      : lesson.lesson_type === 'live'
                                        ? '◉'
                                        : '•'}
                              </span>

                              <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-gray-800">
                                {lessonTranslationMap.get(lesson.id)?.title ?? (isArabic ? 'ترجمة عنوان الدرس غير متاحة' : 'Lesson title translation unavailable')}
                              </span>

                              {lesson.lesson_type === 'text' &&
                              getContentText(lessonTranslationMap.get(lesson.id)?.content) ? (
                                <p className="w-full whitespace-pre-line text-sm leading-7 text-gray-700">
                                  {getContentText(lessonTranslationMap.get(lesson.id)?.content)}
                                </p>
                              ) : null}

                              <span className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                                  {lessonTypeLabel(lesson.lesson_type)}
                                </span>
                                {lesson.is_preview ? (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                                    {isArabic ? 'معاينة' : 'Preview'}
                                  </span>
                                ) : null}
                                {duration ? <span>{duration}</span> : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
