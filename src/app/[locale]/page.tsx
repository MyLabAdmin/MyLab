
import Link from 'next/link';
import MyLabPixelsIcon from '@/components/brand/MyLabPixelsIcon';
import HomeSidebar from '@/components/navigation/HomeSidebar';
import { resolveAvatarUrl } from '@/lib/storage/avatar-server';
import { createClient } from '@/lib/supabase/server';
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  Layers,
  Users,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles_public')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    displayName = profile?.display_name ?? null;
    avatarUrl = await resolveAvatarUrl(profile?.avatar_url);

    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    isAdmin = Boolean(role);
  }

  const greeting = displayName
    ? isArabic
      ? 'مرحباً، د. ' + displayName
      : 'Hello, Dr. ' + displayName
    : isArabic
      ? 'مرحباً'
      : 'Hello';

  const activeCards = [
    {
      href: '/knowledge',
      icon: BookOpen,
      title: isArabic ? 'المعرفة' : 'Knowledge',
    },
    {
      href: '/community',
      icon: Users,
      title: isArabic ? 'المجتمع' : 'Community',
    },
    {
      href: '/wallet',
      icon: Wallet,
      title: isArabic ? 'المحفظة' : 'Wallet',
    },
  ];

  const reservedCards = [
    {
      icon: CreditCard,
      title: isArabic ? 'الاشتراك' : 'Subscription',
    },
    {
      icon: GraduationCap,
      title: isArabic ? 'الدورات' : 'Courses',
    },
    
    {
      icon: SlidersHorizontal,
      title: isArabic ? 'الأدوات' : 'Tools',
    },
    {
      icon: MyLabPixelsIcon,
      title: isArabic ? 'المساعد الذكي' : 'AI Assistant',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-transparent backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo.png"
              alt="MyLab"
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
            />
            <h1 className="truncate text-xl font-bold tracking-tight text-primary-600 sm:text-2xl">
              MyLab
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isArabic ? 'الإشعارات' : 'Notifications'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
            >
              <BellIcon />
            </button>

            <HomeSidebar
              locale={isArabic ? 'ar' : 'en'}
              userId={userId}
              displayName={displayName}
              avatarUrl={avatarUrl}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex w-full justify-start sm:mb-8">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {greeting}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>

                  <h3 className="min-w-0 text-base font-semibold text-gray-900 sm:text-lg">
                    {card.title}
                  </h3>
                </Link>
              );
            })}

            
          {reservedCards
            .filter((card) => card.title !== (isArabic ? 'المساعد الذكي' : 'AI Assistant'))
            .map((card) => {
              const Icon = card.icon;

              if (card.title === (isArabic ? 'الاشتراك' : 'Subscription')) {
                return (
                  <Link
                    key={card.title}
                    href="/subscription"
                    className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <h3 className="min-w-0 text-base font-semibold text-gray-900 sm:text-lg">
                      {card.title}
                    </h3>
                  </Link>
                );
              }

              return (
                <div
                  key={card.title}
                  aria-disabled="true"
                  className="relative flex cursor-not-allowed items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 opacity-60 shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="min-w-0 text-base font-semibold text-gray-800 sm:text-lg">
                    {card.title}
                  </h3>
                  <span className="absolute end-3 top-3 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {isArabic ? 'قريباً' : 'Coming soon'}
                  </span>
                </div>
              );
            })}</div>
        </section>
      </div>
      <div className="fixed bottom-20 end-4 z-40 flex flex-col items-center gap-3 sm:bottom-16">
        {isAdmin && (
          <button
            type="button"
            disabled
            aria-label={isArabic ? 'لوحة الإدارة - قريباً' : 'Admin Panel - Coming soon'}
            title={isArabic ? 'قريباً' : 'Coming soon'}
            className="relative flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg opacity-80 sm:h-16 sm:w-16"
          >
            <svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="h-7 w-7 sm:h-8 sm:w-8"
  aria-hidden="true"
>
  <path d="M12 3l7 3v5c0 4.5-2.9 8.2-7 10-4.1-1.8-7-5.5-7-10V6l7-3z" />
  <path d="M9.5 12l1.7 1.7 3.5-3.5" />
</svg>
            <span className="absolute -top-1 -end-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-500 shadow-sm">
              {isArabic ? 'قريباً' : 'Soon'}
            </span>
          </button>
        )}

        <button
          type="button"
          disabled
          aria-label={isArabic ? 'المساعد الذكي - قريباً' : 'AI Assistant - Coming soon'}
          title={isArabic ? 'قريباً' : 'Coming soon'}
          className="relative flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full border border-primary-100 bg-white shadow-lg opacity-80 sm:h-16 sm:w-16"
        >
          <MyLabPixelsIcon className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="absolute -top-1 -end-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-500 shadow-sm">
            {isArabic ? 'قريباً' : 'Soon'}
          </span>
        </button>
      </div>
</main>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0m6 0H9"
      />
    </svg>
  );
}


function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.9 1.9-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.7v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.9-1.9.06-.06A1.7 1.7 0 0 0 7.8 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.7h.24A1.7 1.7 0 0 0 7.8 10.2a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.9-1.9.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.7v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.9 1.9-.06.06A1.7 1.7 0 0 0 19.4 10c.22.5.7.83 1.24.83H21v2.7h-.36A1.7 1.7 0 0 0 19.4 15Z"
      />
    </svg>
  );
}
