import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AuthCard } from '@/components/auth/ui/AuthCard'
import { AuthHeader } from '@/components/auth/ui/AuthHeader'
import { AuthShell } from '@/components/auth/ui/AuthShell'
import { SignupForm } from '@/components/auth/SignupForm'

export default async function SignupPage() {
  const t = await getTranslations('auth.signup')

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title={t('title')}
          description={t('description')}
        />

        <SignupForm />

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            {t('signIn')}
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
