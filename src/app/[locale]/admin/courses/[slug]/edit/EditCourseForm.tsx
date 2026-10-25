'use client';

import { useActionState, useState } from 'react';
import ImageUpload from '@/components/auth/ImageUpload';
import CourseCurriculumEditor, { type CourseModuleDraft } from '@/components/admin/CourseCurriculumEditor';
import CourseQuizEditor, { type CourseQuizDraft } from '@/components/admin/CourseQuizEditor';
import { updateCourse } from '@/app/[locale]/actions/update-course';

type CourseFormData = {
  id: string;
  slug: string;
  status: string;
  pricing: string;
  price: string;
  level: string;
  language_code: string;
  language_content_type: string;
  delivery_mode: string;
  cover_image_url: string;
  title_ar: string;
  description_ar: string;
  title_en: string;
  description_en: string;
};

export default function EditCourseForm({
  locale,
  course,
  initialModules,
  initialQuizzes,
}: {
  locale: 'ar' | 'en';
  course: CourseFormData;
  initialModules: CourseModuleDraft[];
  initialQuizzes: CourseQuizDraft[];
}) {
  const [state, formAction, pending] = useActionState(updateCourse, null);
  const [languageContentType, setLanguageContentType] = useState<'ar_only' | 'en_only' | 'translated'>(course.language_content_type === 'en_only' || course.language_content_type === 'translated' ? course.language_content_type : 'ar_only');
  const [modules, setModules] = useState<CourseModuleDraft[]>(initialModules);
  const [quizzes, setQuizzes] = useState<CourseQuizDraft[]>(initialQuizzes);
  const [coverImageRef, setCoverImageRef] = useState(course.cover_image_url ?? '');
  const ar = locale === 'ar';

  const fieldClass =
    'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <input type="hidden" name="course_id" value={course.id} />
      <input type="hidden" name="locale" value={locale} />

      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <details open className="rounded-2xl border border-gray-200 p-4">
        <summary className="cursor-pointer list-none text-lg font-bold">
          {ar ? 'المعلومات الأساسية' : 'Basic information'}
          <span className="ms-2 text-sm font-normal text-gray-500">
            {ar ? '— اضغط للطي أو الفتح' : '— Click to collapse or expand'}
          </span>
        </summary>
        <div className="mt-4 space-y-6">
      <section className="space-y-4">
        <h2 className="font-bold">{ar ? 'العنوان والوصف' : 'Titles and descriptions'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {languageContentType !== 'en_only' && (
<label className="block text-sm font-medium">
            العنوان بالعربية
            <input className={fieldClass} name="title_ar" required maxLength={180} defaultValue={course.title_ar} />
          </label>
)}
          {languageContentType !== 'ar_only' && (
<label className="block text-sm font-medium">
            English title
            <input className={fieldClass} name="title_en" required maxLength={180} defaultValue={course.title_en} dir="ltr" />
          </label>
)}
          {languageContentType !== 'en_only' && (
<label className="block text-sm font-medium">
            الوصف بالعربية
            <textarea className={fieldClass} name="description_ar" rows={5} defaultValue={course.description_ar} />
          </label>
)}
          {languageContentType !== 'ar_only' && (
<label className="block text-sm font-medium">
            English description
            <textarea className={fieldClass} name="description_en" rows={5} defaultValue={course.description_en} dir="ltr" />
          </label>
)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-bold">{ar ? 'إعدادات الدورة' : 'Course settings'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {ar ? 'الحالة' : 'Status'}
            <select className={fieldClass} name="status" defaultValue={course.status}>
              <option value="draft">{ar ? 'مسودة' : 'Draft'}</option>
              <option value="in_review">{ar ? 'قيد المراجعة' : 'In review'}</option>
              <option value="published">{ar ? 'منشورة' : 'Published'}</option>
              <option value="archived">{ar ? 'مؤرشفة' : 'Archived'}</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            {ar ? 'المستوى' : 'Level'}
            <select className={fieldClass} name="level" defaultValue={course.level}>
              <option value="beginner">{ar ? 'مبتدئ' : 'Beginner'}</option>
              <option value="intermediate">{ar ? 'متوسط' : 'Intermediate'}</option>
              <option value="advanced">{ar ? 'متقدم' : 'Advanced'}</option>
              <option value="all_levels">{ar ? 'جميع المستويات' : 'All levels'}</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            {ar ? 'لغة الدورة' : 'Course language'}

          </label>
          <label className="block text-sm font-medium">
            {ar ? 'نوع المحتوى اللغوي' : 'Language content type'}
            <select value={languageContentType} onChange={(e) => { const value = e.target.value; if (value === 'ar_only' || value === 'en_only' || value === 'translated') setLanguageContentType(value); }} className={fieldClass} name="language_content_type" defaultValue={course.language_content_type} required>
              <option value="ar_only">{ar ? 'عربي فقط' : 'Arabic only'}</option>
              <option value="en_only">{ar ? 'إنجليزي فقط' : 'English only'}</option>
              <option value="translated">{ar ? 'مترجمة باللغتين' : 'Translated into both languages'}</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            {ar ? 'طريقة التقديم' : 'Delivery mode'}
            <select className={fieldClass} name="delivery_mode" defaultValue={course.delivery_mode}>
              <option value="recorded">{ar ? 'مسجلة' : 'Recorded'}</option>
              <option value="live">{ar ? 'مباشرة' : 'Live'}</option>
              <option value="recorded_and_live">{ar ? 'مسجلة ومباشرة' : 'Recorded and live'}</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            {ar ? 'التسعير' : 'Pricing'}
            <select className={fieldClass} name="pricing" defaultValue={course.pricing}>
              <option value="free">{ar ? 'مجانية' : 'Free'}</option>
              <option value="paid">{ar ? 'مدفوعة' : 'Paid'}</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            {ar ? 'السعر (للـدورة المدفوعة)' : 'Price (for paid courses)'}
            <input className={fieldClass} type="number" name="price" min="1" step="1" defaultValue={course.price} />
          </label>
        </div>
      </section>

      <section>
        <label className="block text-sm font-medium">
          {ar ? 'مرجع صورة الغلاف' : 'Cover image reference'}
          <input type="hidden" name="cover_image_url" value={coverImageRef} />
          <ImageUpload value={coverImageRef} onChange={setCoverImageRef} folder="courses" />
        </label>
        <p className="mt-1 text-xs text-gray-500">
          {ar ? 'أبقِ المرجع الحالي إذا لم ترغب في تغييره.' : 'Keep the existing reference if you do not want to change it.'}
        </p>
      </section>
        </div>
      </details>

      <input type="hidden" name="course_content_json" value={JSON.stringify(modules)} />
      <input type="hidden" name="course_quizzes_json" value={JSON.stringify(quizzes)} />

      <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
        <h2 className="text-lg font-bold">{ar ? 'محتوى الدورة والوحدات والدروس' : 'Course curriculum, modules and lessons'}</h2>
        <CourseCurriculumEditor locale={locale} languageContentType={languageContentType} modules={modules} setModules={setModules} />
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
        <h2 className="text-lg font-bold">{ar ? 'اختبارات الدورة' : 'Course quizzes'}</h2>
        <CourseQuizEditor
          locale={locale}
          languageContentType={languageContentType}
          modules={modules}
          quizzes={quizzes}
          setQuizzes={setQuizzes}
        />
      </section>

      <footer className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? 'حفظ التعديلات' : 'Save changes')}
        </button>
        <a
          href={'/admin/courses/' + encodeURIComponent(course.slug)}
          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          {ar ? 'إلغاء' : 'Cancel'}
        </a>
      </footer>
    </form>
  );
}
