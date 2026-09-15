'use client'

import { useState, useMemo } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

type CategoryOption = {
  id: string
  parent_id: string | null
  section: string
  category_translations: { locale: string; name: string }[]
}

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
  const locale = useLocale()

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id)
  const nameOf = (c: CategoryOption) => c.category_translations.find((tr) => tr.locale === locale)?.name ?? c.section

  const initialIsChild = categories.find((c) => c.id === initialCategory)?.parent_id
  const [rootId, setRootId] = useState(initialIsChild ?? initialCategory ?? '')
  const [subId, setSubId] = useState(initialIsChild ? initialCategory : '')
  const [q, setQ] = useState(initialQuery)

  const subOptions = rootId ? childrenOf(rootId) : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = subId || rootId
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (finalCategory) params.set('category', finalCategory)
    router.push(`/knowledge?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
        className="input flex-1"
      />
      <select
        value={rootId}
        onChange={(e) => { setRootId(e.target.value); setSubId('') }}
        className="input sm:w-48"
      >
        <option value="">{locale === 'ar' ? 'التصنيف الرئيسي' : 'Main category'}</option>
        {roots.map((root) => (
          <option key={root.id} value={root.id}>{nameOf(root)}</option>
        ))}
      </select>
      <select
        value={subId}
        onChange={(e) => setSubId(e.target.value)}
        className="input sm:w-48"
        disabled={subOptions.length === 0}
      >
        <option value="">{subOptions.length === 0 ? '-' : (locale === 'ar' ? 'التصنيف الفرعي' : 'Subcategory')}</option>
        {subOptions.map((sub) => (
          <option key={sub.id} value={sub.id}>{nameOf(sub)}</option>
        ))}
      </select>
      <button type="submit" className="btn-primary sm:w-auto sm:px-6">
        {locale === 'ar' ? 'بحث' : 'Search'}
      </button>
    </form>
  )
}
