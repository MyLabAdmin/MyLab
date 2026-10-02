import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { parseMediaRef } from '@/lib/storage'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import KnowledgeBookmarkButton from './KnowledgeBookmarkButton'
import KnowledgePurchaseButton from './KnowledgePurchaseButton'

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

  const { data: item, error: itemError } = await supabase
    .from('knowledge_items')
    .select(
      `id, cover_image_url, price, pricing,
       knowledge_item_translations(locale, title, excerpt),
       knowledge_blocks(
         id,
         block_type,
         is_paid,
         order_index,
         media_url,
         knowledge_block_translations(locale, content)
       )`,
    )
    .eq('slug', slug)
    .single()

  if (itemError) {
    console.error(
      '[KnowledgeItemPage] Supabase query error JSON:',
      JSON.stringify({
        slug,
        message: itemError.message,
        code: itemError.code,
        details: itemError.details,
        hint: itemError.hint,
      }),
    )
  }

  if (!item) notFound()

  const translation = item.knowledge_item_translations.find(
    (tr) => tr.locale === locale,
  )

  const coverUrl = await resolveMedia(item.cover_image_url)

  const sortedBlocks = [...item.knowledge_blocks].sort(
    (a, b) => a.order_index - b.order_index,
  )

  const { data: purchaseRow } = userData.user
    ? await supabase
        .from('knowledge_item_purchases')
        .select('id')
        .eq('knowledge_item_id', item.id)
        .eq('user_id', userData.user.id)
        .maybeSingle()
    : { data: null }

  const userHasPaidAccess = !!purchaseRow
  const hasPaidContent = item.pricing !== 'free' && !!item.price

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
      const bt = b.knowledge_block_translations.find(
        (tr) => tr.locale === locale,
      )

      const locked = b.is_paid && !userHasPaidAccess

      const mediaUrl =
        (b.block_type === 'image' || b.block_type === 'video') &&
        b.media_url &&
        !locked
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
    }),
  )

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <article className="mx-auto flex w-full max-w-3xl flex-col">
        {coverUrl && (
          <div className="mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm sm:mb-9">
            <img
              src={coverUrl}
              alt=""
              className="h-auto max-h-[28rem] w-full object-cover object-center"
            />
          </div>
        )}

        <header className="relative mb-8 text-center sm:mb-10">
          {userData.user && (
            <div className="absolute end-0 top-0">
              <KnowledgeBookmarkButton
                itemId={item.id}
                initialBookmarked={isBookmarked}
              />
            </div>
          )}

          <h1 className="mx-auto max-w-3xl px-10 text-2xl font-bold leading-tight tracking-tight text-primary-700 sm:px-12 sm:text-3xl lg:text-4xl">
            {translation?.title}
          </h1>

          {translation?.excerpt && (
            <p className="mx-auto mt-4 max-w-2xl px-4 text-sm leading-7 text-gray-500 sm:text-base sm:leading-8">
              {translation.excerpt}
            </p>
          )}
        </header>

        {hasPaidContent && !userHasPaidAccess && (
          <section className="mb-8 rounded-2xl border border-primary-200 bg-primary-50/70 p-5 shadow-sm sm:mb-10 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-primary-800 sm:text-lg">
                  {locale === 'ar'
                    ? 'هذا المحتوى يحتوي على أجزاء مدفوعة'
                    : 'This Knowledge contains paid content'}
                </p>

                <p className="mt-2 text-sm leading-6 text-primary-700 sm:text-base sm:leading-7">
                  {locale === 'ar'
                    ? `الوصول الكامل مقابل ${item.price} Coins، والشراء مرة واحدة ويمنحك وصولًا دائمًا.`
                    : `Full access for ${item.price} Coins. One-time purchase with permanent access.`}
                </p>
              </div>

              <div className="shrink-0">
                {userData.user ? (
                  <KnowledgePurchaseButton
                    itemId={item.id}
                    price={item.price!}
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {locale === 'ar'
                      ? 'سجّل الدخول لإتمام الشراء.'
                      : 'Sign in to purchase this Knowledge.'}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-5 sm:gap-6">
          {renderedBlocks.map((b) => (
            <section
              key={b.id}
              className="min-w-0"
            >
              {b.locked ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-8 text-center sm:px-8 sm:py-10">
                  <p className="text-sm font-medium text-gray-500 sm:text-base">
                    {t('lockedContent')}
                  </p>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-3">
                  {b.subtitle && (
                    <h2 className="text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
                      {b.subtitle}
                    </h2>
                  )}

                  {b.blockType === 'text' && b.text && (
                    <div className="rounded-2xl border border-gray-100 bg-white px-1 py-1">
                      <p className="whitespace-pre-line text-[15px] leading-8 text-gray-700 sm:text-base sm:leading-8">
                        {b.text}
                      </p>
                    </div>
                  )}

                  {b.blockType === 'list' && b.text && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-6 sm:py-6">
                      <ul className="list-disc space-y-3 ps-6 text-[15px] leading-7 text-gray-700 sm:text-base sm:leading-8">
                        {b.text
                          .split(/\r?\n/)
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item, index) => (
                            <li key={index} className="ps-1">
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {b.blockType === 'quote' && b.text && (
                    <blockquote className="rounded-2xl border-s-4 border-primary-300 bg-primary-50/60 px-5 py-5 text-[15px] leading-8 text-gray-700 sm:px-6 sm:py-6 sm:text-base">
                      <p className="italic">{b.text}</p>
                    </blockquote>
                  )}

                  {b.blockType === 'image' && b.mediaUrl && (
                    <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
                      <img
                        src={b.mediaUrl}
                        alt={b.subtitle ?? ''}
                        className="h-auto max-h-[38rem] w-full object-contain"
                      />
                    </figure>
                  )}

                  {b.blockType === 'video' && b.mediaUrl && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-sm">
                      <video
                        src={b.mediaUrl}
                        controls
                        preload="metadata"
                        className="h-auto max-h-[38rem] w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
