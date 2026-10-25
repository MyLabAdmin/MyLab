'use client';

import { useMemo, useState } from 'react';
import CourseEnrollmentDetails, {
  type CourseLearner,
} from '@/components/admin/CourseEnrollmentDetails';
import { Link } from '@/i18n/navigation';

type CourseStatus = 'draft' | 'published' | 'in_review' | 'archived';

type CourseTranslation = {
  locale: string;
  title: string;
};

type EnrollmentStats = {
  total: number;
  completed: number;
  incomplete: number;
};

export type AdminCourse = {
  id: string;
  slug: string;
  status: string;
  pricing: string;
  price: number | null;
  currency_code: string | null;
  delivery_mode: string | null;
  level: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
  published_at: string | null;
  translations: CourseTranslation[];
  learners: CourseLearner[];
  enrollmentStats: EnrollmentStats | null;
};

type Props = {
  courses: AdminCourse[];
  locale: 'ar' | 'en';
  enrollmentLoadError: boolean;
};

type FilterValue = 'all' | string;

export default function CourseAdminTable({
  courses,
  locale,
  enrollmentLoadError,
}: Props) {
  const isArabic = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [levelFilter, setLevelFilter] = useState<FilterValue>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<FilterValue>('all');
  const [suspensionFilter, setSuspensionFilter] =
    useState<FilterValue>('all');

  const text = {
    course: isArabic ? 'الدورة' : 'Course',
    enrolled: isArabic ? 'المسجلون' : 'Enrolled',
    completed: isArabic ? 'المكتملون' : 'Completed',
    incomplete: isArabic ? 'غير المكتملين' : 'Incomplete',
    status: isArabic ? 'الحالة' : 'Status',
    price: isArabic ? 'السعر' : 'Price',
    level: isArabic ? 'المستوى' : 'Level',
    delivery: isArabic ? 'نمط التقديم' : 'Delivery',
    suspension: isArabic ? 'التعليق' : 'Suspension',
    created: isArabic ? 'تاريخ الإنشاء' : 'Created',
    noCourses: isArabic ? 'لا توجد دورات لعرضها.' : 'No courses found.',
    noResults: isArabic
      ? 'لا توجد دورات تطابق البحث والفلاتر.'
      : 'No courses match your search and filters.',
    search: isArabic ? 'ابحث بالعنوان أو slug' : 'Search title or slug',
    all: isArabic ? 'الكل' : 'All',
    published: isArabic ? 'منشورة' : 'Published',
    draft: isArabic ? 'مسودة' : 'Draft',
    inReview: isArabic ? 'قيد المراجعة' : 'In review',
    archived: isArabic ? 'مؤرشفة' : 'Archived',
    suspended: isArabic ? 'معلّقة' : 'Suspended',
    notSuspended: isArabic ? 'غير معلّقة' : 'Not suspended',
    free: isArabic ? 'مجانية' : 'Free',
    enrollmentLoadError: isArabic
      ? 'تعذر تحميل التسجيلات'
      : 'Could not load enrollments',
    results: isArabic ? 'النتائج' : 'Results',
    total: isArabic ? 'إجمالي الدورات' : 'Total courses',
    levelBeginner: isArabic ? 'مبتدئ' : 'Beginner',
    levelIntermediate: isArabic ? 'متوسط' : 'Intermediate',
    levelAdvanced: isArabic ? 'متقدم' : 'Advanced',
    levelAll: isArabic ? 'جميع المستويات' : 'All levels',
    recorded: isArabic ? 'مسجلة' : 'Recorded',
    live: isArabic ? 'مباشرة' : 'Live',
    recordedAndLive: isArabic ? 'مسجلة ومباشرة' : 'Recorded and live',
    clear: isArabic ? 'مسح الفلاتر' : 'Clear filters',
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: text.draft,
      published: text.published,
      archived: text.archived,
      in_review: text.inReview,
    };

    return labels[status] ?? status;
  };

  const levelLabel = (level: string | null) => {
    if (!level) return '—';

    const labels: Record<string, string> = {
      beginner: text.levelBeginner,
      intermediate: text.levelIntermediate,
      advanced: text.levelAdvanced,
      all_levels: text.levelAll,
    };

    return labels[level] ?? level;
  };

  const deliveryLabel = (mode: string | null) => {
    if (!mode) return '—';

    const labels: Record<string, string> = {
      recorded: text.recorded,
      live: text.live,
      recorded_and_live: text.recordedAndLive,
    };

    return labels[mode] ?? mode;
  };

  const titleFor = (course: AdminCourse) =>
    course.translations.find((item) => item.locale === locale)?.title ??
    course.translations.find((item) => item.locale === 'ar')?.title ??
    course.translations[0]?.title ??
    course.slug;

  const summary = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((course) => course.status === 'published')
        .length,
      draft: courses.filter((course) => course.status === 'draft').length,
      inReview: courses.filter((course) => course.status === 'in_review')
        .length,
      archived: courses.filter((course) => course.status === 'archived')
        .length,
      suspended: courses.filter((course) => course.is_suspended).length,
    }),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale);

    return courses.filter((course) => {
      const matchesSearch =
        !needle ||
        titleFor(course).toLocaleLowerCase(locale).includes(needle) ||
        course.slug.toLocaleLowerCase(locale).includes(needle);

      const matchesStatus =
        statusFilter === 'all' || course.status === statusFilter;

      const matchesLevel =
        levelFilter === 'all' || course.level === levelFilter;

      const matchesDelivery =
        deliveryFilter === 'all' || course.delivery_mode === deliveryFilter;

      const matchesSuspension =
        suspensionFilter === 'all' ||
        (suspensionFilter === 'suspended' && course.is_suspended) ||
        (suspensionFilter === 'not_suspended' && !course.is_suspended);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLevel &&
        matchesDelivery &&
        matchesSuspension
      );
    });
  }, [
    courses,
    search,
    statusFilter,
    levelFilter,
    deliveryFilter,
    suspensionFilter,
    locale,
  ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    levelFilter !== 'all' ||
    deliveryFilter !== 'all' ||
    suspensionFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLevelFilter('all');
    setDeliveryFilter('all');
    setSuspensionFilter('all');
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));

  const summaryCards = [
    { label: text.total, value: summary.total },
    { label: text.published, value: summary.published },
    { label: text.draft, value: summary.draft },
    { label: text.inReview, value: summary.inReview },
    { label: text.archived, value: summary.archived },
    { label: text.suspended, value: summary.suspended },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-sm text-gray-600">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {enrollmentLoadError && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {text.enrollmentLoadError}.{' '}
          {isArabic
            ? 'لن تُعرض أعداد التسجيلات حتى يتوفر تحميل موثوق.'
            : 'Enrollment counts are hidden until they can be loaded reliably.'}
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.search}
            aria-label={text.search}
            className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label={text.status}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">{text.status}: {text.all}</option>
            <option value="published">{text.published}</option>
            <option value="draft">{text.draft}</option>
            <option value="in_review">{text.inReview}</option>
            <option value="archived">{text.archived}</option>
          </select>

          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            aria-label={text.level}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">{text.level}: {text.all}</option>
            <option value="beginner">{text.levelBeginner}</option>
            <option value="intermediate">{text.levelIntermediate}</option>
            <option value="advanced">{text.levelAdvanced}</option>
            <option value="all_levels">{text.levelAll}</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
            aria-label={text.delivery}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">{text.delivery}: {text.all}</option>
            <option value="recorded">{text.recorded}</option>
            <option value="live">{text.live}</option>
            <option value="recorded_and_live">{text.recordedAndLive}</option>
          </select>

          <select
            value={suspensionFilter}
            onChange={(event) => setSuspensionFilter(event.target.value)}
            aria-label={text.suspension}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">{text.suspension}: {text.all}</option>
            <option value="suspended">{text.suspended}</option>
            <option value="not_suspended">{text.notSuspended}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p aria-live="polite" className="text-gray-700">
            {text.results}: <strong>{filteredCourses.length}</strong>
            {' / '}
            {courses.length}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              {text.clear}
            </button>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-gray-600">
          {text.noCourses}
        </p>
      ) : filteredCourses.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-gray-600">
          {text.noResults}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead className="bg-gray-50 text-start">
              <tr>
                {[
                  text.course,
                  text.enrolled,
                  text.completed,
                  text.incomplete,
                  text.status,
                  text.price,
                  text.level,
                  text.delivery,
                  text.suspension,
                  text.created,
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-gray-200 px-4 py-3 text-start font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="align-top hover:bg-gray-50"
                >
                  <td className="border-b border-gray-100 px-4 py-4">
                    <Link
                      href={'/admin/courses/' + encodeURIComponent(course.slug)}
                      className="inline-flex font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {titleFor(course)}
                    </Link>
                    <div className="mt-1 break-all text-xs text-gray-500">
                      {course.slug}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                      <Link
                        href={'/admin/courses/' + encodeURIComponent(course.slug)}
                        className="text-blue-700 hover:underline"
                      >
                        {isArabic ? 'عرض الدورة' : 'View course'}
                      </Link>
                      <Link
                        href={'/admin/courses/' + encodeURIComponent(course.slug) + '/edit'}
                        className="text-indigo-700 hover:underline"
                      >
                        {isArabic ? 'تعديل البيانات' : 'Edit details'}
                      </Link>
                    </div>
                    {!enrollmentLoadError && (
                      <CourseEnrollmentDetails
                        learners={course.learners}
                        locale={locale}
                        filter="all"
                      />
                    )}
                  </td>

                  {(['total', 'completed', 'incomplete'] as const).map(
                    (kind) => (
                      <td
                        key={kind}
                        className="border-b border-gray-100 px-4 py-4"
                      >
                        {enrollmentLoadError || !course.enrollmentStats ? (
                          <span className="text-xs text-amber-800">
                            {text.enrollmentLoadError}
                          </span>
                        ) : (
                          <CourseEnrollmentDetails
                            learners={course.learners}
                            locale={locale}
                            filter={
                              kind === 'total' ? 'enrolled' : kind
                            }
                            count={course.enrollmentStats[kind]}
                          />
                        )}
                      </td>
                    ),
                  )}

                  <td className="border-b border-gray-100 px-4 py-4">
                    {statusLabel(course.status)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4">
                    {course.pricing === 'free'
                      ? text.free
                      : course.price != null
                        ? (String(course.price) +
                          ' ' +
                          (course.currency_code ?? '')).trim()
                        : '—'}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4">
                    {levelLabel(course.level)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4">
                    {deliveryLabel(course.delivery_mode)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-4">
                    <div
                      className={
                        course.is_suspended
                          ? 'font-medium text-red-700'
                          : 'text-gray-600'
                      }
                    >
                      {course.is_suspended
                        ? text.suspended
                        : text.notSuspended}
                    </div>
                    {course.is_suspended && course.suspension_reason ? (
                      <p className="mt-1 max-w-xs text-xs text-gray-500">
                        {course.suspension_reason}
                      </p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap border-b border-gray-100 px-4 py-4">
                    {formatDate(course.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
