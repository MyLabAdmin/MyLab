import { getWalletData } from '@/app/[locale]/actions/wallet'
import WalletClient from './WalletClient'

type WalletPageProps = {
  params: Promise<{ locale: string }>
}

export default async function WalletPage({
  params,
}: WalletPageProps) {
  const { locale } = await params
  const result = await getWalletData()

  if (!result.success) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-red-700">
            {locale === 'ar' ? 'تعذر تحميل المحفظة' : 'Unable to load wallet'}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {result.error}
          </p>
        </div>
      </main>
    )
  }

  return (
    <WalletClient
      locale={locale}
      wallet={result.wallet}
      transactions={result.transactions}
    />
  )
}
