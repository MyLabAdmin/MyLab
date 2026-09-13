import { getTranslations } from 'next-intl/server'
import { login } from '../actions/auth'
import AuthHeader from '@/components/auth/AuthHeader'
import PasswordInput from '@/components/auth/PasswordInput'
import { Link } from '@/i18n/navigation'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { locale } = await params
  const { error } = await searchParams
  const t = await getTranslations('Auth')

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <AuthHeader />

        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <PasswordInput name="password" label={t('passwordLabel')} autoComplete="current-password" />

          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 text-white font-medium py-2.5 hover:bg-primary-700 transition-colors"
          >
            {t('loginButton')}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t('noAccount')}{' '}
            <Link href="/signup" className="text-primary-600 font-medium hover:underline">
              {t('signupLink')}
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
