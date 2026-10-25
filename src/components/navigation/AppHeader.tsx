import HomeSidebar from '@/components/navigation/HomeSidebar';

type AppHeaderProps = {
  locale: 'ar' | 'en';
  userId: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  className?: string;
  title?: string;
};

export default function AppHeader({
  locale,
  userId,
  displayName,
  avatarUrl,
  className,
  title,
}: AppHeaderProps) {
  const isArabic = locale === 'ar';

  return (
    <header
      dir={isArabic ? 'rtl' : 'ltr'}
      className={className ?? 'sticky top-0 z-40 border-b border-gray-200 bg-transparent backdrop-blur'}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img
            src="/brand/logo.png"
            alt="MyLab"
            className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          />
          <h1 className="truncate text-xl font-bold tracking-tight text-primary-600 sm:text-2xl">
            {title ?? 'MyLab'}
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
            locale={locale}
            userId={userId}
            displayName={displayName}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
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
