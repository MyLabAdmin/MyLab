import { getTranslations } from 'next-intl/server'
import AuthHeader from '@/components/auth/AuthHeader'

export default async function CheckEmailPage() {
  const t = await getTranslations('Auth')
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
      <AuthHeader />
      <div>
        <h1 className="text-lg font-semibold text-primary-700">{t('checkEmailTitle')}</h1>
        <p className="text-sm text-gray-600 mt-2">{t('checkEmailMessage')}</p>
      </div>
    </main>
  )
}
