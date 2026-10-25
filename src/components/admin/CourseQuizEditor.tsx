'use client';

import { useState } from 'react';

export type CourseQuizOptionDraft = {
  id?: string;
  text_ar: string;
  text_en: string;
  is_correct: boolean;
};

export type CourseQuizQuestionDraft = {
  id?: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  question_ar: string;
  question_en: string;
  explanation_ar: string;
  explanation_en: string;
  points: string;
  options: CourseQuizOptionDraft[];
};

export type CourseQuizDraft = {
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
  questions: CourseQuizQuestionDraft[];
};

type ModuleItem = {
  id?: string;
  draft_id?: string;
  title_ar: string;
  title_en: string;
  lessons: Array<{ id?: string; draft_id?: string; title_ar: string; title_en: string }>;
};

type Props = {
  locale: 'ar' | 'en';
  languageContentType: 'ar_only' | 'en_only' | 'translated';
  modules: ModuleItem[];
  quizzes: CourseQuizDraft[];
  setQuizzes: React.Dispatch<React.SetStateAction<CourseQuizDraft[]>>;
  allowDraftTargets?: boolean;
};

const field =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const smallButton =
  'rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50';

function newOption(): CourseQuizOptionDraft {
  return { text_ar: '', text_en: '', is_correct: false };
}

function newQuestion(): CourseQuizQuestionDraft {
  return {
    question_type: 'single_choice',
    question_ar: '',
    question_en: '',
    explanation_ar: '',
    explanation_en: '',
    points: '1',
    options: [newOption(), newOption()],
  };
}

function newQuiz(): CourseQuizDraft {
  return {
    quiz_type: 'lesson',
    module_id: '',
    lesson_id: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    passing_score: '70',
    attempts_allowed: '',
    is_published: false,
    questions: [newQuestion()],
  };
}

export default function CourseQuizEditor({
  locale,
  languageContentType,
  modules,
  quizzes,
  setQuizzes,
  allowDraftTargets = false,
}: Props) {
  const ar = locale === 'ar';
  const [activeIndex, setActiveIndex] = useState<number | null>(
    quizzes.length ? 0 : null,
  );

  const patchQuiz = (index: number, patch: Partial<CourseQuizDraft>) => {
    setQuizzes(current =>
      current.map((quiz, i) => (i === index ? { ...quiz, ...patch } : quiz)),
    );
  };

  const patchQuestion = (
    quizIndex: number,
    questionIndex: number,
    patch: Partial<CourseQuizQuestionDraft>,
  ) => {
    setQuizzes(current => current.map((quiz, qi) => {
      if (qi !== quizIndex) return quiz;
      return {
        ...quiz,
        questions: quiz.questions.map((question, i) =>
          i === questionIndex ? { ...question, ...patch } : question),
      };
    }));
  };

  const addQuiz = () => {
    const nextIndex = quizzes.length;
    setQuizzes(current => [...current, newQuiz()]);
    setActiveIndex(nextIndex);
  };

  const updateQuizType = (index: number, type: CourseQuizDraft['quiz_type']) => {
    const quiz = quizzes[index];
    patchQuiz(index, {
      quiz_type: type,
      module_id: type === 'module' || type === 'lesson' ? quiz.module_id : '',
      lesson_id: type === 'lesson' ? quiz.lesson_id : '',
    });
  };

  const moduleKey = (module: ModuleItem) => module.id ?? (allowDraftTargets ? module.draft_id : undefined);
  const lessonKey = (lesson: ModuleItem['lessons'][number]) => lesson.id ?? (allowDraftTargets ? lesson.draft_id : undefined);
  const visibleLessons = (moduleId: string) =>
    modules.find(module => module.id === moduleId || (allowDraftTargets && module.draft_id === moduleId))?.lessons ?? [];

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {ar ? 'اختبارات الدورة' : 'Course quizzes'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {ar
              ? 'أضف اختبارًا لدرس أو وحدة أو للدورة كاملة.'
              : 'Add a quiz to a lesson, module, or the entire course.'}
          </p>
        </div>
        <button type="button" onClick={addQuiz} className={smallButton}>
          {ar ? '+ إضافة اختبار' : '+ Add quiz'}
        </button>
      </header>

      <div className="space-y-3">
        {quizzes.map((quiz, qi) => {
          const expanded = activeIndex === qi;
          return (
            <article key={quiz.id ?? 'new-' + qi} className="rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-start font-semibold text-gray-800"
                  onClick={() => setActiveIndex(expanded ? null : qi)}
                >
                  {quiz.title_ar || quiz.title_en ||
                    (ar ? 'اختبار جديد' : 'New quiz')}
                  <span className="ms-2 text-xs font-normal text-gray-500">
                    {quiz.quiz_type === 'lesson'
                      ? (ar ? 'اختبار درس' : 'Lesson quiz')
                      : quiz.quiz_type === 'module'
                        ? (ar ? 'اختبار وحدة' : 'Module quiz')
                        : (ar ? 'اختبار نهائي' : 'Final quiz')}
                  </span>
                </button>
                <span className={'rounded-full px-2.5 py-1 text-xs ' +
                  (quiz.is_published
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600')}>
                  {quiz.is_published
                    ? (ar ? 'منشور' : 'Published')
                    : (ar ? 'مسودة' : 'Draft')}
                </span>
                {!quiz.id && (
                  <button
                    type="button"
                    className={smallButton + ' text-red-600'}
                    onClick={() => {
                      setQuizzes(current => current.filter((_, i) => i !== qi));
                      setActiveIndex(null);
                    }}
                  >
                    {ar ? 'إزالة' : 'Remove'}
                  </button>
                )}
              </div>

              {expanded && (
                <div className="space-y-5 border-t border-gray-100 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      {ar ? 'نوع الاختبار' : 'Quiz scope'}
                      <select
                        className={field}
                        value={quiz.quiz_type}
                        onChange={e => updateQuizType(qi, e.target.value as CourseQuizDraft['quiz_type'])}
                      >
                        <option value="lesson">{ar ? 'مرتبط بدرس' : 'Lesson'}</option>
                        <option value="module">{ar ? 'مرتبط بوحدة' : 'Module'}</option>
                        <option value="final">{ar ? 'نهائي للدورة' : 'Course final'}</option>
                      </select>
                    </label>

                    {quiz.quiz_type !== 'final' && (
                      <label className="space-y-2 text-sm font-medium">
                        {ar ? 'الوحدة' : 'Module'}
                        <select
                          className={field}
                          required
                          value={quiz.module_id}
                          onChange={e => patchQuiz(qi, {
                            module_id: e.target.value,
                            lesson_id: '',
                          })}
                        >
                          <option value="">{ar ? 'اختر الوحدة' : 'Select module'}</option>
                          {modules.filter(module => moduleKey(module)).map(module => (
                            <option key={moduleKey(module)} value={moduleKey(module)}>
                              {ar ? (module.title_ar || module.title_en) : (module.title_en || module.title_ar)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {quiz.quiz_type === 'lesson' && (
                      <label className="space-y-2 text-sm font-medium">
                        {ar ? 'الدرس' : 'Lesson'}
                        <select
                          className={field}
                          required
                          value={quiz.lesson_id}
                          onChange={e => patchQuiz(qi, { lesson_id: e.target.value })}
                        >
                          <option value="">{ar ? 'اختر الدرس' : 'Select lesson'}</option>
                          {visibleLessons(quiz.module_id).filter(lesson => lessonKey(lesson)).map(lesson => (
                            <option key={lessonKey(lesson)} value={lessonKey(lesson)}>
                              {ar ? (lesson.title_ar || lesson.title_en) : (lesson.title_en || lesson.title_ar)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="space-y-2 text-sm font-medium">
                      {ar ? 'درجة النجاح (%)' : 'Passing score (%)'}
                      <input
                        className={field}
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        required
                        value={quiz.passing_score}
                        onChange={e => patchQuiz(qi, { passing_score: e.target.value })}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      {ar ? 'عدد المحاولات (فارغ = غير محدود)' : 'Attempts (blank = unlimited)'}
                      <input
                        className={field}
                        type="number"
                        min="1"
                        step="1"
                        value={quiz.attempts_allowed}
                        onChange={e => patchQuiz(qi, { attempts_allowed: e.target.value })}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={quiz.is_published}
                        onChange={e => patchQuiz(qi, { is_published: e.target.checked })}
                      />
                      {ar ? 'نشر الاختبار للطلاب' : 'Publish quiz for students'}
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {languageContentType !== 'en_only' && (
<label className="space-y-2 text-sm font-medium">
                      {ar ? 'عنوان الاختبار بالعربية' : 'Quiz title (Arabic)'}
                      <input className={field} maxLength={200} required value={quiz.title_ar}
                        onChange={e => patchQuiz(qi, { title_ar: e.target.value })} />
                    </label>
)}
                    {languageContentType !== 'ar_only' && (
<label dir="ltr" className="space-y-2 text-sm font-medium">
                      Quiz title (English)
                      <input className={field} maxLength={200} required value={quiz.title_en}
                        onChange={e => patchQuiz(qi, { title_en: e.target.value })} />
                    </label>
)}
                    {languageContentType !== 'en_only' && (
<label className="space-y-2 text-sm font-medium">
                      {ar ? 'وصف الاختبار بالعربية' : 'Description (Arabic)'}
                      <textarea className={field} rows={3} value={quiz.description_ar}
                        onChange={e => patchQuiz(qi, { description_ar: e.target.value })} />
                    </label>
)}
                    {languageContentType !== 'ar_only' && (
<label dir="ltr" className="space-y-2 text-sm font-medium">
                      Description (English)
                      <textarea className={field} rows={3} value={quiz.description_en}
                        onChange={e => patchQuiz(qi, { description_en: e.target.value })} />
                    </label>
)}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold">{ar ? 'الأسئلة' : 'Questions'}</h3>
                      <button type="button" className={smallButton}
                        onClick={() => patchQuiz(qi, { questions: [...quiz.questions, newQuestion()] })}>
                        {ar ? '+ إضافة سؤال' : '+ Add question'}
                      </button>
                    </div>

                    {quiz.questions.map((question, qIndex) => (
                      <section key={question.id ?? 'new-question-' + qIndex}
                        className="space-y-4 rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold">
                            {ar ? 'السؤال ' : 'Question '}{qIndex + 1}
                          </h4>
                          {!question.id && (
                            <button type="button" className={smallButton + ' text-red-600'}
                              onClick={() => patchQuiz(qi, {
                                questions: quiz.questions.filter((_, i) => i !== qIndex),
                              })}>
                              {ar ? 'إزالة السؤال' : 'Remove question'}
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm font-medium">
                            {ar ? 'نوع السؤال' : 'Question type'}
                            <select className={field} value={question.question_type}
                              onChange={e => patchQuestion(qi, qIndex, {
                                question_type: e.target.value as CourseQuizQuestionDraft['question_type'],
                                options: e.target.value === 'true_false'
                                  ? [
                                      { ...question.options[0] ?? newOption(), text_ar: 'صح', text_en: 'True' },
                                      { ...question.options[1] ?? newOption(), text_ar: 'خطأ', text_en: 'False' },
                                    ]
                                  : question.options,
                              })}>
                              <option value="single_choice">{ar ? 'اختيار واحد' : 'Single choice'}</option>
                              <option value="multiple_choice">{ar ? 'اختيارات متعددة' : 'Multiple choice'}</option>
                              <option value="true_false">{ar ? 'صح أو خطأ' : 'True / False'}</option>
                            </select>
                          </label>
                          <label className="space-y-2 text-sm font-medium">
                            {ar ? 'الدرجة' : 'Points'}
                            <input className={field} type="number" min="0.01" step="0.01" required
                              value={question.points}
                              onChange={e => patchQuestion(qi, qIndex, { points: e.target.value })} />
                          </label>
                          {languageContentType !== 'en_only' && (
<label className="space-y-2 text-sm font-medium">
                            {ar ? 'نص السؤال بالعربية' : 'Question (Arabic)'}
                            <textarea className={field} rows={3} required maxLength={5000}
                              value={question.question_ar}
                              onChange={e => patchQuestion(qi, qIndex, { question_ar: e.target.value })} />
                          </label>
)}
                          {languageContentType !== 'ar_only' && (
<label dir="ltr" className="space-y-2 text-sm font-medium">
                            Question (English)
                            <textarea className={field} rows={3} required maxLength={5000}
                              value={question.question_en}
                              onChange={e => patchQuestion(qi, qIndex, { question_en: e.target.value })} />
                          </label>
)}
                          {languageContentType !== 'en_only' && (
<label className="space-y-2 text-sm font-medium">
                            {ar ? 'تفسير الإجابة بالعربية (اختياري)' : 'Explanation (Arabic, optional)'}
                            <textarea className={field} rows={2} value={question.explanation_ar}
                              onChange={e => patchQuestion(qi, qIndex, { explanation_ar: e.target.value })} />
                          </label>
)}
                          {languageContentType !== 'ar_only' && (
<label dir="ltr" className="space-y-2 text-sm font-medium">
                            Explanation (English, optional)
                            <textarea className={field} rows={2} value={question.explanation_en}
                              onChange={e => patchQuestion(qi, qIndex, { explanation_en: e.target.value })} />
                          </label>
)}
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h5 className="font-semibold">{ar ? 'الخيارات والإجابة الصحيحة' : 'Options and correct answer'}</h5>
                            {question.question_type !== 'true_false' && (
                              <button type="button" className={smallButton}
                                onClick={() => patchQuestion(qi, qIndex, {
                                  options: [...question.options, newOption()],
                                })}>
                                {ar ? '+ إضافة خيار' : '+ Add option'}
                              </button>
                            )}
                          </div>

                          {question.options.map((option, optionIndex) => (
                            <div key={option.id ?? 'new-option-' + optionIndex}
                              className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                              <label className="flex items-center gap-2 text-xs font-medium">
                                <input
                                  type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                                  name={'correct-' + qi + '-' + qIndex}
                                  checked={option.is_correct}
                                  onChange={e => patchQuestion(qi, qIndex, {
                                    options: question.options.map((item, oi) => ({
                                      ...item,
                                      is_correct: oi === optionIndex
                                        ? e.target.checked
                                        : question.question_type === 'multiple_choice'
                                          ? item.is_correct
                                          : false,
                                    })),
                                  })}
                                />
                                {ar ? 'صحيح' : 'Correct'}
                              </label>
                              {languageContentType !== 'en_only' && (
<input className={field} aria-label={ar ? 'الخيار بالعربية' : 'Option in Arabic'}
                                required maxLength={1000} placeholder={ar ? 'الخيار بالعربية' : 'Option (Arabic)'}
                                value={option.text_ar}
                                onChange={e => patchQuestion(qi, qIndex, {
                                  options: question.options.map((item, oi) => oi === optionIndex
                                    ? { ...item, text_ar: e.target.value } : item),
                                })} />
)}
                              {languageContentType !== 'ar_only' && (
<input className={field} dir="ltr" aria-label="Option in English"
                                required maxLength={1000} placeholder="Option (English)"
                                value={option.text_en}
                                onChange={e => patchQuestion(qi, qIndex, {
                                  options: question.options.map((item, oi) => oi === optionIndex
                                    ? { ...item, text_en: e.target.value } : item),
                                })} />
)}
                              {!option.id && question.question_type !== 'true_false' && (
                                <button type="button" className={smallButton + ' text-red-600'}
                                  onClick={() => patchQuestion(qi, qIndex, {
                                    options: question.options.filter((_, i) => i !== optionIndex),
                                  })}>
                                  {ar ? 'إزالة' : 'Remove'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {quizzes.length === 0 && (
          <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            {ar ? 'لا توجد اختبارات بعد. أضف أول اختبار.' : 'No quizzes yet. Add your first quiz.'}
          </p>
        )}
      </div>
    </section>
  );
}
