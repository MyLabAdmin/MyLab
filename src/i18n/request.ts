import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale

  console.log('[i18n] requested locale:', requested)

  const locale =
    requested && routing.locales.includes(requested as 'en' | 'ar')
      ? requested
      : routing.defaultLocale

  console.log('[i18n] resolved locale:', locale)

  return {
    locale,
    messages: (
      await import(`../../messages/${locale}.json`)
    ).default,
  }
})
