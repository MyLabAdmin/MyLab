import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import LocaleSwitcher from './LocaleSwitcher'

export default async function AuthHeader() {
  const t = await getTranslations('Auth')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full flex justify-end">
        <LocaleSwitcher />
      </div>
      <Image src="/brand/logo.png" alt={t('appName')} width={72} height={72} priority />
      <span className="text-lg font-bold text-primary-700">{t('appName')}</span>
    </div>
  )
}
