'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  results,
}: {
  categories: CategoryOption[]
  initialQuery: string
  initialCategory: string
  results?: ReactNode
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const urlCategory = searchParams.get('category') ?? ''
  const urlQuery = searchParams.get('q') ?? ''

  const urlCategoryParent = categories.find(
    (category) => category.id === urlCategory,
  )?.parent_id

  const syncedRootId = urlCategoryParent ?? urlCategory
  const syncedSubId = urlCategoryParent ? urlCategory : ''

  useEffect(() => {
    setRootId(syncedRootId)
    setSubId(syncedSubId)
    setQ(urlQuery)
  }, [syncedRootId, syncedSubId, urlQuery])

  const effectiveRootId = rootId
  const effectiveSubId = subId
  const subOptions = effectiveRootId ? childrenOf(effectiveRootId) : []
  const activeRoot = roots.find((root) => root.id === effectiveRootId)

  function pushFilters(query: string, categoryId: string) {
    const params = new URLSearchParams()

    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('category', categoryId)

    const search = params.toString()
    router.push(search ? `/knowledge?${search}` : '/knowledge')
  }

  function replaceSearch(query: string, categoryId: string) {
    const params = new URLSearchParams()

    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('category', categoryId)

    const search = params.toString()
    router.replace(search ? `/knowledge?${search}` : '/knowledge')
  }

  function scheduleSearch(query: string) {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      replaceSearch(query, effectiveSubId || effectiveRootId)
      searchTimerRef.current = null
    }, 350)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    pushFilters(q, effectiveSubId || effectiveRootId)
  }

  function selectRoot(root: CategoryOption) {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    setRootId(root.id)
    setSubId('')
    pushFilters(q, root.id)
  }

  function selectSubcategory(category: CategoryOption) {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    setSubId(category.id)
    pushFilters(q, category.id)
  }

  function clearFilters() {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    setQ('')
    setRootId('')
    setSubId('')
    router.push('/knowledge')
  }

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

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
            onChange={(e) => {
              const value = e.target.value
              setQ(value)
              scheduleSearch(value)
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
            placeholder={
              locale === 'ar'
                ? 'ابحث في المعرفة...'
                : 'Search knowledge...'
            }
          />

          {q && (
            <button
              type="button"
              onClick={() => {
                if (searchTimerRef.current) {
                  clearTimeout(searchTimerRef.current)
                  searchTimerRef.current = null
                }
                setQ('')
                replaceSearch('', effectiveSubId || effectiveRootId)
              }}
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

        {subId && (
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              {(() => {
                const selectedCategory = categories.find(
                  (category) => category.id === subId,
                )

                return selectedCategory
                  ? nameOf(selectedCategory)
                  : activeRoot
                    ? nameOf(activeRoot)
                    : ''
              })()}
            </h2>

            <button
              type="button"
              onClick={() => {
                setSubId('')
                pushFilters(q, effectiveRootId)
              }}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
            >
              {locale === 'ar' ? 'العودة' : 'Back'}
            </button>
          </div>
        )}

        {!rootId && (
          <div className="grid gap-4 md:grid-cols-2">
            {roots.map((root) => {
              const Icon =
                sectionIcons[root.section as keyof typeof sectionIcons] ??
                Newspaper

              return (
                <div
                  key={root.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => selectRoot(root)}
                    className="group flex w-full items-center gap-3 text-start"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>

                    <span className="block min-w-0 font-semibold text-gray-900">
                      {nameOf(root)}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

      {activeRoot && !subId && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              {nameOf(activeRoot)}
            </h2>

            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
            >
              {locale === 'ar' ? 'كل التصنيفات' : 'All categories'}
            </button>
          </div>

          {subOptions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {subOptions.map((sub) => {
                const Icon =
                  sectionIcons[sub.section as keyof typeof sectionIcons] ??
                  Newspaper

                const active = sub.id === subId

                return (
                  <div
                    key={sub.id}
                    className={
                      active
                        ? 'rounded-2xl border border-primary-200 bg-primary-50/30 p-4 shadow-sm'
                        : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => selectSubcategory(sub)}
                      className="group flex w-full items-center gap-3 text-start"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>

                      <span className="block min-w-0 font-semibold text-gray-900">
                        {nameOf(sub)}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}


        </div>
      )}

      {results}
    </section>
  )
}
