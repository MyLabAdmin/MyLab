'use client';

import { BookOpen, GraduationCap } from 'lucide-react';
import MyLabPixelsIcon from '@/components/brand/MyLabPixelsIcon';

import { Link, usePathname } from '@/i18n/navigation';

type AppNavigationProps = {
  locale: 'ar' | 'en';
};

function HomeIcon() {
  return (
    <img
      src="/brand/logo.png"
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain"
    />
  );
}

function KnowledgeIcon() {
  return <BookOpen className="h-6 w-6" strokeWidth={1.8} />;
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" strokeLinecap="round" />
      <circle cx="10" cy="8" r="3" />
      <path d="M16 11a3 3 0 1 0 0-6M16.5 15h1a3.5 3.5 0 0 1 3.5 3.5V20" strokeLinecap="round" />
    </svg>
  );
}

function CoursesIcon() {
  return <GraduationCap className="h-6 w-6" strokeWidth={1.8} />;
}

function AssistantIcon() {
  return <MyLabPixelsIcon className="h-6 w-6" />;
}

export default function AppNavigation({ locale }: AppNavigationProps) {
  const pathname = usePathname();
  const isArabic = locale === 'ar';

  const normalizedPathname =
    pathname === `/${locale}`
      ? '/'
      : pathname.startsWith(`/${locale}/`)
        ? pathname.slice(locale.length + 1)
        : pathname;

  const isCommunityHome = normalizedPathname === '/community';

  if (
    (normalizedPathname.startsWith('/community/') && !isCommunityHome) ||
    normalizedPathname === '/'
  ) {
    return null;
  }

  const items = [
    {
      key: 'knowledge',
      href: '/knowledge' as const,
      label: isArabic ? 'المعرفة' : 'Knowledge',
      icon: <KnowledgeIcon />,
      active: pathname.startsWith('/knowledge'),
      disabled: false,
    },
    {
      key: 'community',
      href: '/community' as const,
      label: isArabic ? 'المجتمع' : 'Community',
      icon: <CommunityIcon />,
      active: pathname.startsWith('/community'),
      disabled: false,
    },
    {
      key: 'home',
      href: '/' as const,
      label: isArabic ? 'الرئيسية' : 'Home',
      icon: <HomeIcon />,
      active: pathname === '/',
      disabled: false,
      featured: true,
    },
    {
      key: 'courses',
      label: isArabic ? 'دورات' : 'Courses',
      icon: <CoursesIcon />,
      disabled: true,
    },
    {
      key: 'assistant',
      label: isArabic ? 'المساعد' : 'Assistant',
      icon: <AssistantIcon />,
      disabled: true,
    },
  ];

  return (
    <nav
      aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'}
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
    >
      <div className="flex items-center gap-1 rounded-[1.75rem] border bg-background/90 p-2 shadow-xl backdrop-blur-xl">
        {items.map((item) => {
          const content = (
            <>
              <span
                className={[
                  'flex items-center justify-center rounded-2xl transition-all',
                  item.featured ? 'h-12 w-12' : 'h-10 w-10',
                  item.active
                    ? 'bg-foreground text-primary-500 shadow-sm'
                    : 'text-muted-foreground',
                ].join(' ')}
              >
                {item.icon}
              </span>

              <span
                className={[
                  'text-[10px] font-medium leading-none',
                  item.active ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                {item.label}
              </span>
            </>
          );

          const className = [
            'flex min-w-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5',
            item.featured ? 'min-w-[4.75rem]' : '',
            item.disabled
              ? 'cursor-not-allowed opacity-35'
              : 'transition-transform hover:-translate-y-0.5',
          ].join(' ');

          if (item.disabled) {
            return (
              <div
                key={item.key}
                aria-disabled="true"
                title={isArabic ? 'قريبًا' : 'Coming soon'}
                className={className}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href!}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
