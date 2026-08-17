import Link from 'next/link'
import { AuthCard } from '@/components/auth/ui/AuthCard'
import { AuthHeader } from '@/components/auth/ui/AuthHeader'
import { AuthShell } from '@/components/auth/ui/AuthShell'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title="Create your MyLab account"
          description="Join MyLab and build your professional laboratory profile."
        />

        <SignupForm />

        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
