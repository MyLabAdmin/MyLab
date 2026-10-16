'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Course = {
  id: string;
  slug: string;
  pricing: string | null;
  price: number | null;
  currencyCode: string | null;
  deliveryMode: string | null;
  level: string | null;
  coverImageUrl: string | null;
  title: string;
  description: string;
  enrollmentStatus: 'studying' | 'completed' | null;
};

type Props = {
  courses: Course[];
  locale: string;
  query: string;
};

type MainFilter = 'all' | 'paid' | 'free' | 'mine';
type MyFilter = 'all' | 'studying' | 'completed';

export default function CoursesFilters({ courses, locale, query }: Props) {
  const isArabic = locale === 'ar';
  const [mainFilter, setMainFilter] = useState<MainFilter>('all');
  const [myFilter, setMyFilter] = useState<MyFilter>('all');

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (mainFilter === 'paid' && course.pricing !== 'paid') return false;
      if (mainFilter === 'free' && course.pricing !== 'free') return false;
      if (mainFilter === 'mine' && !course.enrollmentStatus) return false;
      if (mainFilter === 'mine' && myFilter === 'studying' && course.enrollmentStatus !== 'studying') return false;
      if (mainFilter === 'mine' && myFilter === 'completed' && course.enrollmentStatus !== 'completed') return false;
      return true;
    });
  }, [courses, mainFilter, myFilter]);

  const mainOptions: { value: MainFilter; label: string }[] = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'paid', label: isArabic ? 'مدفوع' : 'Paid' },
    { value: 'free', label: isArabic ? 'مجاني' : 'Free' },
    { value: 'mine', label: isArabic ? 'دوراتي' : 'My courses' },
  ];

  const myOptions: { value: MyFilter; label: string }[] = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'studying', label: isArabic ? 'تحت الدراسة' : 'In progress' },
    { value: 'completed', label: isArabic ? 'منجزة' : 'Completed' },
  ];

  return (
    <>
      <nav aria-label={isArabic ? 'تصفية الدورات' : 'Course filters'} className="mb-4 flex w-full flex-wrap items-center justify-center gap-2">
        {mainOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setMainFilter(option.value);
              if (option.value !== 'mine') setMyFilter('all');
            }}
            aria-pressed={mainFilter === option.value}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${mainFilter === option.value ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {mainFilter === 'mine' && (
        <nav aria-label={isArabic ? 'حالة دوراتي' : 'My course status'} className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
          {myOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMyFilter(option.value)}
              aria-pressed={myFilter === option.value}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${myFilter === option.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {option.label}
            </button>
          ))}
        </nav>
      )}

      {filteredCourses.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
          {isArabic ? 'لا توجد دورات مطابقة حاليًا.' : 'No matching courses found.'}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <article key={course.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {course.coverImageUrl && (
                <div className="relative isolate h-44 overflow-hidden bg-gray-100">
                  <img
                    src={course.coverImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    {mainFilter === 'all' && course.enrollmentStatus && (
                      <span className="mb-2 inline-flex rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800">
                        {course.enrollmentStatus === 'completed'
                          ? (isArabic ? 'منجزة' : 'Completed')
                          : (isArabic ? 'تحت الدراسة' : 'In progress')}
                      </span>
                    )}
                    <h2 className="text-lg font-semibold leading-snug text-white drop-shadow-sm">
                      {course.title}
                    </h2>
                  </div>
                </div>
              )}
              <div className="p-5">
                {!course.coverImageUrl && (
                  <>
                    {mainFilter === 'all' && course.enrollmentStatus && (
                      <span className="mb-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {course.enrollmentStatus === 'completed'
                          ? (isArabic ? 'منجزة' : 'Completed')
                          : (isArabic ? 'تحت الدراسة' : 'In progress')}
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                  </>
                )}
                {course.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">{course.description}</p>
                )}
                <p className="mt-3 text-sm text-gray-500">
                  {course.level ?? ''}{course.level && course.deliveryMode ? ' · ' : ''}{course.deliveryMode ?? ''}
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {course.pricing === 'free'
                    ? (isArabic ? 'مجانية' : 'Free')
                    : course.price != null
                      ? String(course.price) + (course.currencyCode ? ' ' + course.currencyCode : '')
                      : (isArabic ? 'راجع تفاصيل الدورة' : 'See course details')}
                </p>
                <Link
                  href={`/courses/${course.slug}`}
                  className="mt-4 inline-flex rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white hover:opacity-90"
                >
                  {isArabic ? 'عرض الدورة' : 'View course'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <span className="sr-only">{query}</span>
    </>
  );
}
