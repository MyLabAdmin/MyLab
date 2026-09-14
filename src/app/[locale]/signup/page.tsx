import AuthHeader from '@/components/auth/AuthHeader'
import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-4 py-8">
      <AuthHeader />
      <SignupForm />
    </main>
  )
}
