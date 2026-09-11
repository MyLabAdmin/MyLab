import type { ReactNode } from 'react'

type KnowledgeFormSectionProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function KnowledgeFormSection({
  title,
  description,
  children,
  className = '',
}: KnowledgeFormSectionProps) {
  return (
    <section
      className={[
        'rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6',
        className,
      ].join(' ')}
    >
      <header className="mb-5">
        <h2 className="text-base font-semibold text-neutral-900">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {description}
          </p>
        ) : null}
      </header>

      {children}
    </section>
  )
}
