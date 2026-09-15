'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import ImageUpload from '@/components/auth/ImageUpload'
import BlockEditor from './BlockEditor'
import { createKnowledgeItem, type BlockInput } from '@/app/[locale]/actions/knowledge'

type CategoryOption = {
  id: string
  parent_id: string | null
  section: string
  slug: string
  category_translations: { locale: string; name: string }[]
}

function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text)
}

export default function UploadForm({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations('KnowledgeAdmin')
  const locale = useLocale()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  const [rootCategoryId, setRootCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [excerptAr, setExcerptAr] = useState('')
  const [coverImageRef, setCoverImageRef] = useState('')

  const [blocks, setBlocks] = useState<BlockInput[]>([])
  const [previewMode, setPreviewMode] = useState<'free' | 'paid'>('free')

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)
  const nameOf = (c: CategoryOption) => c.category_translations.find((tr) => tr.locale === locale)?.name ?? c.section

  const subOptions = rootCategoryId ? childrenOf(rootCategoryId) : []
  const finalCategoryId = subOptions.length > 0 ? subCategoryId : rootCategoryId
  const selectedCategory = categories.find((c) => c.id === finalCategoryId)
  const folderPath = selectedCategory ? `/knowledge/${selectedCategory.slug}` : '/knowledge/misc'

  function addBlock() {
    setBlocks([...blocks, { blockType: 'text', isPaid: false, contentEn: '', contentAr: '' }])
  }
  function updateBlock(i: number, updated: BlockInput) {
    const copy = [...blocks]
    copy[i] = updated
    setBlocks(copy)
  }
  function moveBlock(i: number, dir: -1 | 1) {
    const copy = [...blocks]
    const [item] = copy.splice(i, 1)
    copy.splice(i + dir, 0, item)
    setBlocks(copy)
  }
  function deleteBlock(i: number) {
    setBlocks(blocks.filter((_, idx) => idx !== i))
  }

  function checkLangPair(en: string, ar: string, fieldNameEn: string, fieldNameAr: string): string {
    if (en.trim() && hasArabic(en)) {
      return locale === 'ar'
        ? `حقل "${fieldNameEn}" (إنجليزي) فيه نص عربي بالغلط`
        : `The "${fieldNameEn}" field contains Arabic text by mistake`
    }
    if (ar.trim() && !hasArabic(ar)) {
      return locale === 'ar'
        ? `حقل "${fieldNameAr}" (عربي) فيه نص إنجليزي بالغلط`
        : `The "${fieldNameAr}" field does not contain Arabic text`
    }
    return ''
  }

  const msg = {
    rootRequired: locale === 'ar' ? 'اختر التصنيف الرئيسي' : 'Select the main category',
    subRequired: locale === 'ar' ? 'اختر التصنيف الفرعي' : 'Select the subcategory',
    titleEn: locale === 'ar' ? 'العنوان بالإنجليزي مطلوب' : 'English title is required',
    titleAr: locale === 'ar' ? 'العنوان بالعربي مطلوب' : 'Arabic title is required',
    excerptEn: locale === 'ar' ? 'المقتطف بالإنجليزي مطلوب' : 'English excerpt is required',
    excerptAr: locale === 'ar' ? 'المقتطف بالعربي مطلوب' : 'Arabic excerpt is required',
  }

  function validateStep1() {
    if (!rootCategoryId) return msg.rootRequired
    if (subOptions.length > 0 && !subCategoryId) return msg.subRequired
    if (!titleEn.trim()) return msg.titleEn
    if (!titleAr.trim()) return msg.titleAr
    if (!excerptEn.trim()) return msg.excerptEn
    if (!excerptAr.trim()) return msg.excerptAr

    const titleLangErr = checkLangPair(titleEn, titleAr, 'Title EN', 'Title AR')
    if (titleLangErr) return titleLangErr
    const excerptLangErr = checkLangPair(excerptEn, excerptAr, 'Excerpt EN', 'Excerpt AR')
    if (excerptLangErr) return excerptLangErr

    return ''
  }

  function validateBlocks() {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      const n = i + 1
      if (!b.contentEn.trim()) {
        return locale === 'ar' ? `البلوك رقم ${n}: المحتوى بالإنجليزي مطلوب` : `Block ${n}: English content is required`
      }
      if (!b.contentAr.trim()) {
        return locale === 'ar' ? `البلوك رقم ${n}: المحتوى بالعربي مطلوب` : `Block ${n}: Arabic content is required`
      }

      const contentLangErr = checkLangPair(b.contentEn, b.contentAr, `Block ${n} content EN`, `Block ${n} content AR`)
      if (contentLangErr) return contentLangErr

      const hasEnSub = !!b.subtitleEn?.trim()
      const hasArSub = !!b.subtitleAr?.trim()
      if (hasEnSub && !hasArSub) {
        return locale === 'ar' ? `البلوك رقم ${n}: أضف العنوان الفرعي بالعربي كمان` : `Block ${n}: add the Arabic subtitle too`
      }
      if (hasArSub && !hasEnSub) {
        return locale === 'ar' ? `البلوك رقم ${n}: أضف العنوان الفرعي بالإنجليزي كمان` : `Block ${n}: add the English subtitle too`
      }
      if (hasEnSub && hasArSub) {
        const subLangErr = checkLangPair(b.subtitleEn!, b.subtitleAr!, `Block ${n} subtitle EN`, `Block ${n} subtitle AR`)
        if (subLangErr) return subLangErr
      }
    }
    return ''
  }

  function handleNext() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  async function handleSave(status: 'draft' | 'published') {
    const err1 = validateStep1()
    const err2 = validateBlocks()
    if (err1 || err2) { setError(err1 || err2); return }

    setSubmitting(true)
    setError('')

    const result = await createKnowledgeItem({
      categoryId: finalCategoryId,
      titleEn,
      titleAr,
      excerptEn,
      excerptAr,
      coverImageRef,
      blocks,
      status,
    })

    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Error')
      return
    }
    setSuccessId(result.itemId ?? null)
  }

  if (successId) {
    return (
      <div className="text-center">
        <p className="text-primary-700 font-semibold">
          {locale === 'ar' ? 'تم الحفظ بنجاح ✅' : 'Saved successfully ✅'}
        </p>
        <p className="text-sm text-gray-500">ID: {successId}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-lg md:text-xl font-bold text-primary-700">{t('pageTitle')}</h1>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{t('step1Title')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={rootCategoryId}
              onChange={(e) => { setRootCategoryId(e.target.value); setSubCategoryId('') }}
              className="input"
            >
              <option value="">{t('categoryLabel')}</option>
              {roots.map((root) => (
                <option key={root.id} value={root.id}>{nameOf(root)}</option>
              ))}
            </select>

            <select
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              className="input"
              disabled={subOptions.length === 0}
            >
              <option value="">{subOptions.length === 0 ? '-' : t('subcategoryLabel')}</option>
              {subOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>{nameOf(sub)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder={`${t('titleLabel')} (EN)`} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="input" />
            <input placeholder={`${t('titleLabel')} (AR)`} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="input" dir="rtl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea placeholder={`${t('excerptLabel')} (EN)`} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} className="input min-h-16" />
            <textarea placeholder={`${t('excerptLabel')} (AR)`} value={excerptAr} onChange={(e) => setExcerptAr(e.target.value)} className="input min-h-16" dir="rtl" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('coverImageLabel')}</label>
            <ImageUpload value={coverImageRef} onChange={setCoverImageRef} folder={folderPath} />
          </div>

          <button type="button" onClick={handleNext} className="btn-primary sm:w-auto sm:self-end sm:px-8">
            {t('nextButton')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{t('step2Title')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocks.map((b, i) => (
              <BlockEditor
                key={i}
                block={b}
                index={i}
                total={blocks.length}
                onChange={(updated) => updateBlock(i, updated)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                onDelete={() => deleteBlock(i)}
              />
            ))}
          </div>

          <button type="button" onClick={addBlock} className="text-sm text-primary-600 font-medium self-start">
            {t('addBlock')}
          </button>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 sm:flex-none sm:px-8 rounded-lg border border-gray-300 py-2.5">
              {t('backButton')}
            </button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 sm:flex-none sm:px-8 btn-primary sm:ms-auto">
              {t('nextButton')}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{t('step3Title')}</h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode('free')}
              className={`flex-1 rounded-lg py-2 text-sm ${previewMode === 'free' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
            >
              {t('previewAsFree')}
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('paid')}
              className={`flex-1 rounded-lg py-2 text-sm ${previewMode === 'paid' ? 'bg-primary-600 text-white' : 'border border-gray-300'}`}
            >
              {t('previewAsPaid')}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 max-w-xl mx-auto w-full">
            <h3 className="font-bold text-lg">{locale === 'ar' ? titleAr : titleEn}</h3>
            <p className="text-sm text-gray-500">{locale === 'ar' ? excerptAr : excerptEn}</p>

            {blocks.map((b, i) => {
              const subtitle = locale === 'ar' ? b.subtitleAr : b.subtitleEn
              return (
                <div key={i} className="text-sm flex flex-col gap-1">
                  {subtitle && <p className="font-medium text-gray-700">{subtitle}</p>}
                  {b.isPaid && previewMode === 'free' ? (
                    <p className="bg-gray-100 rounded-lg p-3 text-gray-400">{t('lockedContent')}</p>
                  ) : (
                    <p>{locale === 'ar' ? b.contentAr : b.contentEn}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 sm:flex-none sm:px-8 rounded-lg border border-gray-300 py-2.5">
              {t('backButton')}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave('draft')}
              className="flex-1 sm:flex-none sm:px-8 rounded-lg border border-primary-300 text-primary-700 py-2.5 disabled:opacity-60"
            >
              {t('saveDraftButton')}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave('published')}
              className="flex-1 sm:flex-none sm:px-8 btn-primary disabled:opacity-60"
            >
              {t('publishButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
