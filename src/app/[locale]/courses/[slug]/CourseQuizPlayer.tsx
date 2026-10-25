'use client';

import { useState } from 'react';
import { submitCourseQuiz } from './actions';

type QuizOption = {
  id: string;
  text: string;
};

type QuizQuestion = {
  id: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  question_text: string;
  points: number;
  options: QuizOption[];
};

export type StudentQuiz = {
  id: string;
  quiz_type: 'lesson' | 'module' | 'final';
  title: string;
  description: string | null;
  passing_score: number;
  attempts_allowed: number | null;
  attempts_used: number;
  questions: QuizQuestion[];
};

type Props = {
  quiz: StudentQuiz;
  locale: string;
};

type Result = {
  attemptNumber: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
};

export default function CourseQuizPlayer({ quiz, locale }: Props) {
  const isArabic = locale === 'ar';
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const exhausted =
    quiz.attempts_allowed !== null &&
    quiz.attempts_used >= quiz.attempts_allowed;

  function toggleOption(question: QuizQuestion, optionId: string) {
    setSelected((current) => {
      const existing = current[question.id] ?? [];
      const next =
        question.question_type === 'multiple_choice'
          ? existing.includes(optionId)
            ? existing.filter((id) => id !== optionId)
            : [...existing, optionId]
          : existing.includes(optionId)
            ? []
            : [optionId];

      return { ...current, [question.id]: next };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (quiz.questions.length === 0) {
      setError(isArabic ? 'لا توجد أسئلة في هذا الاختبار.' : 'This quiz has no questions.');
      return;
    }

    if (quiz.questions.some((question) => !(selected[question.id]?.length))) {
      setError(isArabic ? 'أجب عن جميع الأسئلة قبل الإرسال.' : 'Answer every question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitCourseQuiz(
        quiz.id,
        quiz.questions.map((question) => ({
          question_id: question.id,
          option_ids: selected[question.id] ?? [],
        })),
        locale,
      );

      if (!response.success) {
        setError(response.message);
        return;
      }

      setResult({
        attemptNumber: response.attemptNumber,
        score: response.score,
        totalPoints: response.totalPoints,
        percentage: response.percentage,
        passed: response.passed,
        passingScore: response.passingScore,
      });
    } catch {
      setError(isArabic ? 'حدث خطأ غير متوقع. حاول مجددًا.' : 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel =
    quiz.quiz_type === 'lesson'
      ? isArabic ? 'اختبار الدرس' : 'Lesson quiz'
      : quiz.quiz_type === 'module'
        ? isArabic ? 'اختبار الوحدة' : 'Module quiz'
        : isArabic ? 'الاختبار النهائي' : 'Final quiz';

  return (
    <section className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <div className="mb-4">
        <span className="text-xs font-semibold text-primary-700">{typeLabel}</span>
        <h3 className="mt-1 text-lg font-bold text-gray-900">{quiz.title}</h3>
        {quiz.description ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
            {quiz.description}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gray-500">
          {isArabic ? 'درجة النجاح:' : 'Passing score:'} {quiz.passing_score}%
          {quiz.attempts_allowed !== null
            ? ` · ${isArabic ? 'المحاولات المتاحة' : 'Attempts'}: ${Math.max(0, quiz.attempts_allowed - quiz.attempts_used)}`
            : ` · ${isArabic ? 'المحاولات غير محدودة' : 'Unlimited attempts'}`}
        </p>
      </div>

      {result ? (
        <div
          role="status"
          className={`rounded-lg border p-4 ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
        >
          <p className="font-semibold">
            {result.passed
              ? isArabic ? 'اجتزت الاختبار بنجاح!' : 'Quiz passed!'
              : isArabic ? 'لم تصل إلى درجة النجاح هذه المرة.' : 'You did not reach the passing score this time.'}
          </p>
          <p className="mt-2 text-sm">
            {isArabic ? 'النتيجة:' : 'Score:'} {result.score} / {result.totalPoints}
            {' · '}{result.percentage}%
          </p>
          <p className="mt-1 text-sm">
            {isArabic ? 'رقم المحاولة:' : 'Attempt:'} {result.attemptNumber}
          </p>
        </div>
      ) : exhausted ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {isArabic ? 'استنفدت عدد المحاولات المسموح به.' : 'You have used all allowed attempts.'}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {quiz.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <legend className="px-1 text-sm font-semibold leading-6 text-gray-900">
                {index + 1}. {question.question_text}
                <span className="ms-2 text-xs font-normal text-gray-500">
                  ({question.points} {isArabic ? 'درجة' : 'points'})
                </span>
              </legend>
              <div className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const checked = (selected[question.id] ?? []).includes(option.id);
                  const multiple = question.question_type === 'multiple_choice';

                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <input
                        type={multiple ? 'checkbox' : 'radio'}
                        name={question.id}
                        checked={checked}
                        onChange={() => toggleOption(question, option.id)}
                        className="mt-1"
                      />
                      <span className="text-sm leading-6 text-gray-700">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {error ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || quiz.questions.length === 0}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? isArabic ? 'جارٍ التصحيح...' : 'Submitting...'
              : isArabic ? 'إرسال الإجابات وتصحيح الاختبار' : 'Submit and grade quiz'}
          </button>
        </form>
      )}
    </section>
  );
}
