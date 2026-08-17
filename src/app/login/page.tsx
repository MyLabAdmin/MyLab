import Link from 'next/link'
import { AuthCard } from '@/components/auth/ui/AuthCard'
import { AuthError } from '@/components/auth/ui/AuthError'
import { AuthHeader } from '@/components/auth/ui/AuthHeader'
import { AuthShell } from '@/components/auth/ui/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams

  const confirmationError =
    error === 'confirmation_failed'
      ? "We couldn't confirm your email. Please request a new confirmation email and try again."
      : null

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title="Welcome back to MyLab"
          description="Sign in to continue to your laboratory workspace."
        />

        <AuthError message={confirmationError} />

        <div className={confirmationError ? 'mt-5' : ''}>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
