'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markCourseLessonComplete } from './actions';

type Props = {
  courseId: string;
  lessonId: string;
  locale: string;
  completed: boolean;
};

export default function LessonCompletionButton({
  courseId,
  lessonId,
  locale,
  completed,
}: Props) {
  const isArabic = locale === 'ar';
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(completed);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function markComplete() {
    setMessage('');

    startTransition(async () => {
      const result = await markCourseLessonComplete(
        courseId,
        lessonId,
        locale,
      );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setIsCompleted(true);
      setMessage(isArabic ? 'تم حفظ إكمال الدرس.' : 'Lesson completion saved.');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={markComplete}
        disabled={pending || isCompleted}
        className="rounded-lg border border-primary-600 px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? isArabic ? 'جارٍ الحفظ…' : 'Saving…'
          : isCompleted
            ? isArabic ? '✓ مكتمل' : '✓ Completed'
            : isArabic ? 'تحديد كمكتمل' : 'Mark as complete'}
      </button>

      {message ? (
        <span role="status" className="text-xs text-gray-600">
          {message}
        </span>
      ) : null}
    </div>
  );
}
