import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CourseEnrollmentButton from './CourseEnrollmentButton';
import LessonCompletionButton from './LessonCompletionButton';
import CourseQuizPlayer from './CourseQuizPlayer';
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'

async function resolveCourseCoverUrl(ref: string | null): Promise<string | null> {
  if (!ref) return null

  if (ref.startsWith('imagekit:')) {
    const { provider, path } = parseMediaRef(ref)
    if (provider !== 'imagekit' || !path.trim()) return null
    return getImagekitSignedUrl(path)
  }

  return ref
}


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
      'id, slug, pricing, price, currency_code, delivery_mode, level, cover_image_url, language_content_type, course_translations(locale, title, description)',
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

  const coverImageUrl = await resolveCourseCoverUrl(course.cover_image_url);

  const contentLocale =
    course.language_content_type === 'ar_only'
      ? 'ar'
      : course.language_content_type === 'en_only'
        ? 'en'
        : locale;

  const translations = Array.isArray(course.course_translations)
    ? course.course_translations
    : [];
  const translation =
    translations.find((item) => item.locale === contentLocale);

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
          .eq('locale', contentLocale)
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
          .eq('locale', contentLocale)
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

  type RenderedLessonSection = {
    id: string;
    heading: string;
    text: string;
    imageUrl: string | null;
  };

  const lessonSectionsMap = new Map<string, RenderedLessonSection[]>();
  for (const [lessonId, translation] of lessonTranslationMap) {
    const content = translation.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) continue;
    const rawSections = (content as Record<string, unknown>).sections;
    if (!Array.isArray(rawSections)) continue;

    const rendered: RenderedLessonSection[] = [];
    for (const rawSection of rawSections) {
      if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) continue;
      const section = rawSection as Record<string, unknown>;
      const heading = typeof section.heading === 'string' ? section.heading : '';
      const text = typeof section.text === 'string' ? section.text : '';
      const id = typeof section.id === 'string' ? section.id : heading;
      const imageRef = typeof section.image_ref === 'string' ? section.image_ref : '';
      let imageUrl: string | null = null;

      if (imageRef.startsWith('imagekit:')) {
        const parsedRef = parseMediaRef(imageRef);
        if (parsedRef.provider === 'imagekit' && parsedRef.path.trim()) {
          try {
            imageUrl = await getImagekitSignedUrl(parsedRef.path);
          } catch (error) {
            console.error('Failed to sign lesson section image:', error);
          }
        }
      } else if (/^https?:\/\//i.test(imageRef)) {
        imageUrl = imageRef;
      }

      if (heading.trim() || text.trim() || imageUrl) {
        rendered.push({ id, heading, text, imageUrl });
      }
    }
    if (rendered.length) lessonSectionsMap.set(lessonId, rendered);
  }

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
  let enrollmentId: string | null = null;
  let enrollmentCompletedAt: string | null = null;
  let progressLoadFailed = false;
  let completedLessonIds = new Set<string>();
  let lastPositionByLesson = new Map<string, number>();
  if (authData.user) {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id, completed_at')
      .eq('course_id', course.id)
      .eq('user_id', authData.user.id)
      .maybeSingle();
    if (enrollmentError) {
      console.error('Failed to check course enrollment:', enrollmentError.message);
    } else {
      isEnrolled = Boolean(enrollment);
      enrollmentId = enrollment?.id ?? null;
      enrollmentCompletedAt = enrollment?.completed_at ?? null;
    }
  }

  if (enrollmentId && lessonIds.length > 0) {
    const { data: progressRows, error: progressError } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, completed_at, last_position_seconds')
      .eq('enrollment_id', enrollmentId)
      .in('lesson_id', lessonIds);

    if (progressError) {
      console.error('Failed to load lesson progress:', progressError.message);
      progressLoadFailed = true;
    } else {
      for (const row of progressRows ?? []) {
        if (row.completed_at) completedLessonIds.add(row.lesson_id);
        lastPositionByLesson.set(row.lesson_id, row.last_position_seconds);
      }
    }
  }


  type LoadedStudentQuiz = {
    id: string;
    quiz_type: 'lesson' | 'module' | 'final';
    module_id: string | null;
    lesson_id: string | null;
    title: string;
    description: string | null;
    passing_score: number;
    attempts_allowed: number | null;
    attempts_used: number;
    questions: {
      id: string;
      question_type: 'single_choice' | 'multiple_choice' | 'true_false';
      question_text: string;
      points: number;
      options: { id: string; text: string }[];
    }[];
  };

  let studentQuizzes: LoadedStudentQuiz[] = [];

  if (isEnrolled && enrollmentId) {
    try {
      const { data: quizRows, error: quizzesError } = await supabase
        .from('course_quizzes')
        .select('id, quiz_type, module_id, lesson_id, title, description, passing_score, attempts_allowed, sort_order')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (quizzesError) throw quizzesError;

      const quizzes = quizRows ?? [];
      const quizIds = quizzes.map((quiz) => quiz.id);

      if (quizIds.length > 0) {
        const [
          { data: quizTranslations, error: quizTranslationsError },
          { data: questionRows, error: questionsError },
          { data: attemptRows, error: attemptsError },
        ] = await Promise.all([
          supabase
            .from('course_quiz_translations')
            .select('quiz_id, locale, title, description')
            .in('quiz_id', quizIds)
            .eq('locale', contentLocale),
          supabase
            .from('course_quiz_questions')
            .select('id, quiz_id, question_type, points, sort_order')
            .in('quiz_id', quizIds)
            .order('sort_order', { ascending: true }),
          supabase
            .from('course_quiz_attempts')
            .select('quiz_id')
            .eq('enrollment_id', enrollmentId),
        ]);

        if (quizTranslationsError) throw quizTranslationsError;
        if (questionsError) throw questionsError;
        if (attemptsError) throw attemptsError;

        const questions = questionRows ?? [];
        const questionIds = questions.map((question) => question.id);
        const attemptsUsed = new Map<string, number>();

        for (const attempt of attemptRows ?? []) {
          attemptsUsed.set(
            attempt.quiz_id,
            (attemptsUsed.get(attempt.quiz_id) ?? 0) + 1,
          );
        }

        const [
          { data: questionTranslations, error: questionTranslationsError },
          { data: optionRows, error: optionsError },
        ] = questionIds.length > 0
          ? await Promise.all([
              supabase
                .from('course_quiz_question_translations')
                .select('question_id, locale, question_text')
                .in('question_id', questionIds)
                .eq('locale', contentLocale),
              supabase
                .from('course_quiz_options')
                .select('id, question_id, sort_order')
                .in('question_id', questionIds)
                .order('sort_order', { ascending: true }),
            ])
          : [
              { data: [], error: null },
              { data: [], error: null },
            ];

        if (questionTranslationsError) throw questionTranslationsError;
        if (optionsError) throw optionsError;

        const options = optionRows ?? [];
        const optionIds = options.map((option) => option.id);

        const { data: optionTranslations, error: optionTranslationsError } =
          optionIds.length > 0
            ? await supabase
                .from('course_quiz_option_translations')
                .select('option_id, locale, option_text')
                .in('option_id', optionIds)
                .eq('locale', contentLocale)
            : { data: [], error: null };

        if (optionTranslationsError) throw optionTranslationsError;

        const quizTranslationMap = new Map(
          (quizTranslations ?? []).map((item) => [item.quiz_id, item]),
        );
        const questionTranslationMap = new Map(
          (questionTranslations ?? []).map((item) => [item.question_id, item]),
        );
        const optionTranslationMap = new Map(
          (optionTranslations ?? []).map((item) => [item.option_id, item]),
        );

        const questionsByQuiz = new Map<string, typeof questions>();
        for (const question of questions) {
          const current = questionsByQuiz.get(question.quiz_id) ?? [];
          current.push(question);
          questionsByQuiz.set(question.quiz_id, current);
        }

        const optionsByQuestion = new Map<string, typeof options>();
        for (const option of options) {
          const current = optionsByQuestion.get(option.question_id) ?? [];
          current.push(option);
          optionsByQuestion.set(option.question_id, current);
        }

        studentQuizzes = quizzes.map((quiz) => {
          const translation = quizTranslationMap.get(quiz.id);
          const quizQuestions = (questionsByQuiz.get(quiz.id) ?? [])
            .map((question) => {
              const questionTranslation = questionTranslationMap.get(question.id);
              const translatedOptions = (optionsByQuestion.get(question.id) ?? [])
                .map((option) => ({
                  id: option.id,
                  text: optionTranslationMap.get(option.id)?.option_text ?? '',
                }))
                .filter((option) => option.text.trim().length > 0);

              return {
                id: question.id,
                question_type: question.question_type as
                  | 'single_choice'
                  | 'multiple_choice'
                  | 'true_false',
                question_text: questionTranslation?.question_text ?? '',
                points: Number(question.points),
                options: translatedOptions,
              };
            })
            .filter((question) =>
              question.question_text.trim().length > 0 && question.options.length > 0,
            );

          return {
            id: quiz.id,
            quiz_type: quiz.quiz_type as 'lesson' | 'module' | 'final',
            module_id: quiz.module_id,
            lesson_id: quiz.lesson_id,
            title: translation?.title ?? quiz.title,
            description: translation?.description ?? quiz.description,
            passing_score: quiz.passing_score,
            attempts_allowed: quiz.attempts_allowed,
            attempts_used: attemptsUsed.get(quiz.id) ?? 0,
            questions: quizQuestions,
          };
        });
      }
    } catch (error) {
      console.error('Failed to load course quizzes:', error);
      studentQuizzes = [];
    }
  }

  const completedCount = completedLessonIds.size;
  const totalLessonCount = lessons.length;
  const progressPercent = totalLessonCount > 0
    ? Math.round((completedCount / totalLessonCount) * 100)
    : 0;

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

      {coverImageUrl ? (
        <img
          src={coverImageUrl}
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
{isEnrolled ? (
        <section aria-label={isArabic ? 'تقدم الدورة' : 'Course progress'} className="my-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">
              {isArabic ? 'تقدمك في الدورة' : 'Your course progress'}
            </h2>
            <span className="text-sm font-semibold text-primary-700">
              {completedCount} / {totalLessonCount} · {progressPercent}%
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label={isArabic ? 'نسبة إكمال الدروس' : 'Lesson completion'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          {progressLoadFailed ? (
            <p role="status" className="mt-2 text-sm text-amber-700">
              {isArabic ? 'تعذر تحميل التقدم المحفوظ.' : 'Could not load saved progress.'}
            </p>
          ) : null}
          {enrollmentCompletedAt ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              {isArabic ? 'أكملت هذه الدورة.' : 'You have completed this course.'}
            </p>
          ) : null}
          <nav aria-label={isArabic ? 'التنقل بين الدروس' : 'Navigate lessons'} className="mt-4 flex flex-wrap gap-2">
            {lessons.map((lesson, index) => (
              <a
                key={lesson.id}
                href={`#lesson-${lesson.id}`}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {completedLessonIds.has(lesson.id) ? '✓ ' : ''}{index + 1}. {lessonTranslationMap.get(lesson.id)?.title ?? (isArabic ? 'درس' : 'Lesson')}
              </a>
            ))}
          </nav>
        </section>
      ) : null}

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
                              id={`lesson-${lesson.id}`}
                              className="flex flex-wrap items-center gap-3 py-4 scroll-mt-24"
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

                              {lesson.lesson_type === 'text' ? (
                                <div className="w-full space-y-5">
                                  {(lessonSectionsMap.get(lesson.id) ?? []).map(section => (
                                    <section key={section.id} className="space-y-2">
                                      {section.heading ? (
                                        <h4 className="text-base font-semibold leading-7 text-gray-900">
                                          {section.heading}
                                        </h4>
                                      ) : null}
                                      {section.text ? (
                                        <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                                          {section.text}
                                        </p>
                                      ) : null}
                                      {section.imageUrl ? (
                                        <img
                                          src={section.imageUrl}
                                          alt={section.heading}
                                          loading="lazy"
                                          className="h-auto max-h-[32rem] max-w-full rounded-xl object-contain"
                                        />
                                      ) : null}
                                    </section>
                                  ))}
                                  {lessonSectionsMap.has(lesson.id) ? null : (
                                    getContentText(lessonTranslationMap.get(lesson.id)?.content) ? (
                                      <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                                        {getContentText(lessonTranslationMap.get(lesson.id)?.content)}
                                      </p>
                                    ) : null
                                  )}
                                </div>
                              ) : null}

                              {isEnrolled
                                ? studentQuizzes
                                    .filter((quiz) => quiz.quiz_type === 'lesson' && quiz.lesson_id === lesson.id)
                                    .map((quiz) => (
                                      <CourseQuizPlayer key={quiz.id} quiz={quiz} locale={locale} />
                                    ))
                                : null}

                              {isEnrolled ? (
                                <LessonCompletionButton
                                  courseId={course.id}
                                  lessonId={lesson.id}
                                  locale={locale}
                                  completed={completedLessonIds.has(lesson.id)}
                                />
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

                    {isEnrolled
                      ? studentQuizzes
                          .filter((quiz) => quiz.quiz_type === 'module' && quiz.module_id === module.id)
                          .map((quiz) => (
                            <CourseQuizPlayer key={quiz.id} quiz={quiz} locale={locale} />
                          ))
                      : null}
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {isEnrolled
          ? studentQuizzes
              .filter((quiz) => quiz.quiz_type === 'final')
              .map((quiz) => (
                <CourseQuizPlayer key={quiz.id} quiz={quiz} locale={locale} />
              ))
          : null}
      </section>
    </main>
  );
}
