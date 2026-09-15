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
    categoryIds = children.length > 0 ? children.map((c) => c.id) : [category]
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
    const title = item.knowledge_item_translations.find((tr: any) => tr.locale === locale)?.title ?? ''
    return title.toLowerCase().includes(q.toLowerCase())
  })

  const withCovers = await Promise.all(
    filtered.map(async (item) => ({
      ...item,
      coverUrl: await resolveMedia(item.cover_image_url),
    }))
  )

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      <h1 className="text-xl md:text-2xl font-bold text-primary-700">
        {locale === 'ar' ? 'المعرفة' : 'Knowledge'}
      </h1>

      <KnowledgeFilters
        categories={categories ?? []}
        initialQuery={q ?? ''}
        initialCategory={category ?? ''}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {withCovers.map((item) => {
          const tr = item.knowledge_item_translations.find((x: any) => x.locale === locale)
          return (
            <Link
              key={item.id}
              href={`/knowledge/${item.slug}`}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {item.coverUrl && (
                <img src={item.coverUrl} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-3 flex flex-col gap-1">
                <h3 className="font-semibold text-gray-800">{tr?.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{tr?.excerpt}</p>
              </div>
            </Link>
          )
        })}
        {withCovers.length === 0 && (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">
            {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
          </p>
        )}
      </div>
    </main>
  )
}
