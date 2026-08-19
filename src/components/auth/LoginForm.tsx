'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@/components/auth/ui/AuthError'
import { AuthField } from '@/components/auth/ui/AuthField'
import { AuthSubmitButton } from '@/components/auth/ui/AuthSubmitButton'

export function LoginForm() {
  const router = useRouter()
  const t = useTranslations('auth.login')
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label={t('email')}
        id="login-email"
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
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder={t('passwordPlaceholder')}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={loading}
        passwordToggle
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
