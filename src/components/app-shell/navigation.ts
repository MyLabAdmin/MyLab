export type AppNavigationItem = {
  href: '/dashboard' | '/knowledge'
  translationKey: 'dashboard' | 'knowledge'
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    href: '/dashboard',
    translationKey: 'dashboard',
  },
  {
    href: '/knowledge',
    translationKey: 'knowledge',
  },
]
