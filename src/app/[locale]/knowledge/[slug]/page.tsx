import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'

async function resolveMedia(ref: string | null) {
  if (!ref) return null
  const { provider, path } = parseMediaRef(ref)
  if (provider === 'imagekit') return getImagekitSignedUrl(path)
  return ref
}

export default async function KnowledgeItemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations('KnowledgeAdmin')
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('knowledge_items')
    .select(
      `id, cover_image_url,
       knowledge_item_translations(locale, title, excerpt),
       knowledge_blocks(id, block_type, is_paid, order_index, media_url,
         knowledge_block_translations(locale, content))`
    )
    .eq('slug', slug)
    .single()

  if (!item) notFound()

  const translation = item.knowledge_item_translations.find((tr) => tr.locale === locale)
  const coverUrl = await resolveMedia(item.cover_image_url)

  const sortedBlocks = [...item.knowledge_blocks].sort((a, b) => a.order_index - b.order_index)

  const userHasPaidAccess = false // TODO: يتغير لما نبني نظام الاشتراكات/الشراء

  const renderedBlocks = await Promise.all(
    sortedBlocks.map(async (b) => {
      const bt = b.knowledge_block_translations.find((tr) => tr.locale === locale)
      const locked = b.is_paid && !userHasPaidAccess
      const mediaUrl = b.block_type === 'image' && b.media_url && !locked ? await resolveMedia(b.media_url) : null
      return {
        id: b.id,
        blockType: b.block_type,
        locked,
        subtitle: bt?.content?.subtitle as string | null,
        text: bt?.content?.text as string | null,
        mediaUrl,
      }
    })
  )

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
      {coverUrl && <img src={coverUrl} alt="" className="w-full rounded-lg" />}
      <h1 className="text-xl md:text-2xl font-bold text-primary-700">{translation?.title}</h1>
      <p className="text-gray-500">{translation?.excerpt}</p>

      {renderedBlocks.map((b) => (
        <div key={b.id} className="flex flex-col gap-2">
          {b.subtitle && <h3 className="font-semibold text-gray-800">{b.subtitle}</h3>}
          {b.locked ? (
            <p className="bg-gray-100 rounded-lg p-4 text-gray-400 text-center">{t('lockedContent')}</p>
          ) : (
            <>
              {b.mediaUrl && <img src={b.mediaUrl} alt="" className="w-full rounded-lg" />}
              {b.text && <p className="text-gray-700 leading-relaxed">{b.text}</p>}
            </>
          )}
        </div>
      ))}
    </main>
  )
}
