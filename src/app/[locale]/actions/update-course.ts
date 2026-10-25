'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/navigation';

export type CourseUpdateState = { error: string } | null;

type LessonType = 'video' | 'text' | 'file' | 'live';

type SectionInput = {
  id: string;
  heading_ar: string;
  heading_en: string;
  text_ar: string;
  text_en: string;
  image_ref: string;
};

type LessonInput = {
  id?: string;
  title_ar: string;
  title_en: string;
  lesson_type: LessonType;
  content_ar: string;
  content_en: string;
  sections: SectionInput[];
  duration_seconds: string;
  is_preview: boolean;
};

type ModuleInput = {
  id?: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  lessons: LessonInput[];
};


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

const lessonTypes: LessonType[] = ['video', 'text', 'file', 'live'];

function parseCurriculum(value: FormDataEntryValue | null, languageContentType: string): ModuleInput[] | null {
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

  let totalLessons = 0;
  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();

  for (const module of parsed) {
    if (!module || typeof module !== 'object') return null;

    if (
      typeof module.title_ar !== 'string' ||
      typeof module.title_en !== 'string' ||
      typeof module.description_ar !== 'string' ||
      typeof module.description_en !== 'string' ||
      !Array.isArray(module.lessons) ||
      module.lessons.length > 100
    ) return null;

    if (
      module.id !== undefined &&
      (typeof module.id !== 'string' || !module.id.trim() || moduleIds.has(module.id))
    ) return null;

    if (module.id) moduleIds.add(module.id);
    if ((requiresAr && !module.title_ar.trim()) ||
        (requiresEn && !module.title_en.trim())) return null;
    totalLessons += module.lessons.length;

    for (const lesson of module.lessons) {
      if (
        !lesson ||
        typeof lesson !== 'object' ||
        typeof lesson.title_ar !== 'string' ||
        typeof lesson.title_en !== 'string' ||
        !lessonTypes.includes(lesson.lesson_type) ||
        typeof lesson.content_ar !== 'string' ||
        typeof lesson.content_en !== 'string' ||
        !Array.isArray(lesson.sections) ||
        typeof lesson.is_preview !== 'boolean' ||
        typeof lesson.duration_seconds !== 'string'
      ) return null;

      if (
        lesson.id !== undefined &&
        (typeof lesson.id !== 'string' || !lesson.id.trim() || lessonIds.has(lesson.id))
      ) return null;

      if (lesson.id) lessonIds.add(lesson.id);
      if ((requiresAr && !lesson.title_ar.trim()) ||
          (requiresEn && !lesson.title_en.trim())) return null;

      if (lesson.sections.length > 100) return null;

      for (const section of lesson.sections) {
        if (
          !section ||
          typeof section.id !== 'string' ||
          typeof section.heading_ar !== 'string' ||
          typeof section.heading_en !== 'string' ||
          typeof section.text_ar !== 'string' ||
          typeof section.text_en !== 'string' ||
          typeof section.image_ref !== 'string'
        ) return null;
      }

      const duration = lesson.duration_seconds.trim();
      if (
        duration &&
        (!/^\d+$/.test(duration) ||
          !Number.isSafeInteger(Number(duration)) ||
          Number(duration) < 0)
      ) return null;
    }
  }

  if (totalLessons > 500) return null;
  return parsed as ModuleInput[];
}

function lessonContent(lesson: LessonInput, locale: 'ar' | 'en') {
  if (lesson.lesson_type !== 'text') return {};

  if (lesson.sections.length > 0) {
    return {
      sections: lesson.sections.map((section) => ({
        id: section.id,
        heading: locale === 'ar' ? section.heading_ar : section.heading_en,
        text: locale === 'ar' ? section.text_ar : section.text_en,
        image_ref: section.image_ref,
      })),
    };
  }

  return { text: locale === 'ar' ? lesson.content_ar : lesson.content_en };
}

export async function updateCourse(
  _previousState: CourseUpdateState,
  formData: FormData
): Promise<CourseUpdateState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'يجب تسجيل الدخول أولاً.' };

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError || !roles?.some((item) => item.role === 'admin')) {
    return { error: 'ليست لديك صلاحية تعديل الدورات.' };
  }

  const courseId = String(formData.get('course_id') ?? '').trim();
  const locale = String(formData.get('locale') ?? 'ar');
  const titleAr = String(formData.get('title_ar') ?? '').trim();
  const descriptionAr = String(formData.get('description_ar') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '').trim();
  const descriptionEn = String(formData.get('description_en') ?? '').trim();
  const status = String(formData.get('status') ?? '');
  const level = String(formData.get('level') ?? '');
  const languageCode = String(formData.get('language_code') ?? '');
  const languageContentType = String(formData.get('language_content_type') ?? '');
  const deliveryMode = String(formData.get('delivery_mode') ?? '');
  const pricing = String(formData.get('pricing') ?? '');
  const priceText = String(formData.get('price') ?? '').trim();
  const coverImageUrl = String(formData.get('cover_image_url') ?? '').trim();
  const modules = parseCurriculum(formData.get('course_content_json'), languageContentType);
  const quizzes = parseCourseQuizzes(formData.get('course_quizzes_json'), languageContentType);

  if (!courseId || (languageContentType !== 'en_only' && !titleAr) || (languageContentType !== 'ar_only' && !titleEn)) {
    return { error: 'يرجى إدخال عنوان الدورة باللغتين.' };
  }

  if (!modules) {
    return { error: 'بيانات المنهج غير صالحة. لم يتم حفظ أي تغيير.' };
  }

  if (!quizzes) {
    return { error: 'بيانات الاختبارات غير صالحة؛ تحقق من الأسئلة والإجابات الصحيحة ودرجات النجاح. لم يتم حفظ أي تغيير.' };
  }

  if (!['draft', 'in_review', 'published', 'archived'].includes(status)) {
    return { error: 'حالة الدورة غير صالحة.' };
  }
  if (!['beginner', 'intermediate', 'advanced', 'all_levels'].includes(level)) {
    return { error: 'مستوى الدورة غير صالح.' };
  }
  if (!['ar', 'en'].includes(languageCode)) {
    return { error: 'لغة الدورة غير صالحة.' };
  }
  if (!['ar_only', 'en_only', 'translated'].includes(languageContentType)) {
    return { error: 'نوع المحتوى اللغوي غير صالح.' };
  }
  if (!['recorded', 'live', 'recorded_and_live'].includes(deliveryMode)) {
    return { error: 'طريقة تقديم الدورة غير صالحة.' };
  }
  if (!['free', 'paid'].includes(pricing)) {
    return { error: 'نوع التسعير غير صالح.' };
  }

  const price = pricing === 'paid' ? Number(priceText) : 0;
  if (pricing === 'paid' && (!Number.isSafeInteger(price) || price <= 0)) {
    return { error: 'أدخل سعراً صحيحاً موجباً للدورة المدفوعة.' };
  }

  const { data: existing, error: lookupError } = await supabase
    .from('courses')
    .select('id, slug, cover_image_url, published_at')
    .eq('id', courseId)
    .maybeSingle();

  if (lookupError || !existing) {
    return { error: 'تعذر العثور على الدورة المطلوب تعديلها.' };
  }

  // Read and validate existing records before writing anything.
  const { data: existingModules, error: modulesReadError } = await supabase
    .from('course_modules')
    .select('id, course_id, sort_order')
    .eq('course_id', courseId);

  if (modulesReadError || !existingModules) {
    return { error: 'تعذر قراءة وحدات الدورة؛ لم يتم حفظ التغييرات.' };
  }

  const existingModuleIds = new Set(existingModules.map((item) => item.id));
  const submittedModuleIds = new Set(
    modules.flatMap((item) => item.id ? [item.id] : [])
  );

  for (const id of submittedModuleIds) {
    if (!existingModuleIds.has(id)) {
      return { error: 'تحتوي بيانات المنهج على وحدة لا تتبع هذه الدورة.' };
    }
  }

  if (existingModules.some((item) => !submittedModuleIds.has(item.id))) {
    return {
      error: 'لم يتم الحفظ لأن بعض الوحدات الموجودة غير موجودة في النموذج. لا ندعم حذف الوحدات حاليًا حفاظًا على البيانات.',
    };
  }

  const existingModuleIdList = existingModules.map((item) => item.id);
  let existingLessons: { id: string; module_id: string; sort_order: number | null }[] = [];

  if (existingModuleIdList.length > 0) {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('id, module_id, sort_order')
      .in('module_id', existingModuleIdList);

    if (error || !data) {
      return { error: 'تعذر قراءة دروس الدورة؛ لم يتم حفظ التغييرات.' };
    }
    existingLessons = data;
  }

  const existingLessonIds = new Set(existingLessons.map((item) => item.id));
  const submittedLessonIds = new Set(
    modules.flatMap((item) => item.lessons.flatMap((lesson) => lesson.id ? [lesson.id] : []))
  );

  for (const id of submittedLessonIds) {
    if (!existingLessonIds.has(id)) {
      return { error: 'يحتوي المنهج على درس لا يتبع هذه الدورة.' };
    }
  }

  if (existingLessons.some((item) => !submittedLessonIds.has(item.id))) {
    return {
      error: 'لم يتم الحفظ لأن بعض الدروس الموجودة غير موجودة في النموذج. لا ندعم حذف الدروس حاليًا حفاظًا على تقدم المتعلمين.',
    };
  }


  // Validate quiz ownership and preserve all persisted quiz/question/option records.
  const { data: existingQuizzes, error: quizzesReadError } = await supabase
    .from('course_quizzes')
    .select('id, quiz_type, module_id, lesson_id')
    .eq('course_id', courseId);

  if (quizzesReadError || !existingQuizzes) {
    return { error: 'تعذر قراءة اختبارات الدورة؛ لم يتم حفظ التغييرات.' };
  }

  const existingQuizIds = new Set(existingQuizzes.map((item) => item.id));
  const submittedQuizIds = new Set(quizzes.flatMap((item) => item.id ? [item.id] : []));

  for (const id of submittedQuizIds) {
    if (!existingQuizIds.has(id)) {
      return { error: 'يوجد اختبار بمعرّف لا يتبع هذه الدورة.' };
    }
  }

  if (existingQuizzes.some((item) => !submittedQuizIds.has(item.id))) {
    return { error: 'لم يتم الحفظ لأن اختبارًا محفوظًا غير موجود في النموذج. لا نحذف الاختبارات أو محاولات الطلاب.' };
  }

  const { data: existingQuestions, error: questionsReadError } = existingQuizIds.size
    ? await supabase.from('course_quiz_questions').select('id, quiz_id').in('quiz_id', [...existingQuizIds])
    : { data: [], error: null };

  if (questionsReadError || !existingQuestions) {
    return { error: 'تعذر قراءة أسئلة الاختبارات؛ لم يتم حفظ التغييرات.' };
  }

  const existingQuestionIds = new Set(existingQuestions.map((item) => item.id));
  const submittedQuestionIds = new Set(quizzes.flatMap((quiz) => quiz.questions.flatMap((item) => item.id ? [item.id] : [])));

  for (const question of quizzes.flatMap((quiz) => quiz.questions)) {
    if (question.id && !existingQuestionIds.has(question.id)) {
      return { error: 'يوجد سؤال بمعرّف لا يتبع اختبارات هذه الدورة.' };
    }
  }

  if ([...existingQuestionIds].some((id) => !submittedQuestionIds.has(id))) {
    return { error: 'لم يتم الحفظ لأن سؤالًا محفوظًا غير موجود في النموذج. لا نحذف الأسئلة المرتبطة بالمحاولات.' };
  }

  const { data: existingOptions, error: optionsReadError } = existingQuestionIds.size
    ? await supabase.from('course_quiz_options').select('id, question_id').in('question_id', [...existingQuestionIds])
    : { data: [], error: null };

  if (optionsReadError || !existingOptions) {
    return { error: 'تعذر قراءة خيارات الاختبارات؛ لم يتم حفظ التغييرات.' };
  }

  const existingOptionIds = new Set(existingOptions.map((item) => item.id));
  const submittedOptionIds = new Set(quizzes.flatMap((quiz) => quiz.questions.flatMap((question) => question.options.flatMap((item) => item.id ? [item.id] : []))));

  for (const option of quizzes.flatMap((quiz) => quiz.questions.flatMap((question) => question.options))) {
    if (option.id && !existingOptionIds.has(option.id)) {
      return { error: 'يوجد خيار إجابة بمعرّف لا يتبع أسئلة هذه الدورة.' };
    }
  }

  if ([...existingOptionIds].some((id) => !submittedOptionIds.has(id))) {
    return { error: 'لم يتم الحفظ لأن خيارًا محفوظًا غير موجود في النموذج. لا نحذف الخيارات المحفوظة.' };
  }

  const validModuleIds = new Set(existingModules.map((item) => item.id));
  const validLessonIds = new Set(existingLessons.map((item) => item.id));

  for (const quiz of quizzes) {
    if (quiz.id) {
      const oldQuiz = existingQuizzes.find((item) => item.id === quiz.id);
      if (
        !oldQuiz ||
        oldQuiz.quiz_type !== quiz.quiz_type ||
        (quiz.quiz_type === 'module' && oldQuiz.module_id !== quiz.module_id) ||
        (quiz.quiz_type === 'lesson' && oldQuiz.lesson_id !== quiz.lesson_id)
      ) {
        return { error: 'لا يمكن تغيير نوع الاختبار أو نقل اختبار محفوظ إلى عنصر آخر في هذه المرحلة.' };
      }
    }

    if (quiz.quiz_type === 'module' && !validModuleIds.has(quiz.module_id)) {
      return { error: 'اختبار الوحدة يجب أن يرتبط بوحدة محفوظة تابعة لهذه الدورة.' };
    }
    if (quiz.quiz_type === 'lesson' && !validLessonIds.has(quiz.lesson_id)) {
      return { error: 'اختبار الدرس يجب أن يرتبط بدرس محفوظ تابع لهذه الدورة.' };
    }
    if (quiz.quiz_type === 'lesson') {
      const selectedLesson = existingLessons.find((item) => item.id === quiz.lesson_id);
      if (
        !selectedLesson ||
        !validModuleIds.has(quiz.module_id) ||
        selectedLesson.module_id !== quiz.module_id
      ) {
        return { error: 'الوحدة والدرس المحددان غير متطابقين. حدّد الوحدة التي ينتمي إليها الدرس.' };
      }
    }

    for (const question of quiz.questions) {
      if (question.id) {
        const oldQuestion = existingQuestions.find((item) => item.id === question.id);
        if (!oldQuestion || oldQuestion.quiz_id !== quiz.id) {
          return { error: 'لا يمكن نقل سؤال محفوظ إلى اختبار آخر.' };
        }
      }

      for (const option of question.options) {
        if (option.id) {
          const oldOption = existingOptions.find((item) => item.id === option.id);
          if (!oldOption || oldOption.question_id !== question.id) {
            return { error: 'لا يمكن نقل خيار محفوظ إلى سؤال آخر.' };
          }
        }
      }
    }
  }

  // Save curriculum without deleting or recreating existing records.
  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    let moduleId = module.id;

    if (moduleId) {
      const { error } = await supabase
        .from('course_modules')
        .update({
          title: module.title_ar.trim(),
          description: module.description_ar.trim() || null,
          sort_order: moduleIndex,
        })
        .eq('id', moduleId)
        .eq('course_id', courseId);

      if (error) {
        return { error: 'تعذر حفظ إحدى الوحدات: ' + error.message };
      }
    } else {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: module.title_ar.trim(),
          description: module.description_ar.trim() || null,
          sort_order: moduleIndex,
        })
        .select('id')
        .single();

      if (error || !data) {
        return { error: 'تعذر إنشاء وحدة جديدة: ' + (error?.message ?? 'خطأ غير معروف') };
      }
      moduleId = data.id;
    }

    const { error: moduleTranslationsError } = await supabase
      .from('course_module_translations')
      .upsert([
        {
          module_id: moduleId,
          locale: 'ar',
          title: module.title_ar.trim(),
          description: module.description_ar.trim() || null,
        },
        {
          module_id: moduleId,
          locale: 'en',
          title: module.title_en.trim(),
          description: module.description_en.trim() || null,
        },
      ], { onConflict: 'module_id,locale' });

    if (moduleTranslationsError) {
      return { error: 'تعذر حفظ ترجمة إحدى الوحدات: ' + moduleTranslationsError.message };
    }

    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
      const lesson = module.lessons[lessonIndex];
      const durationText = lesson.duration_seconds.trim();
      const durationSeconds = durationText ? Number(durationText) : null;
      let lessonId = lesson.id;

      if (lessonId) {
        const { error } = await supabase
          .from('course_lessons')
          .update({
            module_id: moduleId,
            title: lesson.title_ar.trim(),
            lesson_type: lesson.lesson_type,
            sort_order: lessonIndex,
            duration_seconds: durationSeconds,
            is_preview: lesson.is_preview,
          })
          .eq('id', lessonId);

        if (error) {
          return { error: 'تعذر حفظ أحد الدروس: ' + error.message };
        }
      } else {
        const { data, error } = await supabase
          .from('course_lessons')
          .insert({
            module_id: moduleId,
            title: lesson.title_ar.trim(),
            lesson_type: lesson.lesson_type,
            content: {},
            sort_order: lessonIndex,
            duration_seconds: durationSeconds,
            is_preview: lesson.is_preview,
          })
          .select('id')
          .single();

        if (error || !data) {
          return { error: 'تعذر إنشاء درس جديد: ' + (error?.message ?? 'خطأ غير معروف') };
        }
        lessonId = data.id;
      }

      const { error: lessonTranslationsError } = await supabase
        .from('course_lesson_translations')
        .upsert([
          {
            lesson_id: lessonId,
            locale: 'ar',
            title: lesson.title_ar.trim(),
            content: lessonContent(lesson, 'ar'),
          },
          {
            lesson_id: lessonId,
            locale: 'en',
            title: lesson.title_en.trim(),
            content: lessonContent(lesson, 'en'),
          },
        ], { onConflict: 'lesson_id,locale' });

      if (lessonTranslationsError) {
        return { error: 'تعذر حفظ ترجمة أحد الدروس: ' + lessonTranslationsError.message };
      }
    }
  }


  // SAVE_COURSE_QUIZZES_V1
  // Save quizzes after the curriculum so newly created course records already have IDs.
  for (let quizIndex = 0; quizIndex < quizzes.length; quizIndex++) {
    const quiz = quizzes[quizIndex];
    const quizValues = {
      course_id: courseId,
      quiz_type: quiz.quiz_type,
      module_id: quiz.quiz_type === 'module' ? quiz.module_id : null,
      lesson_id: quiz.quiz_type === 'lesson' ? quiz.lesson_id : null,
      title: quiz.title_ar.trim(),
      description: quiz.description_ar.trim() || null,
      passing_score: Number(quiz.passing_score),
      attempts_allowed: quiz.attempts_allowed.trim() ? Number(quiz.attempts_allowed) : null,
      is_published: quiz.is_published,
      sort_order: quizIndex,
    };

    let quizId = quiz.id;
    if (quizId) {
      const { error } = await supabase
        .from('course_quizzes')
        .update(quizValues)
        .eq('id', quizId)
        .eq('course_id', courseId);
      if (error) return { error: 'تعذر حفظ الاختبار: ' + error.message };
    } else {
      const { data, error } = await supabase
        .from('course_quizzes')
        .insert({ ...quizValues, created_by: user.id })
        .select('id')
        .single();
      if (error || !data) return { error: 'تعذر إنشاء الاختبار: ' + (error?.message ?? 'خطأ غير معروف') };
      quizId = data.id;
    }

    const { error: quizTranslationsError } = await supabase
      .from('course_quiz_translations')
      .upsert([
        { quiz_id: quizId, locale: 'ar', title: quiz.title_ar.trim(), description: quiz.description_ar.trim() || null },
        { quiz_id: quizId, locale: 'en', title: quiz.title_en.trim(), description: quiz.description_en.trim() || null },
      ], { onConflict: 'quiz_id,locale' });

    if (quizTranslationsError) return { error: 'تعذر حفظ ترجمة الاختبار: ' + quizTranslationsError.message };

    for (let questionIndex = 0; questionIndex < quiz.questions.length; questionIndex++) {
      const question = quiz.questions[questionIndex];
      const questionValues = {
        quiz_id: quizId,
        question_type: question.question_type,
        points: Number(question.points),
        sort_order: questionIndex,
      };

      let questionId = question.id;
      if (questionId) {
        const { error } = await supabase
          .from('course_quiz_questions')
          .update(questionValues)
          .eq('id', questionId);
        if (error) return { error: 'تعذر حفظ سؤال: ' + error.message };
      } else {
        const { data, error } = await supabase
          .from('course_quiz_questions')
          .insert(questionValues)
          .select('id')
          .single();
        if (error || !data) return { error: 'تعذر إنشاء سؤال: ' + (error?.message ?? 'خطأ غير معروف') };
        questionId = data.id;
      }

      const { error: questionTranslationsError } = await supabase
        .from('course_quiz_question_translations')
        .upsert([
          { question_id: questionId, locale: 'ar', question_text: question.question_ar.trim(), explanation: question.explanation_ar.trim() || null },
          { question_id: questionId, locale: 'en', question_text: question.question_en.trim(), explanation: question.explanation_en.trim() || null },
        ], { onConflict: 'question_id,locale' });

      if (questionTranslationsError) return { error: 'تعذر حفظ ترجمة سؤال: ' + questionTranslationsError.message };

      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) {
        const option = question.options[optionIndex];
        let optionId = option.id;

        if (optionId) {
          const { error } = await supabase
            .from('course_quiz_options')
            .update({ question_id: questionId, sort_order: optionIndex })
            .eq('id', optionId);
          if (error) return { error: 'تعذر حفظ خيار إجابة: ' + error.message };
        } else {
          const { data, error } = await supabase
            .from('course_quiz_options')
            .insert({ question_id: questionId, sort_order: optionIndex })
            .select('id')
            .single();
          if (error || !data) return { error: 'تعذر إنشاء خيار إجابة: ' + (error?.message ?? 'خطأ غير معروف') };
          optionId = data.id;
        }

        const { error: optionTranslationsError } = await supabase
          .from('course_quiz_option_translations')
          .upsert([
            { option_id: optionId, locale: 'ar', option_text: option.text_ar.trim() },
            { option_id: optionId, locale: 'en', option_text: option.text_en.trim() },
          ], { onConflict: 'option_id,locale' });

        if (optionTranslationsError) return { error: 'تعذر حفظ ترجمة خيار إجابة: ' + optionTranslationsError.message };
      }

      const { error: deleteKeysError } = await supabase
        .from('course_quiz_answer_keys')
        .delete()
        .eq('question_id', questionId);
      if (deleteKeysError) return { error: 'تعذر تحديث الإجابات الصحيحة: ' + deleteKeysError.message };

      const correctOptionIds = question.options.flatMap((option) =>
        option.is_correct && option.id ? [option.id] : []
      );

      // New options receive database IDs above; recover their IDs by their translations.
      const { data: savedOptions, error: savedOptionsError } = await supabase
        .from('course_quiz_options')
        .select('id')
        .eq('question_id', questionId)
        .order('sort_order');

      if (savedOptionsError || !savedOptions || savedOptions.length !== question.options.length) {
        return { error: 'تعذر التحقق من خيارات السؤال بعد الحفظ.' };
      }

      const answerKeys = question.options.flatMap((option, index) =>
        option.is_correct ? [{ question_id: questionId, option_id: savedOptions[index].id }] : []
      );

      if (answerKeys.length !== correctOptionIds.length + question.options.filter((option) => option.is_correct && !option.id).length) {
        return { error: 'تعذر مطابقة الإجابات الصحيحة مع خيارات السؤال.' };
      }

      const { error: answerKeysError } = await supabase
        .from('course_quiz_answer_keys')
        .insert(answerKeys);

      if (answerKeysError) return { error: 'تعذر حفظ الإجابات الصحيحة: ' + answerKeysError.message };
    }
  }

  const updateValues: Record<string, unknown> = {
    status,
    level,
    language_code: languageCode,
    language_content_type: languageContentType,
    delivery_mode: deliveryMode,
    pricing,
    price,
    cover_image_url: coverImageUrl || null,
  };

  if (status === 'published' && !existing.published_at) {
    updateValues.published_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('courses')
    .update(updateValues)
    .eq('id', courseId);

  if (updateError) {
    return { error: 'تم حفظ المنهج، لكن تعذر حفظ بيانات الدورة: ' + updateError.message };
  }

  const { error: translationsError } = await supabase
    .from('course_translations')
    .upsert([
      { course_id: courseId, locale: 'ar', title: titleAr, description: descriptionAr },
      { course_id: courseId, locale: 'en', title: titleEn, description: descriptionEn },
    ], { onConflict: 'course_id,locale' });

  if (translationsError) {
    return {
      error: 'تم تحديث الدورة والمنهج، لكن تعذر حفظ الترجمة الأساسية. راجع الدورة قبل المتابعة.',
    };
  }

  redirect({
    href: '/admin/courses/' + existing.slug,
    locale: locale === 'en' ? 'en' : 'ar',
  });
  return null;
}
