import Image from 'next/image'

import type { KnowledgeDetailMedia } from '@/lib/knowledge/detail'

type KnowledgeMediaGalleryProps = {
  title: string
  media: KnowledgeDetailMedia[]
  heading: string
}

export function KnowledgeMediaGallery({
  title,
  media,
  heading,
}: KnowledgeMediaGalleryProps) {
  if (media.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-neutral-900">
        {heading}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {media.map((item) => (
          <figure key={item.id}>
            <Image
              src={item.image_url}
              alt={item.alt_text ?? title}
              width={1200}
              height={800}
              className="w-full rounded-xl border border-neutral-200 object-cover"
            />
          </figure>
        ))}
      </div>
    </section>
  )
}
