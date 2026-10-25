'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '@/components/community/Avatar';

export type CourseLearner = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  enrolledAt: string;
  completed: boolean;
};

type LearnerFilter = 'all' | 'enrolled' | 'completed' | 'incomplete';

export default function CourseEnrollmentDetails({
  learners,
  locale,
  filter = 'all',
  count,
}: {
  learners: CourseLearner[];
  locale: 'ar' | 'en';
  filter?: LearnerFilter;
  count?: number;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const isArabic = locale === "ar";

  const labels = {
    all: isArabic ? "كل المتعلمين" : "All learners",
    enrolled: isArabic ? "المسجلون" : "Enrolled learners",
    completed: isArabic ? "المكتملون" : "Completed learners",
    incomplete: isArabic ? "غير المكتملين" : "Incomplete learners",
    view: isArabic ? "عرض المتعلمين" : "View learners",
    close: isArabic ? "إغلاق القائمة" : "Close list",
    empty: isArabic ? "لا يوجد متعلمون في هذه الفئة." : "No learners in this category.",
    enrolledAt: isArabic ? "التسجيل: " : "Enrolled: ",
    completedStatus: isArabic ? "مكتمل" : "Completed",
    incompleteStatus: isArabic ? "غير مكتمل" : "Incomplete",
  };

  const visibleLearners = filter === "completed"
    ? learners.filter((learner) => learner.completed)
    : filter === "incomplete"
      ? learners.filter((learner) => !learner.completed)
      : learners;

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(400, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      const top = Math.min(rect.bottom + 8, window.innerHeight - 120);
      setPosition({ top: Math.max(12, top), left, width });
    };

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={count === undefined
          ? "rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          : "rounded-md px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50 hover:underline"}
      >
        {count === undefined ? labels.view : count}
      </button>

      {open && position && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          role="dialog"
          aria-label={labels[filter]}
          dir={isArabic ? "rtl" : "ltr"}
          style={{ position: "fixed", top: position.top, left: position.left, width: position.width, zIndex: 1000 }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">{labels[filter]}</h3>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
              {labels.close}
            </button>
          </div>
          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-3">
            {visibleLearners.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">{labels.empty}</p>
            ) : visibleLearners.map((learner) => (
              <div key={learner.userId} className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                <Avatar name={learner.name} avatarUrl={learner.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">
                    {labels.enrolledAt}
                    {new Intl.DateTimeFormat(isArabic ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(learner.enrolledAt))}
                  </p>
                </div>
                <span className={learner.completed
                  ? "shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                  : "shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800"}>
                  {learner.completed ? labels.completedStatus : labels.incompleteStatus}
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
