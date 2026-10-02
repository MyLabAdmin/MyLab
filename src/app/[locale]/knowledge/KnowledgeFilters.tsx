'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Bug,
  FlaskConical,
  Microscope,
  Newspaper,
  Search,
  X,
} from 'lucide-react'

type CategoryOption = {
  id: string
  parent_id: string | null
  section: string
  category_translations: { locale: string; name: string }[]
}

const sectionIcons = {
  tests: FlaskConical,
  devices: Microscope,
  pathogens: Bug,
  articles: Newspaper,
} as const

export default function KnowledgeFilters({
  categories,
  initialQuery,
  initialCategory,
}: {
  categories: CategoryOption[]
  initialQuery: string
  initialCategory: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()

  const roots = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories],
  )

  const childrenOf = (id: string) =>
    categories.filter((category) => category.parent_id === id)

  const nameOf = (category: CategoryOption) =>
    category.category_translations.find((tr) => tr.locale === locale)?.name ??
    category.section

  const initialIsChild = categories.find(
    (category) => category.id === initialCategory,
  )?.parent_id

  const [rootId, setRootId] = useState(
    initialIsChild ?? initialCategory ?? '',
  )
  const [subId, setSubId] = useState(
    initialIsChild ? initialCategory : '',
  )
  const [q, setQ] = useState(initialQuery)

  const urlCategory = searchParams.get('category') ?? ''
  const urlQuery = searchParams.get('q') ?? ''

  const urlCategoryParent = categories.find(
    (category) => category.id === urlCategory,
  )?.parent_id

  const syncedRootId = urlCategoryParent ?? urlCategory
  const syncedSubId = urlCategoryParent ? urlCategory : ''

  useEffect(() => {
    if (rootId !== syncedRootId) {
      setRootId(syncedRootId)
    }

    if (subId !== syncedSubId) {
      setSubId(syncedSubId)
    }

    if (q !== urlQuery) {
      setQ(urlQuery)
    }
  }, [rootId, syncedRootId, subId, syncedSubId, q, urlQuery])

  const effectiveRootId = syncedRootId
  const effectiveSubId = syncedSubId
  const subOptions = effectiveRootId ? childrenOf(effectiveRootId) : []
  const activeRoot = roots.find((root) => root.id === effectiveRootId)

  function pushFilters(query: string, categoryId: string) {
    const params = new URLSearchParams()

    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('category', categoryId)

    const search = params.toString()
    router.push(search ? `/knowledge?${search}` : '/knowledge')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    pushFilters(q, effectiveSubId || effectiveRootId)
  }

  function selectRoot(root: CategoryOption) {
    setRootId(root.id)
    setSubId('')
    pushFilters(q, root.id)
  }

  function selectSubcategory(category: CategoryOption) {
    setSubId(category.id)
    pushFilters(q, category.id)
  }

  function clearFilters() {
    setQ('')
    setRootId('')
    setSubId('')
    router.push('/knowledge')
  }

  return (
    <section className="flex flex-col gap-6">
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
      >
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-gray-50 px-3 sm:px-4">
          <Search
            className="h-5 w-5 shrink-0 text-gray-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              locale === 'ar'
                ? 'ابحث في المعرفة...'
                : 'Search knowledge...'
            }
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            {locale === 'ar' ? 'بحث' : 'Search'}
          </button>
        </div>
      </form>

      {!rootId && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roots.map((root) => {
            const Icon =
              sectionIcons[root.section as keyof typeof sectionIcons] ??
              Newspaper

            const childCount = childrenOf(root.id).length

            return (
              <button
                key={root.id}
                type="button"
                onClick={() => selectRoot(root)}
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>

                <span className="block font-semibold text-gray-900">
                  {nameOf(root)}
                </span>

                <span className="mt-1 block text-xs text-gray-500">
                  {childCount > 0
                    ? locale === 'ar'
                      ? `${childCount} تصنيفات فرعية`
                      : `${childCount} subcategories`
                    : locale === 'ar'
                      ? 'استكشف المحتوى'
                      : 'Explore content'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {activeRoot && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {nameOf(activeRoot)}
              </h2>

              {subOptions.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {locale === 'ar'
                    ? 'اختر تصنيفًا فرعيًا للتصفية.'
                    : 'Choose a subcategory to filter the content.'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
            >
              {locale === 'ar' ? 'كل التصنيفات' : 'All categories'}
            </button>
          </div>

          {subOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subOptions.map((sub) => {
                const active = sub.id === subId

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => selectSubcategory(sub)}
                    className={
                      active
                        ? 'rounded-full border border-primary-600 bg-primary-600 px-4 py-2 text-sm font-medium text-white transition'
                        : 'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:text-primary-700'
                    }
                  >
                    {nameOf(sub)}
                  </button>
                )
              })}
            </div>
          )}

          {subId && (
            <button
              type="button"
              onClick={() => {
                setSubId('')
                pushFilters(q, effectiveRootId)
              }}
              className="self-start text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {locale === 'ar'
                ? 'العودة إلى كل محتوى التصنيف'
                : 'Back to all content in category'}
            </button>
          )}
        </div>
      )}

      {(effectiveRootId || q) && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-500">
            {q
              ? locale === 'ar'
                ? `نتائج البحث عن: ${q}`
                : `Search results for: ${q}`
              : activeRoot
                ? nameOf(activeRoot)
                : ''}
          </span>

          {rootId && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {locale === 'ar' ? 'عرض كل التصنيفات' : 'View all categories'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
