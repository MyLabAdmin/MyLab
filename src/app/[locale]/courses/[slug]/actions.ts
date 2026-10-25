'use server';

import { createClient } from '@/lib/supabase/server';

export type CoursePurchaseInvoice = {
  enrollment_id: string;
  purchase_id: string;
  invoice_number: string;
  course_id: string;
  course_title: string;
  purchased_at: string;
  price_paid: number;
  currency_code: string;
};

export type CourseEnrollmentResult =
  | {
      success: true;
      enrollmentId: string;
      alreadyEnrolled?: true;
      invoice?: CoursePurchaseInvoice;
    }
  | { success: false; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function enrollInCourse(
  courseId: string,
  locale: string,
): Promise<CourseEnrollmentResult> {
  const isArabic = locale === 'ar';

  if (typeof courseId !== 'string' || !UUID_PATTERN.test(courseId)) {
    return { success: false, message: isArabic ? 'معرّف الدورة غير صالح.' : 'Invalid course ID.' };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { success: false, message: isArabic ? 'يرجى تسجيل الدخول أولاً.' : 'Please sign in first.' };
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('pricing')
    .eq('id', courseId)
    .eq('status', 'published')
    .eq('is_suspended', false)
    .maybeSingle();

  if (courseError || !course) {
    return { success: false, message: isArabic ? 'الدورة غير متاحة حاليًا.' : 'The course is currently unavailable.' };
  }

  if (course.pricing !== 'free' && course.pricing !== 'paid') {
    return { success: false, message: isArabic ? 'نوع تسعير الدورة غير مدعوم.' : 'This course pricing type is not supported.' };
  }

  if (course.pricing === 'free') {
    const { data, error } = await supabase.rpc(
      'enroll_in_free_course',
      { p_course_id: courseId },
    );

    if (error || !data) {
      console.error('Free course enrollment failed:', error?.code);
      return {
        success: false,
        message: isArabic ? 'تعذّر التسجيل في الدورة. حاول مجددًا.' : 'Could not enroll in the course. Please try again.',
      };
    }

    return { success: true, enrollmentId: data as string };
  }

  const { data, error } = await supabase.rpc(
    'purchase_course_with_invoice',
    {
      p_course_id: courseId,
      p_locale: locale === 'ar' ? 'ar' : 'en',
    },
  );

  if (error || !data || typeof data !== 'object') {
    console.error('Course purchase failed:', error?.code);
    return {
      success: false,
      message: isArabic ? 'تعذّر الشراء. تحقق من رصيد المحفظة وحاول مجددًا.' : 'Purchase failed. Check your wallet balance and try again.',
    };
  }

  const response = data as Record<string, unknown>;

  if (
    response.already_enrolled === true &&
    typeof response.enrollment_id === 'string'
  ) {
    return {
      success: true,
      enrollmentId: response.enrollment_id,
      alreadyEnrolled: true,
    };
  }

  const invoice = data as CoursePurchaseInvoice;

  if (
    typeof invoice.enrollment_id !== 'string' ||
    typeof invoice.purchase_id !== 'string' ||
    typeof invoice.invoice_number !== 'string' ||
    typeof invoice.course_id !== 'string' ||
    typeof invoice.course_title !== 'string' ||
    typeof invoice.purchased_at !== 'string' ||
    typeof invoice.price_paid !== 'number' ||
    typeof invoice.currency_code !== 'string'
  ) {
    console.error('Invalid course invoice response');
    return {
      success: false,
      message:
        isArabic ? 'تعذّر التحقق من بيانات الفاتورة. راجع سجل الشراء قبل إعادة المحاولة.' : 'Could not verify invoice details. Check your purchase history before retrying.',
    };
  }

  return {
    success: true,
    enrollmentId: invoice.enrollment_id,
    invoice,
  };
}


export type LessonProgressResult =
  | {
      success: true;
      completedLessons: number;
      totalLessons: number;
      courseCompleted: boolean;
    }
  | { success: false; message: string };

export async function markCourseLessonComplete(
  courseId: string,
  lessonId: string,
  locale: string,
): Promise<LessonProgressResult> {
  const isArabic = locale === 'ar';
  const invalidMessage = isArabic ? 'معرّف الدورة أو الدرس غير صالح.' : 'Invalid course or lesson ID.';

  if (
    typeof courseId !== 'string' ||
    !UUID_PATTERN.test(courseId) ||
    typeof lessonId !== 'string' ||
    !UUID_PATTERN.test(lessonId)
  ) {
    return { success: false, message: invalidMessage };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: isArabic ? 'يرجى تسجيل الدخول أولاً.' : 'Please sign in first.',
    };
  }

  const { data, error } = await supabase.rpc('mark_course_lesson_complete', {
    p_course_id: courseId,
    p_lesson_id: lessonId,
  });

  if (error || !data || typeof data !== 'object') {
    console.error('Mark lesson complete failed:', error?.code);
    return {
      success: false,
      message: isArabic ? 'تعذر حفظ إكمال الدرس. حاول مجددًا.' : 'Could not save lesson completion. Please try again.',
    };
  }

  const result = data as Record<string, unknown>;
  if (
    result.success !== true ||
    typeof result.completed_lessons !== 'number' ||
    typeof result.total_lessons !== 'number' ||
    typeof result.course_completed !== 'boolean'
  ) {
    console.error('Invalid lesson completion response');
    return {
      success: false,
      message: isArabic ? 'تعذر التحقق من نتيجة الحفظ.' : 'Could not verify the save result.',
    };
  }

  return {
    success: true,
    completedLessons: result.completed_lessons,
    totalLessons: result.total_lessons,
    courseCompleted: result.course_completed,
  };
}

export async function saveCourseLessonPosition(
  courseId: string,
  lessonId: string,
  positionSeconds: number,
  locale: string,
): Promise<{ success: true } | { success: false; message: string }> {
  const isArabic = locale === 'ar';
  const failure = isArabic ? 'تعذر حفظ موضع الدرس.' : 'Could not save lesson position.';

  if (
    typeof courseId !== 'string' ||
    !UUID_PATTERN.test(courseId) ||
    typeof lessonId !== 'string' ||
    !UUID_PATTERN.test(lessonId) ||
    !Number.isSafeInteger(positionSeconds) ||
    positionSeconds < 0
  ) {
    return {
      success: false,
      message: isArabic ? 'بيانات موضع الدرس غير صالحة.' : 'Invalid lesson position.',
    };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: isArabic ? 'يرجى تسجيل الدخول أولاً.' : 'Please sign in first.',
    };
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    return {
      success: false,
      message: isArabic ? 'يجب التسجيل في الدورة أولاً.' : 'You must enroll in this course first.',
    };
  }

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId);

  if (modulesError || !modules?.length) {
    return { success: false, message: failure };
  }

  const moduleIds = modules.map((module) => module.id);
  const { data: lesson, error: lessonError } = await supabase
    .from('course_lessons')
    .select('id')
    .eq('id', lessonId)
    .in('module_id', moduleIds)
    .maybeSingle();

  if (lessonError || !lesson) {
    return {
      success: false,
      message: isArabic ? 'هذا الدرس لا ينتمي إلى الدورة المحددة.' : 'This lesson does not belong to this course.',
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from('course_lesson_progress')
    .select('completed_at')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existingError) {
    console.error('Read lesson progress failed:', existingError.code);
    return { success: false, message: failure };
  }

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from('course_lesson_progress')
      .update({
        last_position_seconds: positionSeconds,
        updated_at: now,
      })
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('Update lesson position failed:', error.code);
      return { success: false, message: failure };
    }
  } else {
    const { error } = await supabase
      .from('course_lesson_progress')
      .insert({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        last_position_seconds: positionSeconds,
        completed_at: null,
        updated_at: now,
      });

    if (error) {
      console.error('Insert lesson position failed:', error.code);
      return { success: false, message: failure };
    }
  }

  return { success: true };
}


export type CourseQuizSubmissionResult =
  | {
      success: true;
      attemptId: string;
      attemptNumber: number;
      score: number;
      totalPoints: number;
      percentage: number;
      passed: boolean;
      passingScore: number;
    }
  | { success: false; message: string };

export async function submitCourseQuiz(
  quizId: string,
  answers: { question_id: string; option_ids: string[] }[],
  locale: string,
): Promise<CourseQuizSubmissionResult> {
  const isArabic = locale === 'ar';
  const failureMessage = isArabic
    ? 'تعذّر إرسال الاختبار. تحقق من إجاباتك وحاول مجددًا.'
    : 'Could not submit the quiz. Check your answers and try again.';

  if (
    typeof quizId !== 'string' ||
    !UUID_PATTERN.test(quizId) ||
    !Array.isArray(answers) ||
    answers.length > 200
  ) {
    return {
      success: false,
      message: isArabic ? 'بيانات الاختبار غير صالحة.' : 'Invalid quiz submission.',
    };
  }

  const seenQuestions = new Set<string>();
  for (const answer of answers) {
    if (
      !answer ||
      typeof answer.question_id !== 'string' ||
      !UUID_PATTERN.test(answer.question_id) ||
      seenQuestions.has(answer.question_id) ||
      !Array.isArray(answer.option_ids) ||
      answer.option_ids.length > 100 ||
      answer.option_ids.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id)) ||
      new Set(answer.option_ids).size !== answer.option_ids.length
    ) {
      return {
        success: false,
        message: isArabic ? 'إحدى الإجابات غير صالحة.' : 'One or more answers are invalid.',
      };
    }
    seenQuestions.add(answer.question_id);
  }

  if (answers.length === 0) {
    return {
      success: false,
      message: isArabic ? 'أجب عن أسئلة الاختبار أولًا.' : 'Answer the quiz questions first.',
    };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: isArabic ? 'يرجى تسجيل الدخول أولًا.' : 'Please sign in first.',
    };
  }

  const { data, error } = await supabase.rpc('submit_course_quiz', {
    p_quiz_id: quizId,
    p_answers: answers,
  });

  if (error || !data || typeof data !== 'object') {
    console.error('Submit course quiz failed:', error?.code);
    return { success: false, message: failureMessage };
  }

  const result = data as Record<string, unknown>;
  if (
    result.success !== true ||
    typeof result.attempt_id !== 'string' ||
    typeof result.attempt_number !== 'number' ||
    typeof result.score !== 'number' ||
    typeof result.total_points !== 'number' ||
    typeof result.percentage !== 'number' ||
    typeof result.passed !== 'boolean' ||
    typeof result.passing_score !== 'number'
  ) {
    console.error('Invalid course quiz submission response');
    return {
      success: false,
      message: isArabic ? 'تعذّر التحقق من نتيجة الاختبار.' : 'Could not verify the quiz result.',
    };
  }

  return {
    success: true,
    attemptId: result.attempt_id,
    attemptNumber: result.attempt_number,
    score: result.score,
    totalPoints: result.total_points,
    percentage: result.percentage,
    passed: result.passed,
    passingScore: result.passing_score,
  };
}
