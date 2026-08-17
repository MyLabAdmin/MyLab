import { Logo } from '@/components/brand/Logo'

type AuthHeaderProps = {
  title: string
  description?: string
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <div className="mb-5 flex justify-center">
        <Logo />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        {title}
      </h1>

      {description ? (
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {description}
        </p>
      ) : null}
    </header>
  )
}
