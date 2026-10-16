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
