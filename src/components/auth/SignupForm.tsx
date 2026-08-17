'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@/components/auth/ui/AuthError'
import { AuthField } from '@/components/auth/ui/AuthField'
import { AuthSubmitButton } from '@/components/auth/ui/AuthSubmitButton'

export function SignupForm() {
  const router = useRouter()
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/onboarding/profile')
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
            Check your email
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-700">
            We sent a confirmation link to{' '}
            <strong className="font-semibold">{email}</strong>.
          </p>
        </div>

        <p className="text-sm leading-6 text-neutral-600">
          Confirm your email address before continuing to your MyLab profile.
        </p>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label="Email"
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={loading}
      />

      <AuthField
        label="Password"
        id="signup-password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={loading}
      />

      <AuthError message={error} />

      <AuthSubmitButton
        loading={loading}
        loadingLabel="Creating account…"
      >
        Create account
      </AuthSubmitButton>
    </form>
  )
}
