import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import KnowledgeBookmarkButton from './KnowledgeBookmarkButton'

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
  const { data: userData } = await supabase.auth.getUser()

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

  const { data: bookmarkRow } = userData.user
    ? await supabase
        .from('bookmarks')
        .select('id')
        .eq('target_type', 'knowledge_item')
        .eq('target_id', item.id)
        .eq('user_id', userData.user.id)
        .maybeSingle()
    : { data: null }

  const isBookmarked = !!bookmarkRow

  const renderedBlocks = await Promise.all(
    sortedBlocks.map(async (b) => {
      const bt = b.knowledge_block_translations.find((tr) => tr.locale === locale)
      const locked = b.is_paid && !userHasPaidAccess
      const mediaUrl =
        (b.block_type === 'image' || b.block_type === 'video') && b.media_url && !locked
          ? await resolveMedia(b.media_url)
          : null
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-primary-700">
          {translation?.title}
        </h1>

        {userData.user && (
          <KnowledgeBookmarkButton
            itemId={item.id}
            initialBookmarked={isBookmarked}
          />
        )}
      </div>
      <p className="text-gray-500">{translation?.excerpt}</p>

      {renderedBlocks.map((b) => (
        <div key={b.id} className="flex flex-col gap-2">
          {b.subtitle && <h3 className="font-semibold text-gray-800">{b.subtitle}</h3>}
          {b.locked ? (
            <p className="bg-gray-100 rounded-lg p-4 text-gray-400 text-center">{t('lockedContent')}</p>
          ) : (
            <>
              {b.blockType === 'image' && b.mediaUrl && (
                <img src={b.mediaUrl} alt="" className="w-full rounded-lg" />
              )}

              {b.blockType === 'video' && b.mediaUrl && (
                <video
                  src={b.mediaUrl}
                  controls
                  preload="metadata"
                  className="w-full rounded-lg"
                />
              )}

              {b.blockType === 'list' && b.text && (
                <ul className="list-disc ps-6 space-y-1 text-gray-700">
                  {b.text
                    .split(/\r?\n/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                </ul>
              )}

              {b.blockType === 'quote' && b.text && (
                <blockquote className="border-s-4 border-gray-300 ps-4 italic text-gray-600">
                  {b.text}
                </blockquote>
              )}

              {b.blockType === 'text' && b.text && (
                <p className="text-gray-700 leading-relaxed">{b.text}</p>
              )}
            </>
          )}
        </div>
      ))}
    </main>
  )
}
