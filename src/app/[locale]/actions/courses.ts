'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'

type CourseActionState = { error: string } | null

type CourseLessonSectionInput = {
  id: string;
  heading_ar: string;
  heading_en: string;
  text_ar: string;
  text_en: string;
  image_ref: string;
};

type CourseLessonInput = {
  draft_id: string;
  title_ar: string;
  title_en: string;
  lesson_type: 'video' | 'text' | 'file' | 'live';
  content_ar: string;
  content_en: string;
  sections: CourseLessonSectionInput[];
  duration_seconds: string;
  is_preview: boolean;
};

type CourseModuleInput = {
  draft_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  lessons: CourseLessonInput[];
};

function parseCourseContent(raw: string, languageContentType: string):
  | { data: CourseModuleInput[]; error: null }
  | { data: null; error: string } {
  const requiresAr = languageContentType !== 'en_only';
  const requiresEn = languageContentType !== 'ar_only';
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw || '[]');
  } catch {
    return { data: null, error: 'invalid_json' };
  }

  if (!Array.isArray(parsed) || parsed.length > 100) {
    return { data: null, error: 'invalid_modules' };
  }

  const modules: CourseModuleInput[] = [];
  const draftIds = new Set<string>();
  let lessonCount = 0;

  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { data: null, error: 'invalid_module' };
    }

    const value = item as Record<string, unknown>;
    const draftId = typeof value.draft_id === 'string' ? value.draft_id.trim() : '';
    if (!draftId || draftIds.has(draftId)) {
      return { data: null, error: 'invalid_draft_id' };
    }
    draftIds.add(draftId);
    const titleAr = typeof value.title_ar === 'string' ? value.title_ar.trim() : '';
    const titleEn = typeof value.title_en === 'string' ? value.title_en.trim() : '';
    const descriptionAr = typeof value.description_ar === 'string' ? value.description_ar.trim() : '';
    const descriptionEn = typeof value.description_en === 'string' ? value.description_en.trim() : '';

    if (
      (requiresAr && !titleAr) || (requiresEn && !titleEn) ||
      titleAr.length > 200 || titleEn.length > 200 ||
      descriptionAr.length > 5000 || descriptionEn.length > 5000 ||
      !Array.isArray(value.lessons) || value.lessons.length > 100
    ) {
      return { data: null, error: 'invalid_module_fields' };
    }

    const lessons: CourseLessonInput[] = [];

    for (const rawLesson of value.lessons) {
      if (!rawLesson || typeof rawLesson !== 'object' || Array.isArray(rawLesson)) {
        return { data: null, error: 'invalid_lesson' };
      }

      const lesson = rawLesson as Record<string, unknown>;
      const lessonDraftId = typeof lesson.draft_id === 'string' ? lesson.draft_id.trim() : '';
      if (!lessonDraftId || draftIds.has(lessonDraftId)) {
        return { data: null, error: 'invalid_draft_id' };
      }
      draftIds.add(lessonDraftId);
      const lessonTitleAr = typeof lesson.title_ar === 'string' ? lesson.title_ar.trim() : '';
      const lessonTitleEn = typeof lesson.title_en === 'string' ? lesson.title_en.trim() : '';
      const lessonType = lesson.lesson_type;
      const contentAr = typeof lesson.content_ar === 'string' ? lesson.content_ar.trim() : '';
      const contentEn = typeof lesson.content_en === 'string' ? lesson.content_en.trim() : '';
      const durationRaw = typeof lesson.duration_seconds === 'string'
        ? lesson.duration_seconds.trim()
        : '';
      const preview = lesson.is_preview;
      if (lesson.sections !== undefined && !Array.isArray(lesson.sections)) {
        return { data: null, error: 'invalid_lesson_sections' };
      }
      const rawSections = Array.isArray(lesson.sections) ? lesson.sections : [];
      if (rawSections.length > 100) {
        return { data: null, error: 'too_many_lesson_sections' };
      }
      const sections: CourseLessonSectionInput[] = [];
      for (const rawSection of rawSections) {
        if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) {
          return { data: null, error: 'invalid_lesson_section' };
        }
        const section = rawSection as Record<string, unknown>;
        const id = typeof section.id === 'string' ? section.id.trim() : '';
        const headingAr = typeof section.heading_ar === 'string' ? section.heading_ar.trim() : '';
        const headingEn = typeof section.heading_en === 'string' ? section.heading_en.trim() : '';
        const textAr = typeof section.text_ar === 'string' ? section.text_ar.trim() : '';
        const textEn = typeof section.text_en === 'string' ? section.text_en.trim() : '';
        const imageRef = typeof section.image_ref === 'string' ? section.image_ref.trim() : '';
        const hasContent = headingAr || headingEn || textAr || textEn || imageRef;
        if (!hasContent) continue;
        if (
          (requiresAr && (!headingAr || !textAr)) ||
          (requiresEn && (!headingEn || !textEn)) ||
          headingAr.length > 200 || headingEn.length > 200 ||
          textAr.length > 20000 || textEn.length > 20000 ||
          imageRef.length > 2048
        ) {
          return { data: null, error: 'invalid_lesson_section_fields' };
        }
        sections.push({
          id: id.slice(0, 100),
          heading_ar: headingAr,
          heading_en: headingEn,
          text_ar: textAr,
          text_en: textEn,
          image_ref: imageRef,
        });
      }

      if (
        (requiresAr && !lessonTitleAr) ||
        (requiresEn && !lessonTitleEn) ||
        lessonTitleAr.length > 200 || lessonTitleEn.length > 200 ||
        !['video', 'text', 'file', 'live'].includes(String(lessonType)) ||
        typeof preview !== 'boolean' ||
        contentAr.length > 20000 || contentEn.length > 20000
      ) {
        return { data: null, error: 'invalid_lesson_fields' };
      }

      if (
        lessonType === 'text' &&
        sections.length === 0 &&
        ((requiresAr && !contentAr) || (requiresEn && !contentEn))
      ) {
        return { data: null, error: 'missing_text_content' };
      }

      if (
        durationRaw !== '' &&
        (!/^\d+$/.test(durationRaw) || !Number.isSafeInteger(Number(durationRaw)))
      ) {
        return { data: null, error: 'invalid_duration' };
      }

      lessons.push({
        draft_id: lessonDraftId,
        title_ar: lessonTitleAr,
        title_en: lessonTitleEn,
        lesson_type: lessonType as CourseLessonInput['lesson_type'],
        content_ar: contentAr,
        content_en: contentEn,
        sections,
        duration_seconds: durationRaw,
        is_preview: preview,
      });

      lessonCount += 1;
      if (lessonCount > 500) {
        return { data: null, error: 'too_many_lessons' };
      }
    }

    modules.push({
      draft_id: draftId,
      title_ar: titleAr,
      title_en: titleEn,
      description_ar: descriptionAr,
      description_en: descriptionEn,
      lessons,
    });
  }

  return { data: modules, error: null };
}


type QuizOptionInput = {
  id?: string;
  text_ar: string;
  text_en: string;
  is_correct: boolean;
};

type QuizQuestionInput = {
  id?: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  question_ar: string;
  question_en: string;
  explanation_ar: string;
  explanation_en: string;
  points: string;
  options: QuizOptionInput[];
};

type QuizInput = {
  id?: string;
  quiz_type: 'lesson' | 'module' | 'final';
  module_id: string;
  lesson_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  passing_score: string;
  attempts_allowed: string;
  is_published: boolean;
  questions: QuizQuestionInput[];
};

function parseCourseQuizzes(value: FormDataEntryValue | null, languageContentType: string): QuizInput[] | null {
  const requiresAr = languageContentType !== 'en_only';
  const requiresEn = languageContentType !== 'ar_only';
  if (typeof value !== 'string' || !value.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length > 100) return null;

  const quizIds = new Set<string>();
  const questionIds = new Set<string>();
  const optionIds = new Set<string>();
  let totalQuestions = 0;
  let totalOptions = 0;

  for (const quiz of parsed) {
    if (!quiz || typeof quiz !== 'object') return null;

    if (
      !['lesson', 'module', 'final'].includes(quiz.quiz_type) ||
      typeof quiz.module_id !== 'string' ||
      typeof quiz.lesson_id !== 'string' ||
      typeof quiz.title_ar !== 'string' ||
      typeof quiz.title_en !== 'string' ||
      typeof quiz.description_ar !== 'string' ||
      typeof quiz.description_en !== 'string' ||
      typeof quiz.passing_score !== 'string' ||
      typeof quiz.attempts_allowed !== 'string' ||
      typeof quiz.is_published !== 'boolean' ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length > 200
    ) return null;

    if (
      quiz.id !== undefined &&
      (typeof quiz.id !== 'string' || !quiz.id.trim() || quizIds.has(quiz.id))
    ) return null;
    if (quiz.id) quizIds.add(quiz.id);

    if (
      (requiresAr && !quiz.title_ar.trim()) ||
      (requiresEn && !quiz.title_en.trim()) ||
      quiz.title_ar.length > 200 ||
      quiz.title_en.length > 200
    ) return null;

    const passingScore = Number(quiz.passing_score);
    if (
      !/^\d+$/.test(quiz.passing_score) ||
      !Number.isInteger(passingScore) ||
      passingScore < 0 ||
      passingScore > 100
    ) return null;

    if (
      quiz.attempts_allowed.trim() &&
      (!/^\d+$/.test(quiz.attempts_allowed.trim()) ||
        !Number.isSafeInteger(Number(quiz.attempts_allowed)) ||
        Number(quiz.attempts_allowed) < 1)
    ) return null;

    if (quiz.quiz_type === 'lesson') {
      if (!quiz.lesson_id) return null;
    } else if (quiz.quiz_type === 'module') {
      if (!quiz.module_id || quiz.lesson_id) return null;
    } else if (quiz.module_id || quiz.lesson_id) {
      return null;
    }

    totalQuestions += quiz.questions.length;
    if (totalQuestions > 1000) return null;

    for (const question of quiz.questions) {
      if (
        !question ||
        typeof question !== 'object' ||
        !['single_choice', 'multiple_choice', 'true_false'].includes(question.question_type) ||
        typeof question.question_ar !== 'string' ||
        typeof question.question_en !== 'string' ||
        typeof question.explanation_ar !== 'string' ||
        typeof question.explanation_en !== 'string' ||
        typeof question.points !== 'string' ||
        !Array.isArray(question.options) ||
        question.options.length > 20
      ) return null;

      if (
        question.id !== undefined &&
        (typeof question.id !== 'string' ||
          !question.id.trim() ||
          questionIds.has(question.id))
      ) return null;
      if (question.id) questionIds.add(question.id);

      const points = Number(question.points);
      if (
        (requiresAr && !question.question_ar.trim()) ||
        (requiresEn && !question.question_en.trim()) ||
        question.question_ar.length > 5000 ||
        question.question_en.length > 5000 ||
        !Number.isFinite(points) ||
        points <= 0 ||
        !/^\d+(\.\d{1,2})?$/.test(question.points)
      ) return null;

      if (
        question.options.length < 2 ||
        (question.question_type === 'true_false' && question.options.length !== 2)
      ) return null;

      totalOptions += question.options.length;
      if (totalOptions > 5000) return null;

      let correctCount = 0;
      for (const option of question.options) {
        if (
          !option ||
          typeof option !== 'object' ||
          typeof option.text_ar !== 'string' ||
          typeof option.text_en !== 'string' ||
          typeof option.is_correct !== 'boolean' ||
          (requiresAr && !option.text_ar.trim()) ||
          (requiresEn && !option.text_en.trim()) ||
          option.text_ar.length > 1000 ||
          option.text_en.length > 1000
        ) return null;

        if (
          option.id !== undefined &&
          (typeof option.id !== 'string' ||
            !option.id.trim() ||
            optionIds.has(option.id))
        ) return null;
        if (option.id) optionIds.add(option.id);
        if (option.is_correct) correctCount++;
      }

      if (
        correctCount < 1 ||
        (question.question_type !== 'multiple_choice' && correctCount !== 1)
      ) return null;
    }
  }

  return parsed as QuizInput[];
}


function isWrongLanguage(value: string, expected: 'ar' | 'en'): boolean {
  const hasArabic = /\p{Script=Arabic}/u.test(value);
  const hasLatin = /\p{Script=Latin}/u.test(value);

  return expected === 'ar'
    ? hasLatin && !hasArabic
    : hasArabic && !hasLatin;
}

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function makeSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createCourse(
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const localeValue = textValue(formData, 'locale')
  const locale = localeValue === 'en' ? 'en' : 'ar'
  const requestedStatus = textValue(formData, 'course_status') || 'draft'

  if (requestedStatus !== 'draft' && requestedStatus !== 'published') {
    return {
      error: locale === 'ar' ? 'حالة النشر غير صالحة.' : 'Invalid publication status.',
    }
  }

  const courseStatus = requestedStatus as 'draft' | 'published'
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect({ href: '/login', locale })
    return {
      error: locale === 'ar' ? 'يرجى تسجيل الدخول.' : 'Please sign in.',
    }
  }

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)

  if (rolesError || !roles?.some((role) => role.role === 'admin')) {
    return {
      error: locale === 'ar'
        ? 'لا تملك صلاحية إنشاء الدورات.'
        : 'You are not authorized to create courses.',
    }
  }

  const titleAr = textValue(formData, 'title_ar')
  const titleEn = textValue(formData, 'title_en')
  const descriptionAr = textValue(formData, 'description_ar')
  const descriptionEn = textValue(formData, 'description_en')
  const languageCode = textValue(formData, 'language_code')
  const languageContentType = textValue(formData, 'language_content_type')
  const level = textValue(formData, 'level')
  const deliveryMode = textValue(formData, 'delivery_mode')
  const pricing = textValue(formData, 'pricing')
  const priceInput = textValue(formData, 'price')
  const coverImageRef = textValue(formData, 'cover_image_url')

  const languageFields = [
    { value: titleAr, expected: 'ar' as const },
    { value: descriptionAr, expected: 'ar' as const },
    { value: titleEn, expected: 'en' as const },
    { value: descriptionEn, expected: 'en' as const },
  ]

  if (languageFields.some(({ value, expected }) =>
    value && isWrongLanguage(value, expected)
  )) {
    return {
      error: locale === 'ar'
        ? 'لغة أحد العناوين أو الأوصاف لا تطابق اللغة المطلوبة.'
        : 'A title or description uses the wrong language.',
    }
  }

  if (Boolean(descriptionAr) !== Boolean(descriptionEn)) {
    return {
      error: locale === 'ar'
        ? 'أدخل الوصف بالعربية والإنجليزية معًا، أو اترك الوصفين فارغين.'
        : 'Enter both Arabic and English descriptions, or leave both blank.',
    }
  }

  if (
    coverImageRef &&
    (!coverImageRef.startsWith('imagekit:') ||
      !coverImageRef.slice('imagekit:'.length).trim())
  ) {
    return {
      error: locale === 'ar'
        ? 'مرجع صورة الغلاف غير صالح.'
        : 'Invalid cover image reference.',
    }
  }

  if (!titleAr || !titleEn || titleAr.length > 200 || titleEn.length > 200) {
    return { error: locale === 'ar' ? 'أدخل عنوان الدورة باللغتين.' : 'Enter the course title in both languages.' }
  }

  if (!['ar', 'en'].includes(languageCode)) {
    return { error: locale === 'ar' ? 'لغة التدريس غير صالحة.' : 'Invalid teaching language.' }
  }

  if (!['ar_only', 'en_only', 'translated'].includes(languageContentType)) {
    return { error: locale === 'ar' ? 'نوع المحتوى اللغوي غير صالح.' : 'Invalid language content type.' }
  }

  if (!['beginner', 'intermediate', 'advanced', 'all_levels'].includes(level)) {
    return { error: locale === 'ar' ? 'مستوى الدورة غير صالح.' : 'Invalid course level.' }
  }

  if (!['recorded', 'live', 'recorded_and_live'].includes(deliveryMode)) {
    return { error: locale === 'ar' ? 'طريقة التقديم غير صالحة.' : 'Invalid delivery mode.' }
  }

  if (!['free', 'paid'].includes(pricing)) {
    return { error: locale === 'ar' ? 'نوع التسعير غير صالح.' : 'Invalid pricing type.' }
  }

  let price: number | null = null

  if (pricing !== 'free') {
    if (!/^[1-9]\d*$/.test(priceInput)) {
      return {
        error: locale === 'ar'
          ? 'أدخل سعراً صحيحاً موجباً للدورة المدفوعة.'
          : 'Enter a positive whole-number price for a paid course.',
      }
    }

    price = Number(priceInput)

    if (!Number.isSafeInteger(price)) {
      return { error: locale === 'ar' ? 'السعر أكبر من الحد المسموح.' : 'Price is too large.' }
    }
  }

  const contentResult = parseCourseContent(
    textValue(formData, 'course_content_json'),
    languageContentType,
  );

  if (!contentResult.data) {
    const messages: Record<string, [string, string]> = {
      invalid_json: ['بيانات الوحدات والدروس غير صالحة.', 'The module and lesson data is invalid.'],
      invalid_modules: ['عدد الوحدات أو بنيتها غير صالح.', 'The module list is invalid.'],
      invalid_module: ['بيانات إحدى الوحدات غير صالحة.', 'A module entry is invalid.'],
      invalid_module_fields: ['تحقق من عناوين الوحدات وأوصافها ودروسها.', 'Check module titles, descriptions, and lessons.'],
      invalid_lesson: ['بيانات أحد الدروس غير صالحة.', 'A lesson entry is invalid.'],
      invalid_lesson_fields: ['تحقق من عناوين الدروس ونوعها وبياناتها.', 'Check lesson titles, type, and fields.'],
      missing_text_content: ['أدخل محتوى الدرس النصي باللغتين.', 'Enter text lesson content in both languages.'],
      invalid_duration: ['مدة الدرس يجب أن تكون عددًا صحيحًا موجبًا أو صفرًا.', 'Lesson duration must be a non-negative whole number.'],
      too_many_lessons: ['عدد الدروس يتجاوز الحد المسموح.', 'The lesson count exceeds the allowed limit.'],
    };
    const message = messages[contentResult.error] ?? messages.invalid_json;
    return { error: locale === 'ar' ? message[0] : message[1] };
  }

  const modules = contentResult.data;
  const quizzes = parseCourseQuizzes(formData.get('course_quizzes_json'), languageContentType);
  if (!quizzes) {
    return {
      error: locale === 'ar'
        ? 'بيانات الاختبارات غير صالحة. راجع الأسئلة والخيارات والإجابات.'
        : 'Quiz data is invalid. Check questions, options, and correct answers.',
    };
  }

  const moduleDraftIds = new Set(modules.map(module => module.draft_id));
  for (const quiz of quizzes) {
    if (quiz.quiz_type === 'module' && !moduleDraftIds.has(quiz.module_id)) {
      return {
        error: locale === 'ar'
          ? 'اختبار إحدى الوحدات يشير إلى وحدة غير موجودة.'
          : 'A module quiz references a missing module.',
      };
    }
    if (quiz.quiz_type === 'lesson') {
      const targetModule = modules.find(module => module.draft_id === quiz.module_id);
      if (!targetModule || !targetModule.lessons.some(lesson => lesson.draft_id === quiz.lesson_id)) {
        return {
          error: locale === 'ar'
            ? 'اختبار أحد الدروس يشير إلى درس غير موجود في الوحدة المحددة.'
            : 'A lesson quiz references a lesson outside the selected module.',
        };
      }
    }
  }

  if (
    courseStatus === 'published' &&
    (modules.length === 0 || !modules.some((module) => module.lessons.length > 0))
  ) {
    return {
      error: locale === 'ar'
        ? 'أضف وحدة واحدة على الأقل ودرسًا واحدًا قبل نشر الدورة.'
        : 'Add at least one module and one lesson before publishing the course.',
    }
  }

  const baseSlug = makeSlug(titleEn) || 'course'
  let slug = baseSlug
  let suffix = 2

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: existing, error: slugError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (slugError) {
      return { error: locale === 'ar' ? 'تعذر التحقق من رابط الدورة.' : 'Could not verify the course slug.' }
    }

    if (!existing) break
    slug = baseSlug + '-' + suffix
    suffix += 1
  }

  if (suffix > 21) {
    slug = baseSlug + '-' + Date.now().toString(36)
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      instructor_id: userData.user.id,
      category_id: null,
      slug,
      status: courseStatus,
      published_at: courseStatus === 'published' ? new Date().toISOString() : null,
      delivery_mode: deliveryMode,
      pricing,
      price,
      currency_code: 'COINS',
      level,
      language_code: languageCode,
      language_content_type: languageContentType,
      cover_image_url: coverImageRef || null,
    })
    .select('id')
    .single()

  if (courseError || !course) {
    return {
      error: locale === 'ar'
        ? 'تعذر إنشاء الدورة. تحقق من إعدادات قاعدة البيانات والصلاحيات.'
        : 'Could not create the course. Check database configuration and permissions.',
    }
  }

  const { error: translationsError } = await supabase
    .from('course_translations')
    .insert([
      {
        course_id: course.id,
        locale: 'ar',
        title: titleAr,
        description: descriptionAr || null,
      },
      {
        course_id: course.id,
        locale: 'en',
        title: titleEn,
        description: descriptionEn || null,
      },
    ])

  if (translationsError) {
    const { error: cleanupError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id)

    return {
      error: locale === 'ar'
        ? cleanupError
          ? 'تعذر حفظ الترجمات، ولم ينجح تنظيف سجل الدورة تلقائياً. يلزم فحص قاعدة البيانات قبل إعادة المحاولة.'
          : 'تعذر حفظ الترجمات. أُلغيت محاولة إنشاء الدورة؛ يمكنك المحاولة مجدداً.'
        : cleanupError
          ? 'Translations failed and automatic cleanup also failed. Inspect the database before retrying.'
          : 'Could not save translations. The course creation was rolled back; please try again.',
    }
  }

  const cleanupCourse = async (): Promise<boolean> => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id);

    return !error;
  };

  const saveError = async (stage: string): Promise<CourseActionState> => {
    const cleaned = await cleanupCourse();

    const labels: Record<string, [string, string]> = {
      quiz: ['تعذر حفظ أحد الاختبارات.', 'Could not save a quiz.'],
      quiz_translation: ['تعذر حفظ ترجمات الاختبارات.', 'Could not save quiz translations.'],
      quiz_question: ['تعذر حفظ أحد أسئلة الاختبار.', 'Could not save a quiz question.'],
      quiz_question_translation: ['تعذر حفظ ترجمات أسئلة الاختبار.', 'Could not save question translations.'],
      quiz_option: ['تعذر حفظ أحد خيارات الإجابة.', 'Could not save a quiz option.'],
      quiz_option_translation: ['تعذر حفظ ترجمات خيارات الإجابة.', 'Could not save option translations.'],
      quiz_answer_key: ['تعذر حفظ الإجابات الصحيحة.', 'Could not save correct answers.'],
      module: ['تعذر حفظ إحدى الوحدات.', 'Could not save a course module.'],
      module_translation: ['تعذر حفظ ترجمات الوحدات.', 'Could not save module translations.'],
      lesson: ['تعذر حفظ أحد الدروس.', 'Could not save a course lesson.'],
      lesson_translation: ['تعذر حفظ ترجمات الدروس.', 'Could not save lesson translations.'],
    };

    const label = labels[stage] ?? labels.module;
    const detail = cleaned
      ? (locale === 'ar'
          ? ' أُزيلت الدورة التي أُنشئت لهذه المحاولة.'
          : ' The course created for this attempt was removed.')
      : (locale === 'ar'
          ? ' وفشل التنظيف التلقائي أيضًا؛ افحص قاعدة البيانات قبل إعادة المحاولة.'
          : ' Automatic cleanup also failed; inspect the database before retrying.');

    return { error: (locale === 'ar' ? label[0] : label[1]) + detail };
  };

  const savedModuleIds = new Map<string, string>();
  const savedLessonIds = new Map<string, string>();

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex];

    const { data: savedModule, error: moduleError } = await supabase
      .from('course_modules')
      .insert({
        course_id: course.id,
        title: module.title_ar,
        description: module.description_ar || null,
        sort_order: moduleIndex,
      })
      .select('id')
      .single();

    if (moduleError || !savedModule) {
      return await saveError('module');
    }
    savedModuleIds.set(module.draft_id, savedModule.id);

    const { error: moduleTranslationError } = await supabase
      .from('course_module_translations')
      .insert([
        {
          module_id: savedModule.id,
          locale: 'ar',
          title: module.title_ar,
          description: module.description_ar || null,
        },
        {
          module_id: savedModule.id,
          locale: 'en',
          title: module.title_en,
          description: module.description_en || null,
        },
      ]);

    if (moduleTranslationError) {
      return await saveError('module_translation');
    }

    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
      const lesson = module.lessons[lessonIndex];
      const duration = lesson.duration_seconds === ''
        ? null
        : Number(lesson.duration_seconds);

      const { data: savedLesson, error: lessonError } = await supabase
        .from('course_lessons')
        .insert({
          module_id: savedModule.id,
          title: lesson.title_ar,
          lesson_type: lesson.lesson_type,
          content: {},
          sort_order: lessonIndex,
          duration_seconds: duration,
          is_preview: lesson.is_preview,
        })
        .select('id')
        .single();

      if (lessonError || !savedLesson) {
        return await saveError('lesson');
      }
      savedLessonIds.set(lesson.draft_id, savedLesson.id);

      const arabicContent = lesson.lesson_type === 'text'
        ? lesson.sections.length > 0
          ? { sections: lesson.sections.map(section => ({
              id: section.id,
              heading: section.heading_ar,
              text: section.text_ar,
              image_ref: section.image_ref || null,
            })) }
          : { text: lesson.content_ar }
        : {};
      const englishContent = lesson.lesson_type === 'text'
        ? lesson.sections.length > 0
          ? { sections: lesson.sections.map(section => ({
              id: section.id,
              heading: section.heading_en,
              text: section.text_en,
              image_ref: section.image_ref || null,
            })) }
          : { text: lesson.content_en }
        : {};

      const { error: lessonTranslationError } = await supabase
        .from('course_lesson_translations')
        .insert([
          {
            lesson_id: savedLesson.id,
            locale: 'ar',
            title: lesson.title_ar,
            content: arabicContent,
          },
          {
            lesson_id: savedLesson.id,
            locale: 'en',
            title: lesson.title_en,
            content: englishContent,
          },
        ]);

      if (lessonTranslationError) {
        return await saveError('lesson_translation');
      }
    }
  }


  for (let quizIndex = 0; quizIndex < quizzes.length; quizIndex += 1) {
    const quiz = quizzes[quizIndex];
    const { data: savedQuiz, error: quizError } = await supabase
      .from('course_quizzes')
      .insert({
        course_id: course.id,
        module_id: quiz.quiz_type === 'module' ? savedModuleIds.get(quiz.module_id) : null,
        lesson_id: quiz.quiz_type === 'lesson' ? savedLessonIds.get(quiz.lesson_id) : null,
        quiz_type: quiz.quiz_type,
        title: quiz.title_ar.trim(),
        description: quiz.description_ar.trim() || null,
        passing_score: Number(quiz.passing_score),
        attempts_allowed: quiz.attempts_allowed.trim() ? Number(quiz.attempts_allowed) : null,
        is_published: quiz.is_published,
        sort_order: quizIndex,
        created_by: userData.user.id,
      })
      .select('id')
      .single();

    if (quizError || !savedQuiz) return await saveError('quiz');

    const { error: quizTranslationError } = await supabase
      .from('course_quiz_translations')
      .insert([
        { quiz_id: savedQuiz.id, locale: 'ar', title: quiz.title_ar.trim(), description: quiz.description_ar.trim() || null },
        { quiz_id: savedQuiz.id, locale: 'en', title: quiz.title_en.trim(), description: quiz.description_en.trim() || null },
      ]);
    if (quizTranslationError) return await saveError('quiz_translation');

    for (let questionIndex = 0; questionIndex < quiz.questions.length; questionIndex += 1) {
      const question = quiz.questions[questionIndex];
      const { data: savedQuestion, error: questionError } = await supabase
        .from('course_quiz_questions')
        .insert({
          quiz_id: savedQuiz.id,
          question_type: question.question_type,
          points: Number(question.points),
          sort_order: questionIndex,
        })
        .select('id')
        .single();

      if (questionError || !savedQuestion) return await saveError('quiz_question');

      const { error: questionTranslationError } = await supabase
        .from('course_quiz_question_translations')
        .insert([
          { question_id: savedQuestion.id, locale: 'ar', question_text: question.question_ar.trim(), explanation: question.explanation_ar.trim() || null },
          { question_id: savedQuestion.id, locale: 'en', question_text: question.question_en.trim(), explanation: question.explanation_en.trim() || null },
        ]);
      if (questionTranslationError) return await saveError('quiz_question_translation');

      const correctOptionIds: string[] = [];
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        const { data: savedOption, error: optionError } = await supabase
          .from('course_quiz_options')
          .insert({ question_id: savedQuestion.id, sort_order: optionIndex })
          .select('id')
          .single();

        if (optionError || !savedOption) return await saveError('quiz_option');

        const { error: optionTranslationError } = await supabase
          .from('course_quiz_option_translations')
          .insert([
            { option_id: savedOption.id, locale: 'ar', option_text: option.text_ar.trim() },
            { option_id: savedOption.id, locale: 'en', option_text: option.text_en.trim() },
          ]);
        if (optionTranslationError) return await saveError('quiz_option_translation');

        if (option.is_correct) correctOptionIds.push(savedOption.id);
      }

      const { error: answerKeyError } = await supabase
        .from('course_quiz_answer_keys')
        .insert(correctOptionIds.map(optionId => ({
          question_id: savedQuestion.id,
          option_id: optionId,
        })));
      if (answerKeyError) return await saveError('quiz_answer_key');
    }
  }

  redirect({ href: '/admin/courses', locale })
  return null
}
