'use client';

import {
  Bell,
  Home,
  MessageCircle,
  UserRound,
  Users,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import Avatar from '@/components/community/Avatar';

type CommunityNavigationProps = {
  locale: 'ar' | 'en';
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function CommunityNavigation({
  locale,
  profile,
}: CommunityNavigationProps) {
  const pathname = usePathname();
  const isArabic = locale === 'ar';

  const items = [
    {
      key: 'community',
      href: '/community' as const,
      label: isArabic ? 'المجتمع' : 'Community',
      icon: Home,
      active: pathname === '/community',
      disabled: false,
    },
    {
      key: 'friends',
      href: '/community/friends' as const,
      label: isArabic ? 'الأصدقاء' : 'Friends',
      icon: Users,
      active: pathname.startsWith('/community/friends'),
      disabled: false,
    },
    {
      key: 'messages',
      href: '/community/messages' as const,
      label: isArabic ? 'الرسائل' : 'Messages',
      icon: MessageCircle,
      active: pathname.startsWith('/community/messages'),
      disabled: false,
    },
    {
      key: 'groups',
      href: '/community/groups' as const,
      label: isArabic ? 'المجموعات' : 'Groups',
      icon: Users,
      active: pathname.startsWith('/community/groups'),
      disabled: false,
    },
    {
      key: 'notifications',
      label: isArabic ? 'الإشعارات' : 'Notifications',
      icon: Bell,
      active: false,
      disabled: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-2 overflow-x-auto px-3 py-2 sm:px-4">
        {profile ? (
          <Link
            href={`/community/profile/${profile.id}`}
            aria-label={isArabic ? 'الحساب الشخصي' : 'Personal profile'}
            title={isArabic ? 'الحساب الشخصي' : 'Personal profile'}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-gray-200">
              <Avatar
                name={profile.display_name ?? (isArabic ? 'مستخدم' : 'User')}
                avatarUrl={profile.avatar_url}
                size="ml"
              />
            </span>

            <span className="whitespace-nowrap text-[10px] font-medium leading-none text-gray-500">
              {isArabic ? 'حسابي' : 'Profile'}
            </span>
          </Link>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-[54px] w-[58px] shrink-0"
          />
        )}

        {items.map((item) => {
          const Icon = item.icon;

          const content = (
            <>
              <span
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  item.active
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500',
                  item.disabled ? 'text-gray-400' : '',
                ].join(' ')}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>

              <span
                className={[
                  'whitespace-nowrap text-[10px] font-medium leading-none',
                  item.active ? 'text-primary-700' : 'text-gray-500',
                  item.disabled ? 'text-gray-400' : '',
                ].join(' ')}
              >
                {item.label}
              </span>
            </>
          );

          const className = [
            'flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5',
            'transition-colors',
            item.disabled
              ? 'cursor-not-allowed opacity-45'
              : 'hover:bg-gray-100',
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
    </header>
  );
}
