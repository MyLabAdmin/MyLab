'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import ImageUpload from '@/components/auth/ImageUpload'
import CourseCurriculumEditor, { type CourseModuleDraft } from '@/components/admin/CourseCurriculumEditor'
import CourseQuizEditor, { type CourseQuizDraft } from '@/components/admin/CourseQuizEditor'
import { createCourse } from '@/app/[locale]/actions/courses'

function isWrongLanguage(value: string, expected: 'ar' | 'en'): boolean {
  const hasArabic = /\p{Script=Arabic}/u.test(value);
  const hasLatin = /\p{Script=Latin}/u.test(value);

  return expected === 'ar'
    ? hasLatin && !hasArabic
    : hasArabic && !hasLatin;
}


export default function CourseForm() {
  const locale = useLocale()
  const [coverImageRef, setCoverImageRef] = useState('')
  const [languageError, setLanguageError] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [pricing, setPricing] = useState<'free' | 'paid'>('free')
  const [languageContentType, setLanguageContentType] = useState<'ar_only' | 'en_only' | 'translated'>('ar_only');
  const [modules, setModules] = useState<CourseModuleDraft[]>([])
  const [quizzes, setQuizzes] = useState<CourseQuizDraft[]>([])

  const [state, formAction, pending] = useActionState(createCourse, null)

  return (
    <form
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={formAction}
      onInvalidCapture={() => setValidationAttempted(true)}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const requiresAr = languageContentType !== 'en_only';
        const requiresEn = languageContentType !== 'ar_only';
        const fields: Array<[string, 'ar' | 'en']> = [
          ...(requiresAr ? [['title_ar', 'ar'], ['description_ar', 'ar']] as Array<[string, 'ar' | 'en']> : []),
          ...(requiresEn ? [['title_en', 'en'], ['description_en', 'en']] as Array<[string, 'ar' | 'en']> : []),
        ];

        for (const [name, expected] of fields) {
          const value = String(data.get(name) ?? '').trim();
          if (value && isWrongLanguage(value, expected)) {
            event.preventDefault();
            setLanguageError(
              locale === 'ar'
                ? (expected === 'ar'
                    ? 'اكتب هذا الحقل باللغة العربية، أو امزج العربية بمصطلحات أجنبية عند الحاجة.'
                    : 'اكتب هذا الحقل باللغة الإنجليزية، أو امزج الإنجليزية بمصطلحات عربية عند الحاجة.')
                : (expected === 'ar'
                    ? 'This field must be Arabic, or contain Arabic alongside foreign terms.'
                    : 'This field must be English, or contain English alongside Arabic terms.')
            );
            return;
          }
        }

        const descriptionAr = String(data.get('description_ar') ?? '').trim();
        const descriptionEn = String(data.get('description_en') ?? '').trim();

        for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
          const module = modules[moduleIndex];

          if ((requiresAr && !module.title_ar.trim()) || (requiresEn && !module.title_en.trim())) {
            event.preventDefault();
            setLanguageError(locale === "ar"
              ? "أكمل عنوان الوحدة رقم " + (moduleIndex + 1) + (requiresAr && requiresEn ? " بالعربية والإنجليزية." : requiresAr ? " بالعربية." : " بالإنجليزية.")
              : "Complete the required language title for module " + (moduleIndex + 1) + ".");
            return;
          }

          for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
            const lesson = module.lessons[lessonIndex];

            if ((requiresAr && !lesson.title_ar.trim()) || (requiresEn && !lesson.title_en.trim())) {
              event.preventDefault();
              setLanguageError(locale === "ar"
                ? "أكمل عنوان الدرس رقم " + (lessonIndex + 1) + " في الوحدة رقم " + (moduleIndex + 1) + (requiresAr && requiresEn ? " بالعربية والإنجليزية." : requiresAr ? " بالعربية." : " بالإنجليزية.")
                : "Complete the required language title for lesson " + (lessonIndex + 1) + " in module " + (moduleIndex + 1) + ".");
              return;
            }

            if (lesson.lesson_type === "text") {
              const sections = lesson.sections ?? [];
              const populated = sections.filter(section =>
                section.heading_ar.trim() || section.heading_en.trim() ||
                section.text_ar.trim() || section.text_en.trim() || section.image_ref.trim()
              );
              const validSections = populated.length > 0 && populated.every(section =>
                (!requiresAr || (section.heading_ar.trim() && section.text_ar.trim())) &&
                (!requiresEn || (section.heading_en.trim() && section.text_en.trim()))
              );

              if (!validSections) {
                event.preventDefault();
                setLanguageError(locale === "ar"
                  ? "أضف قسمًا واحدًا على الأقل، وأكمل العنوان والنص بكل لغة مطلوبة لكل قسم مستخدم."
                  : "Add at least one section and complete its heading and text in every required language.");
                return;
              }
            }
          }
        }

        setLanguageError('');
      }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-10">
      <input type="hidden" name="locale" value={locale} />
      {languageError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {languageError}
        </p>
      )}

      <details open className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <summary className="cursor-pointer select-none text-lg font-bold text-gray-900">
          {locale === 'ar' ? 'معلومات الدورة وإعداداتها' : 'Course information and settings'}
        </summary>
        <div className="mt-5 flex flex-col gap-5">
      {languageContentType !== 'en_only' && (
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-7">
        <h2 className="border-b border-gray-100 pb-3 text-lg font-bold tracking-tight text-gray-900">
          {locale === 'ar' ? 'المحتوى العربي' : 'Arabic content'}
        </h2>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          عنوان الدورة بالعربية *
          <input
            name="title_ar"
            required
            maxLength={200}
            className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
          />
        </label>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          الوصف
          <textarea
            name="description_ar"
            rows={5}
            maxLength={10000}
            className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
          />
        </label>
      </section>
      )}

      {languageContentType !== 'ar_only' && (
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-7">
        <h2 className="border-b border-gray-100 pb-3 text-lg font-bold tracking-tight text-gray-900">
          {locale === 'ar' ? 'English content' : 'English content'}
        </h2>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          Course title *
          <input
            name="title_en"
            required
            maxLength={200}
            className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
            dir="ltr"
          />
        </label>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          Description
          <textarea
            name="description_en"
            rows={5}
            maxLength={10000}
            className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
            dir="ltr"
          />
        </label>
      </section>
      )}

      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-7">
        <h2 className="border-b border-gray-100 pb-3 text-lg font-bold tracking-tight text-gray-900">
          {locale === 'ar' ? 'إعدادات الدورة' : 'Course settings'}
        </h2>


<label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          {locale === 'ar' ? 'نوع المحتوى اللغوي' : 'Language content type'}
          <select value={languageContentType} onChange={(e) => { const value = e.target.value; if (value === 'ar_only' || value === 'en_only' || value === 'translated') setLanguageContentType(value); }} name="language_content_type" required className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10">
            <option value="ar_only">{locale === 'ar' ? 'عربي فقط' : 'Arabic only'}</option>
            <option value="en_only">{locale === 'ar' ? 'إنجليزي فقط' : 'English only'}</option>
            <option value="translated">{locale === 'ar' ? 'مترجمة باللغتين' : 'Translated into both languages'}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          {locale === 'ar' ? 'مستوى الدورة' : 'Course level'}
          <select name="level" defaultValue="beginner" className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}>
            <option value="beginner">{locale === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
            <option value="intermediate">{locale === 'ar' ? 'متوسط' : 'Intermediate'}</option>
            <option value="advanced">{locale === 'ar' ? 'متقدم' : 'Advanced'}</option>
            <option value="all_levels">{locale === 'ar' ? 'جميع المستويات' : 'All levels'}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          {locale === 'ar' ? 'طريقة التقديم' : 'Delivery mode'}
          <select name="delivery_mode" defaultValue="recorded_and_live" className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}>
            <option value="recorded">{locale === 'ar' ? 'مسجلة' : 'Recorded'}</option>
            <option value="live">{locale === 'ar' ? 'مباشرة' : 'Live'}</option>
            <option value="recorded_and_live">{locale === 'ar' ? 'مسجلة ومباشرة' : 'Recorded and live'}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          {locale === 'ar' ? 'نوع التسعير' : 'Pricing'}
          <select
            name="pricing"
            value={pricing}
            onChange={(event) => setPricing(event.target.value as 'free' | 'paid')}
            className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
          >
            <option value="free">{locale === 'ar' ? 'مجانية' : 'Free'}</option>
            <option value="paid">{locale === 'ar' ? 'مدفوعة' : 'Paid'}</option>
          </select>
        </label>

        {pricing === 'paid' && (
          <label className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
            {locale === 'ar' ? 'السعر بعملة Coins' : 'Price in Coins'}
            <input
              name="price"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              required
              className={"w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 " + (validationAttempted ? "invalid:border-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500/10" : "")}
            />
          </label>
        )}

        <div className="flex flex-col gap-2.5 text-sm font-medium text-gray-700">
          <span>{locale === 'ar' ? 'صورة الغلاف (اختيارية)' : 'Cover image (optional)'}</span>
          <input
            type="hidden"
            name="cover_image_url"
            value={coverImageRef}
          />
          <ImageUpload
            value={coverImageRef}
            onChange={setCoverImageRef}
            folder="courses"
            scope="courses"
            previewClassName="w-full h-80 object-contain object-center rounded-xl bg-gray-50"
          />
          <p className="text-xs leading-6 text-gray-500">
            {locale === 'ar'
              ? 'يمكنك رفع صورة أو اختيار صورة من مكتبة الوسائط.'
              : 'Upload an image or choose one from the media library.'}
          </p>
        </div>
      </section>

      </div>
      </details>

      <input
        type="hidden"
        name="course_content_json"
        value={JSON.stringify(modules)}
      />
      <input
        type="hidden"
        name="course_quizzes_json"
        value={JSON.stringify(quizzes)}
      />

      <CourseCurriculumEditor
        locale={locale}
        languageContentType={languageContentType}
        modules={modules}
        setModules={setModules}
      />

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold">
          {locale === 'ar' ? 'اختبارات الدورة' : 'Course quizzes'}
        </h2>
        <CourseQuizEditor
          locale={locale === 'en' ? 'en' : 'ar'}
          languageContentType={languageContentType}
          modules={modules}
          quizzes={quizzes}
          setQuizzes={setQuizzes}
          allowDraftTargets
        />
      </section>

      <div className="mt-1 flex flex-wrap gap-3">
        <button
          type="submit"
          name="course_status"
          value="draft"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-4 text-base font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
        >
          {pending
            ? (locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
            : (locale === 'ar' ? 'حفظ كمسودة' : 'Save draft')}
        </button>
        <button
          type="submit"
          name="course_status"
          value="published"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
        >
          {pending
            ? (locale === 'ar' ? 'جارٍ النشر...' : 'Publishing...')
            : (locale === 'ar' ? 'نشر الدورة' : 'Publish course')}
        </button>
      </div>
    </form>
  )
}
