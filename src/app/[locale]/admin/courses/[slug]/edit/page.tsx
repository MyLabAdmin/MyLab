import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/navigation/AppHeader';
import { resolveAvatarUrl } from '@/lib/storage/avatar-server';
import { redirect, Link } from '@/i18n/navigation';
import EditCourseForm from './EditCourseForm';
import type { CourseQuizDraft } from '@/components/admin/CourseQuizEditor';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
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
    .select(`
      id, slug, status, pricing, price, level, language_code, language_content_type,
      delivery_mode, cover_image_url,
      course_translations(locale, title, description),
      course_modules(
        id, title, description, sort_order,
        course_module_translations(locale, title, description),
        course_lessons(
          id, title, lesson_type, content, is_preview, sort_order,
          duration_seconds,
          course_lesson_translations(locale, title, content)
        )
      )
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !course) {
    return (
      <main className="mx-auto max-w-4xl p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {locale === 'ar' ? 'تعذر العثور على الدورة.' : 'Course not found.'}
        </p>
        <Link className="mt-4 inline-block underline" href="/admin/courses">
          {locale === 'ar' ? 'العودة إلى الدورات' : 'Back to courses'}
        </Link>
      </main>
    );
  }


  // Load course quizzes separately so the existing curriculum query stays unchanged.
  const { data: quizRows, error: quizzesError } = await supabase
    .from('course_quizzes')
    .select('id, quiz_type, module_id, lesson_id, title, description, passing_score, attempts_allowed, is_published, sort_order')
    .eq('course_id', course.id)
    .order('sort_order');

  if (quizzesError) throw new Error('تعذر تحميل اختبارات الدورة.');

  const quizIds = (quizRows ?? []).map((quiz) => quiz.id);

  const { data: quizTranslationRows, error: quizTranslationsError } = quizIds.length
    ? await supabase.from('course_quiz_translations')
        .select('quiz_id, locale, title, description')
        .in('quiz_id', quizIds)
    : { data: [], error: null };

  if (quizTranslationsError) throw new Error('تعذر تحميل ترجمات الاختبارات.');

  const { data: questionRows, error: questionsError } = quizIds.length
    ? await supabase.from('course_quiz_questions')
        .select('id, quiz_id, question_type, points, sort_order')
        .in('quiz_id', quizIds)
        .order('sort_order')
    : { data: [], error: null };

  if (questionsError) throw new Error('تعذر تحميل أسئلة الاختبارات.');

  const questionIds = (questionRows ?? []).map((question) => question.id);

  const { data: questionTranslationRows, error: questionTranslationsError } = questionIds.length
    ? await supabase.from('course_quiz_question_translations')
        .select('question_id, locale, question_text, explanation')
        .in('question_id', questionIds)
    : { data: [], error: null };

  if (questionTranslationsError) throw new Error('تعذر تحميل ترجمات الأسئلة.');

  const { data: optionRows, error: optionsError } = questionIds.length
    ? await supabase.from('course_quiz_options')
        .select('id, question_id, sort_order')
        .in('question_id', questionIds)
        .order('sort_order')
    : { data: [], error: null };

  if (optionsError) throw new Error('تعذر تحميل خيارات الإجابة.');

  const optionIds = (optionRows ?? []).map((option) => option.id);

  const { data: optionTranslationRows, error: optionTranslationsError } = optionIds.length
    ? await supabase.from('course_quiz_option_translations')
        .select('option_id, locale, option_text')
        .in('option_id', optionIds)
    : { data: [], error: null };

  if (optionTranslationsError) throw new Error('تعذر تحميل ترجمات الخيارات.');

  const { data: answerKeyRows, error: answerKeysError } = questionIds.length
    ? await supabase.from('course_quiz_answer_keys')
        .select('question_id, option_id')
        .in('question_id', questionIds)
    : { data: [], error: null };

  if (answerKeysError) throw new Error('تعذر تحميل مفاتيح الإجابات للمحرر.');

  const initialQuizzes: CourseQuizDraft[] = (quizRows ?? []).map((quiz) => {
    const lessonModule = quiz.quiz_type === 'lesson'
      ? (course.course_modules ?? []).find((module) =>
          (module.course_lessons ?? []).some((lesson) => lesson.id === quiz.lesson_id)
        )
      : null;
    const quizTranslations = (quizTranslationRows ?? []).filter(
      (row) => row.quiz_id === quiz.id,
    );
    const quizAr = quizTranslations.find((row) => row.locale === 'ar');
    const quizEn = quizTranslations.find((row) => row.locale === 'en');

    const questions = (questionRows ?? [])
      .filter((question) => question.quiz_id === quiz.id)
      .map((question) => {
        const translations = (questionTranslationRows ?? []).filter(
          (row) => row.question_id === question.id,
        );
        const arTranslation = translations.find((row) => row.locale === 'ar');
        const enTranslation = translations.find((row) => row.locale === 'en');

        const options = (optionRows ?? [])
          .filter((option) => option.question_id === question.id)
          .map((option) => {
            const optionTranslations = (optionTranslationRows ?? []).filter(
              (row) => row.option_id === option.id,
            );
            return {
              id: option.id,
              text_ar: optionTranslations.find((row) => row.locale === 'ar')?.option_text ?? '',
              text_en: optionTranslations.find((row) => row.locale === 'en')?.option_text ?? '',
              is_correct: (answerKeyRows ?? []).some(
                (key) => key.question_id === question.id && key.option_id === option.id,
              ),
            };
          });

        return {
          id: question.id,
          question_type: question.question_type,
          question_ar: arTranslation?.question_text ?? '',
          question_en: enTranslation?.question_text ?? '',
          explanation_ar: arTranslation?.explanation ?? '',
          explanation_en: enTranslation?.explanation ?? '',
          points: String(question.points ?? 1),
          options,
        };
      });

    return {
      id: quiz.id,
      quiz_type: quiz.quiz_type,
      module_id: quiz.module_id || lessonModule?.id || '',
      lesson_id: quiz.lesson_id ?? '',
      title_ar: quizAr?.title ?? (quiz.quiz_type === 'final' ? quiz.title : ''),
      title_en: quizEn?.title ?? (quiz.quiz_type === 'final' ? quiz.title : ''),
      description_ar: quizAr?.description ?? quiz.description ?? '',
      description_en: quizEn?.description ?? quiz.description ?? '',
      passing_score: String(quiz.passing_score ?? 70),
      attempts_allowed: quiz.attempts_allowed == null ? '' : String(quiz.attempts_allowed),
      is_published: Boolean(quiz.is_published),
      questions,
    };
  });

  const translations = Array.isArray(course.course_translations)
    ? course.course_translations
    : [];
  const ar = translations.find((item) => item.locale === 'ar');
  const en = translations.find((item) => item.locale === 'en');

  const initialModules = (course.course_modules ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((module) => {
      const moduleTranslations = Array.isArray(module.course_module_translations)
        ? module.course_module_translations
        : [];
      const moduleAr = moduleTranslations.find((item) => item.locale === 'ar');
      const moduleEn = moduleTranslations.find((item) => item.locale === 'en');

      const lessons = (module.course_lessons ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((lesson) => {
          const lessonTranslations = Array.isArray(lesson.course_lesson_translations)
            ? lesson.course_lesson_translations
            : [];
          const lessonAr = lessonTranslations.find((item) => item.locale === 'ar');
          const lessonEn = lessonTranslations.find((item) => item.locale === 'en');
          const contentAr = lessonAr?.content ?? {};
          const contentEn = lessonEn?.content ?? {};
          type SectionContent = {
            id?: string;
            heading?: string;
            text?: string;
            image_ref?: string;
          };
          const sectionsAr: SectionContent[] = Array.isArray(contentAr.sections)
            ? contentAr.sections as SectionContent[]
            : [];
          const sectionsEn: SectionContent[] = Array.isArray(contentEn.sections)
            ? contentEn.sections as SectionContent[]
            : [];

          const sections = sectionsAr.map((section: SectionContent, index: number) => {
            const translated = sectionsEn.find((item: SectionContent) => item.id === section.id)
              ?? sectionsEn[index]
              ?? {};

            return {
              id: String(section.id ?? translated.id ?? `section-${index + 1}`),
              heading_ar: String(section.heading ?? ''),
              heading_en: String(translated.heading ?? ''),
              text_ar: String(section.text ?? ''),
              text_en: String(translated.text ?? ''),
              image_ref: String(section.image_ref ?? translated.image_ref ?? ''),
            };
          });

          return {
            id: lesson.id,
            title_ar: lessonAr?.title ?? lesson.title ?? '',
            title_en: lessonEn?.title ?? lesson.title ?? '',
            lesson_type: lesson.lesson_type,
            content_ar: typeof contentAr.text === 'string' ? contentAr.text : '',
            content_en: typeof contentEn.text === 'string' ? contentEn.text : '',
            sections,
            duration_seconds: lesson.duration_seconds == null
              ? ''
              : String(lesson.duration_seconds),
            is_preview: Boolean(lesson.is_preview),
          };
        });

      return {
        id: module.id,
        title_ar: moduleAr?.title ?? module.title ?? '',
        title_en: moduleEn?.title ?? module.title ?? '',
        description_ar: moduleAr?.description ?? module.description ?? '',
        description_en: moduleEn?.description ?? module.description ?? '',
        lessons,
      };
    });

  return (
    <>

      <AppHeader
        locale={locale === 'ar' ? 'ar' : 'en'}
        userId={user.id}
        displayName={displayName}
        avatarUrl={avatarUrl}
        title={locale === 'ar' ? 'تعديل بيانات الدورة' : 'Edit course details'}
      />
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
<EditCourseForm
        locale={locale === 'en' ? 'en' : 'ar'}
        course={{
          id: course.id,
          slug: course.slug,
          status: course.status,
          pricing: course.pricing,
          price: course.price == null ? '' : String(course.price),
          level: course.level ?? 'beginner',
          language_code: course.language_code ?? 'ar',
          language_content_type: course.language_content_type ?? (course.language_code === 'en' ? 'en_only' : 'ar_only'),
          delivery_mode: course.delivery_mode ?? 'recorded',
          cover_image_url: course.cover_image_url ?? '',
          title_ar: ar?.title ?? '',
          description_ar: ar?.description ?? '',
          title_en: en?.title ?? '',
          description_en: en?.description ?? '',
        }}
        initialModules={initialModules}
        initialQuizzes={initialQuizzes}
      />
    </main>
    </>
  );
}
