import Link from 'next/link'

import type { KnowledgeDiscoveryItem } from '@/lib/knowledge/discovery'

type KnowledgeCardProps = {
  item: KnowledgeDiscoveryItem
  typeLabel: string
  accessLabel?: string | null
}

export function KnowledgeCard({
  item,
  typeLabel,
  accessLabel,
}: KnowledgeCardProps) {
  return (
    <Link
      href={`/knowledge/${item.id}`}
      className="group block rounded-xl border bg-card p-5 transition-colors hover:bg-accent/40"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border px-2.5 py-1">
          {typeLabel}
        </span>

        {accessLabel ? (
          <span className="rounded-full border px-2.5 py-1">
            {accessLabel}
          </span>
        ) : null}
      </div>

      <h2 className="text-lg font-semibold tracking-tight group-hover:underline">
        {item.title}
      </h2>

      {item.subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {item.subtitle}
        </p>
      ) : null}

      {item.summary ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {item.summary}
        </p>
      ) : null}

      {item.categories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.categories.slice(0, 3).map((category) => (
            <span
              key={category.id}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {category.name}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  )
}
