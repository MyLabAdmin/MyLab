'use client'

import { useState } from 'react'
import ImageUpload from '@/components/auth/ImageUpload'

export type CourseLessonSectionDraft = {
  id: string
  heading_ar: string
  heading_en: string
  text_ar: string
  text_en: string
  image_ref: string
}

export type CourseLessonDraft = {
  id?: string
  draft_id?: string
  title_ar: string
  title_en: string
  lesson_type: 'video' | 'text' | 'file' | 'live'
  content_ar: string
  content_en: string
  sections: CourseLessonSectionDraft[]
  duration_seconds: string
  is_preview: boolean
}

export type CourseModuleDraft = {
  id?: string
  draft_id?: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  lessons: CourseLessonDraft[]
}

type Props = {
  locale: string
  languageContentType: 'ar_only' | 'en_only' | 'translated'
  modules: CourseModuleDraft[]
  setModules: React.Dispatch<React.SetStateAction<CourseModuleDraft[]>>
}

function newSection(): CourseLessonSectionDraft {
  return {
    id: crypto.randomUUID(),
    heading_ar: '',
    heading_en: '',
    text_ar: '',
    text_en: '',
    image_ref: '',
  }
}

function newLesson(): CourseLessonDraft {
  return {
    draft_id: crypto.randomUUID(),
    title_ar: '',
    title_en: '',
    lesson_type: 'text',
    content_ar: '',
    content_en: '',
    sections: [newSection()],
    duration_seconds: '',
    is_preview: false,
  }
}

function newModule(): CourseModuleDraft {
  return {
    draft_id: crypto.randomUUID(),
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    lessons: [],
  }
}

export default function CourseCurriculumEditor({ locale, languageContentType, modules, setModules }: Props) {
  const ar = locale === 'ar'
  const [collapsedModules, setCollapsedModules] = useState<number[]>([]);
  const [collapsedLessonEditor, setCollapsedLessonEditor] = useState(false);

  const [selected, setSelected] = useState<{ module: number; lesson: number | null } | null>(
    modules.length ? { module: 0, lesson: null } : null,
  )

  function patchModule(index: number, patch: Partial<CourseModuleDraft>) {
    setModules(current => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function patchLesson(moduleIndex: number, lessonIndex: number, patch: Partial<CourseLessonDraft>) {
    setModules(current => current.map((module, i) => i !== moduleIndex ? module : ({
      ...module,
      lessons: module.lessons.map((lesson, j) => j === lessonIndex ? { ...lesson, ...patch } : lesson),
    })))
  }

  function addModule() {
    const index = modules.length
    setModules(current => [...current, newModule()])
    setSelected({ module: index, lesson: null })
  }

  function addLesson(moduleIndex: number) {
    const lessonIndex = modules[moduleIndex].lessons.length
    setModules(current => current.map((module, i) => i === moduleIndex
      ? { ...module, lessons: [...module.lessons, newLesson()] }
      : module))
    setSelected({ module: moduleIndex, lesson: lessonIndex })
  }

  function moveModule(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= modules.length) return
    setModules(current => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setSelected(current => current ? { ...current, module: current.module === index ? target : current.module === target ? index : current.module } : current)
  }

  function moveLesson(moduleIndex: number, lessonIndex: number, delta: number) {
    const target = lessonIndex + delta
    const lessons = modules[moduleIndex].lessons
    if (target < 0 || target >= lessons.length) return
    setModules(current => current.map((module, i) => {
      if (i !== moduleIndex) return module
      const next = [...module.lessons]
      ;[next[lessonIndex], next[target]] = [next[target], next[lessonIndex]]
      return { ...module, lessons: next }
    }))
    setSelected({ module: moduleIndex, lesson: target })
  }

  function removeModule(index: number) {
    if (!window.confirm(ar ? 'هل تريد حذف هذه الوحدة وجميع دروسها؟' : 'Delete this module and all its lessons?')) return
    setModules(current => current.filter((_, i) => i !== index))
    setSelected(modules.length > 1
      ? { module: Math.max(0, index - 1), lesson: null }
      : null)
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    if (!window.confirm(ar ? 'هل تريد حذف هذا الدرس؟' : 'Delete this lesson?')) return
    const count = modules[moduleIndex].lessons.length
    setModules(current => current.map((module, i) => i === moduleIndex
      ? { ...module, lessons: module.lessons.filter((_, j) => j !== lessonIndex) }
      : module))
    setSelected(count > 1
      ? { module: moduleIndex, lesson: Math.max(0, lessonIndex - 1) }
      : { module: moduleIndex, lesson: null })
  }

  const fieldClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10'
  const labelClass = 'flex flex-col gap-2 text-sm font-medium text-gray-700'
  const smallButton = 'rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

  const activeModule = selected ? modules[selected.module] : null
  const activeLesson = activeModule && selected?.lesson !== null && selected?.lesson !== undefined
    ? activeModule.lessons[selected.lesson]
    : null

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {ar ? 'المنهج الدراسي' : 'Course curriculum'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {ar ? 'اختر وحدة أو درسًا من القائمة لتحرير تفاصيله.' : 'Select a module or lesson to edit its details.'}
          </p>
        </div>
        <button type="button" onClick={addModule}
          className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
          {ar ? '+ إضافة وحدة' : '+ Add module'}
        </button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.7fr)]">
        <aside className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
          <h3 className="px-2 pb-3 text-sm font-bold text-gray-700">
            {ar ? 'محتويات الدورة' : 'Outline'}
          </h3>
          {modules.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-6 text-gray-500">
              {ar ? 'لم تضف وحدات بعد. ابدأ بإضافة وحدة.' : 'No modules yet. Start by adding a module.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {modules.map((module, mi) => (
                <div key={mi} className="min-w-0">
                  <div className={'rounded-lg border p-2 ' + (selected?.module === mi && selected.lesson === null ? 'border-primary/40 bg-primary/5' : 'border-transparent')}>
                    <button type="button" onClick={() => setSelected({ module: mi, lesson: null })}
                      className="w-full break-words text-start text-sm font-semibold text-gray-800">
                      {mi + 1}. {module.title_ar || module.title_en || (ar ? 'وحدة جديدة' : 'Untitled module')}
                    </button>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={smallButton}
                        aria-expanded={!collapsedModules.includes(mi)}
                        onClick={() => setCollapsedModules(current =>
                          current.includes(mi)
                            ? current.filter(index => index !== mi)
                            : [...current, mi]
                        )}
                      >
                        {collapsedModules.includes(mi)
                          ? (ar ? 'إظهار الدروس' : 'Show lessons')
                          : (ar ? 'طيّ الدروس' : 'Collapse lessons')}
                      </button>
                      <button type="button" className={smallButton} disabled={mi === 0} onClick={() => moveModule(mi, -1)} aria-label={ar ? 'نقل الوحدة للأعلى' : 'Move module up'}>↑</button>
                      <button type="button" className={smallButton} disabled={mi === modules.length - 1} onClick={() => moveModule(mi, 1)} aria-label={ar ? 'نقل الوحدة للأسفل' : 'Move module down'}>↓</button>
                      <button type="button" className={smallButton} onClick={() => addLesson(mi)}>
                        {ar ? '+ درس' : '+ Lesson'}
                      </button>
                      <button type="button" className={smallButton + ' text-red-600'} onClick={() => removeModule(mi)}>
                        {ar ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  {!collapsedModules.includes(mi) && (
                  <div className="ms-3 mt-1 flex flex-col gap-1 border-s border-gray-200 ps-2">
                    {module.lessons.map((lesson, li) => (
                      <div key={li} className={'rounded-lg border p-2 ' + (selected?.module === mi && selected.lesson === li ? 'border-primary/40 bg-primary/5' : 'border-transparent')}>
                        <button type="button" onClick={() => setSelected({ module: mi, lesson: li })}
                          className="w-full break-words text-start text-xs leading-5 text-gray-700">
                          {li + 1}. {lesson.title_ar || lesson.title_en || (ar ? 'درس جديد' : 'Untitled lesson')}
                        </button>
                        <div className="mt-1 flex gap-1.5">
                          <button type="button" className={smallButton} disabled={li === 0} onClick={() => moveLesson(mi, li, -1)} aria-label={ar ? 'نقل الدرس للأعلى' : 'Move lesson up'}>↑</button>
                          <button type="button" className={smallButton} disabled={li === module.lessons.length - 1} onClick={() => moveLesson(mi, li, 1)} aria-label={ar ? 'نقل الدرس للأسفل' : 'Move lesson down'}>↓</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="min-w-0 rounded-xl border border-gray-200 p-4 sm:p-5">
          {!activeModule ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-gray-500">{ar ? 'أضف وحدة لبدء تحرير المنهج.' : 'Add a module to start editing the curriculum.'}</p>
              <button type="button" onClick={addModule} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
                {ar ? '+ إضافة وحدة' : '+ Add module'}
              </button>
            </div>
          ) : activeLesson && selected?.lesson !== null ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900">{ar ? 'تحرير الدرس' : 'Edit lesson'}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={smallButton}
                    aria-expanded={!collapsedLessonEditor}
                    onClick={() => setCollapsedLessonEditor(value => !value)}
                  >
                    {collapsedLessonEditor
                      ? (ar ? 'إظهار المحتوى' : 'Show content')
                      : (ar ? 'طيّ المحتوى' : 'Collapse content')}
                  </button>
                  <button type="button" className={smallButton + ' text-red-600'}
                  onClick={() => removeLesson(selected!.module, selected!.lesson!)}>
                    {ar ? 'حذف الدرس' : 'Delete lesson'}
                  </button>
                </div>
              </div>
              {!collapsedLessonEditor && (
              <>
              <div className="grid gap-4 sm:grid-cols-2">
                {languageContentType !== 'en_only' && (
                <label className={labelClass}>
                  عنوان الدرس بالعربية *
                  <input required maxLength={200} value={activeLesson.title_ar} className={fieldClass}
                    onChange={e => patchLesson(selected!.module, selected!.lesson!, { title_ar: e.target.value })} />

</label>
)}
{languageContentType !== 'ar_only' && (
                <label dir="ltr" className={labelClass}>
                  Lesson title *
                  <input required maxLength={200} value={activeLesson.title_en} className={fieldClass}
                    onChange={e => patchLesson(selected!.module, selected!.lesson!, { title_en: e.target.value })} />

                </label>
                )}
                <label className={labelClass}>
                  {ar ? 'نوع الدرس' : 'Lesson type'}
                  <select value={activeLesson.lesson_type} className={fieldClass}
                    onChange={e => patchLesson(selected!.module, selected!.lesson!, { lesson_type: e.target.value as CourseLessonDraft['lesson_type'] })}>
                    <option value="text">{ar ? 'نصي' : 'Text'}</option>
                    <option value="video">{ar ? 'فيديو' : 'Video'}</option>
                    <option value="file">{ar ? 'ملف' : 'File'}</option>
                    <option value="live">{ar ? 'مباشر' : 'Live'}</option>
                  </select>
                </label>
                <label className={labelClass}>
                  {ar ? 'المدة بالثواني (اختياري)' : 'Duration in seconds (optional)'}
                  <input type="number" min="0" step="1" inputMode="numeric" value={activeLesson.duration_seconds} className={fieldClass}
                    onChange={e => patchLesson(selected!.module, selected!.lesson!, { duration_seconds: e.target.value })} />
                </label>
              </div>
              {activeLesson.lesson_type === 'text' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-gray-900">
                      {ar ? 'أقسام محتوى الدرس' : 'Lesson content sections'}
                    </h4>
                    <button
                      type="button"
                      className={smallButton}
                      onClick={() => patchLesson(selected!.module, selected!.lesson!, {
                        sections: [...(activeLesson.sections ?? []), newSection()],
                      })}
                    >
                      {ar ? '+ إضافة قسم' : '+ Add section'}
                    </button>
                  </div>
                  {(activeLesson.sections ?? []).map((section, sectionIndex) => (
                    <section key={section.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="font-semibold text-gray-800">
                          {ar ? 'القسم ' : 'Section '}{sectionIndex + 1}
                        </h5>
                        <button
                          type="button"
                          className={smallButton + ' text-red-600'}
                          onClick={() => patchLesson(selected!.module, selected!.lesson!, {
                            sections: (activeLesson.sections ?? []).filter(item => item.id !== section.id),
                          })}
                        >
                          {ar ? 'حذف القسم' : 'Remove section'}
                        </button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
   {languageContentType !== 'en_only' && (
                     <label className={labelClass}>
                          {ar ? 'العنوان الفرعي بالعربية *' : 'Arabic subheading *'}
                          <input maxLength={200} value={section.heading_ar} className={fieldClass}
                            onChange={e => patchLesson(selected!.module, selected!.lesson!, {
                              sections: (activeLesson.sections ?? []).map(item =>
                                item.id === section.id ? { ...item, heading_ar: e.target.value } : item),
                            })} />

</label>
)}
   {languageContentType !== 'ar_only' && (
                     <label dir="ltr" className={labelClass}>
                          English subheading *
                          <input maxLength={200} value={section.heading_en} className={fieldClass}
                            onChange={e => patchLesson(selected!.module, selected!.lesson!, {
                              sections: (activeLesson.sections ?? []).map(item =>
                                item.id === section.id ? { ...item, heading_en: e.target.value } : item),
                            })} />

</label>
)}
   {languageContentType !== 'en_only' && (
                     <label className={labelClass}>
                          {ar ? 'النص بالعربية *' : 'Arabic text *'}
                          <textarea rows={6} maxLength={20000} value={section.text_ar} className={fieldClass}
                            onChange={e => patchLesson(selected!.module, selected!.lesson!, {
                              sections: (activeLesson.sections ?? []).map(item =>
                                item.id === section.id ? { ...item, text_ar: e.target.value } : item),
                            })} />

</label>
)}
   {languageContentType !== 'ar_only' && (
                     <label dir="ltr" className={labelClass}>
                          English text *
                          <textarea rows={6} maxLength={20000} value={section.text_en} className={fieldClass}
                            onChange={e => patchLesson(selected!.module, selected!.lesson!, {
                              sections: (activeLesson.sections ?? []).map(item =>
                                item.id === section.id ? { ...item, text_en: e.target.value } : item),
                            })} />

</label>
)}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={labelClass}>{ar ? 'صورة القسم (اختياري)' : 'Section image (optional)'}</span>
                        <ImageUpload
                          value={section.image_ref}
                          folder="/courses/sections"
                          scope="knowledge"
                          onChange={ref => patchLesson(selected!.module, selected!.lesson!, {
                            sections: (activeLesson.sections ?? []).map(item =>
                              item.id === section.id ? { ...item, image_ref: ref } : item),
                          })}
                        />
                      </div>
                    </section>
                  ))}
                  {(activeLesson.sections ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {ar ? 'أضف قسمًا واحدًا على الأقل لهذا الدرس.' : 'Add at least one section to this lesson.'}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs leading-5 text-gray-500">
                  {ar ? 'يمكنك تحديد نوع الدرس الآن؛ ربط ملفات أو فيديوهات الدرس يحتاج خطوة منفصلة.' : 'You can set the lesson type now; attaching lesson files or videos will be handled separately.'}
                </p>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={activeLesson.is_preview} className="h-4 w-4 rounded border-gray-300"
                  onChange={e => patchLesson(selected!.module, selected!.lesson!, { is_preview: e.target.checked })} />
                {ar ? 'إتاحة الدرس كمعاينة' : 'Make this lesson a preview'}
              </label>
              </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900">{ar ? 'تحرير الوحدة' : 'Edit module'}</h3>
                <button type="button" className={smallButton + ' text-red-600'} onClick={() => removeModule(selected!.module)}>
                  {ar ? 'حذف الوحدة' : 'Delete module'}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {languageContentType !== 'en_only' && (
                <label className={labelClass}>
                  عنوان الوحدة بالعربية *
                  <input required maxLength={200} value={activeModule.title_ar} className={fieldClass}
                    onChange={e => patchModule(selected!.module, { title_ar: e.target.value })} />

</label>
)}
{languageContentType !== 'ar_only' && (
                <label dir="ltr" className={labelClass}>
                  Module title *
                  <input required maxLength={200} value={activeModule.title_en} className={fieldClass}
                    onChange={e => patchModule(selected!.module, { title_en: e.target.value })} />

</label>
)}
{languageContentType !== 'en_only' && (
                <label className={labelClass}>
                  وصف الوحدة
                  <textarea rows={4} maxLength={5000} value={activeModule.description_ar} className={fieldClass}
                    onChange={e => patchModule(selected!.module, { description_ar: e.target.value })} />

</label>
)}
{languageContentType !== 'ar_only' && (
                <label dir="ltr" className={labelClass}>
                  Module description
                  <textarea rows={4} maxLength={5000} value={activeModule.description_en} className={fieldClass}
                    onChange={e => patchModule(selected!.module, { description_en: e.target.value })} />

                </label>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  {ar ? 'عدد الدروس: ' : 'Lessons: '}{activeModule.lessons.length}
                </p>
                <button type="button" onClick={() => addLesson(selected!.module)}
                  className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                  {ar ? '+ إضافة درس لهذه الوحدة' : '+ Add lesson to this module'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
