'use client'

import { FormEvent, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@/components/auth/ui/AuthError'
import { AuthField } from '@/components/auth/ui/AuthField'
import { AuthSubmitButton } from '@/components/auth/ui/AuthSubmitButton'

export function SignupForm() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth.signup')
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const callbackUrl = new URL(
      '/auth/callback',
      window.location.origin,
    )

    callbackUrl.searchParams.set('locale', locale)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    setConfirmationSent(true)
    setLoading(false)
  }

  if (confirmationSent) {
    return (
      <section className="space-y-4 rounded-xl bg-info-50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {t('checkEmail')}
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {t('confirmationSent', { email })}
          </p>
        </div>

        <p className="text-sm leading-6 text-neutral-600">
          {t('confirmationDescription')}
        </p>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label={t('email')}
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={loading}
      />

      <AuthField
        label={t('password')}
        id="signup-password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder={t('passwordPlaceholder')}
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={loading}
      />

      <AuthError message={error} />

      <AuthSubmitButton
        loading={loading}
        loadingLabel={t('submitting')}
      >
        {t('submit')}
      </AuthSubmitButton>
    </form>
  )
}
