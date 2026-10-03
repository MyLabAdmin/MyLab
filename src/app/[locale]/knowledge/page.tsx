import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { getCategories } from '@/app/[locale]/actions/knowledge'
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import KnowledgeFilters from './KnowledgeFilters'

async function resolveMedia(ref: string | null) {
  if (!ref) return null
  const { provider, path } = parseMediaRef(ref)
  if (provider === 'imagekit') return getImagekitSignedUrl(path)
  return ref
}

export default async function KnowledgeListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { locale } = await params
  const { q, category } = await searchParams
  const supabase = await createClient()

  const { categories } = await getCategories()
  const childrenOf = (id: string) => (categories ?? []).filter((c) => c.parent_id === id)

  let categoryIds: string[] | null = null
  if (category) {
    const children = childrenOf(category)
    categoryIds = [category, ...children.map((c) => c.id)]
  }

  let query = supabase
    .from('knowledge_items')
    .select('id, slug, cover_image_url, category_id, knowledge_item_translations(locale, title, excerpt)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (categoryIds) query = query.in('category_id', categoryIds)

  const { data: items } = await query

  const filtered = (items ?? []).filter((item) => {
    if (!q) return true
    const translation = item.knowledge_item_translations.find((tr: any) => tr.locale === locale)
    const title = translation?.title ?? ''
    const excerpt = translation?.excerpt ?? ''
    const searchText = `${title} ${excerpt}`.toLowerCase()
    return searchText.includes(q.trim().toLowerCase())
  })

  const withCovers = await Promise.all(
    filtered.map(async (item) => ({
      ...item,
      coverUrl: await resolveMedia(item.cover_image_url),
    }))
  )

  const selectedCategoryHasChildren =
    category ? childrenOf(category).length > 0 : false

  const shouldShowResults =
    Boolean(q?.trim()) ||
    Boolean(category && !selectedCategoryHasChildren)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary-700 md:text-3xl">
          {locale === 'ar' ? 'المعرفة' : 'Knowledge'}
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
          {locale === 'ar'
            ? 'مرجعك للوصول السريع إلى الاختبارات والأجهزة ومسببات الأمراض.'
            : 'Your quick reference for tests, devices, and pathogens.'}
        </p>
      </div>

      <KnowledgeFilters
        categories={categories ?? []}
        initialQuery={q ?? ''}
        initialCategory={category ?? ''}
        results={
          shouldShowResults ? (
            <div
              key="knowledge-search-results"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {withCovers.map((item) => {
                const tr = item.knowledge_item_translations.find(
                  (x: any) => x.locale === locale,
                )

                return (
                  <Link
                    key={item.id}
                    href={`/knowledge/${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-1.5 p-4">
                      <h3 className="line-clamp-1 text-sm font-semibold text-gray-800">{tr?.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {tr?.excerpt}
                      </p>
                    </div>
                  </Link>
                )
              })}

              {withCovers.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-gray-400">
                  {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </p>
              )}
            </div>
          ) : null
        }
      />
    </main>
  )
}
