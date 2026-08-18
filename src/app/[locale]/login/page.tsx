import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
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
  const t = await getTranslations('auth.login')

  const confirmationError =
    error === 'confirmation_failed' ? t('confirmationFailed') : null

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title={t('title')}
          description={t('description')}
        />

        <AuthError message={confirmationError} />

        <div className={confirmationError ? 'mt-5' : ''}>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('noAccount')}{' '}
          <Link
            href="/signup"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            {t('createAccount')}
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
