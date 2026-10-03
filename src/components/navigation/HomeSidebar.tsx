'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { logout } from '@/app/[locale]/actions/auth';
import Avatar from '@/components/community/Avatar';
import {
  Info,
  LogOut,
  FileText,
  Lock,
  Settings,
  User,
  X,
} from 'lucide-react';

type HomeSidebarProps = {
  locale: 'ar' | 'en';
  userId: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
};

export default function HomeSidebar({
  locale,
  userId,
  displayName,
  avatarUrl = null,
}: HomeSidebarProps) {
  const [open, setOpen] = useState(false);
  const isArabic = locale === 'ar';
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const profileHref = userId
    ? `/community/profile/${userId}`
    : null;

  const name = displayName ?? (isArabic ? 'مستخدم' : 'User');

  return (
    <>
      <button
        type="button"
        aria-label={isArabic ? 'القائمة' : 'Menu'}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
      >
        <MenuIcon />
      </button>

      <aside
        className={[
          'fixed top-[4.75rem] z-[70] flex max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-transform duration-300',
          isArabic
            ? `right-4 ${open ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`
            : `left-4 ${open ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`,
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <span className="text-lg font-bold text-gray-900">
            MyLab
          </span>

          <button
            type="button"
            aria-label={isArabic ? 'إغلاق القائمة' : 'Close menu'}
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 bg-white p-5">
          {profileHref ? (
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition hover:bg-primary-50"
            >
              <Avatar
                name={name}
                avatarUrl={avatarUrl}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {isArabic ? 'الملف الشخصي' : 'Profile'}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
              <Avatar
                name={name}
                avatarUrl={avatarUrl}
                size="lg"
              />

              <p className="truncate font-semibold text-gray-900">
                {name}
              </p>
            </div>
          )}
        </div>

        <nav className="shrink-0 bg-white px-4 py-4">
          <SidebarItem
            icon={<Settings className="h-5 w-5" strokeWidth={1.8} />}
            label={isArabic ? 'الإعدادات' : 'Settings'}
            soon={isArabic ? 'قريباً' : 'Coming soon'}
          />

          <SidebarItem
            icon={<FileText className="h-5 w-5" strokeWidth={1.8} />}
            label={isArabic ? 'سياسة الاستخدام' : 'Terms of Use'}
            soon={isArabic ? 'قريباً' : 'Coming soon'}
          />

          <SidebarItem
            icon={<Lock className="h-5 w-5" strokeWidth={1.8} />}
            label={isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
            soon={isArabic ? 'قريباً' : 'Coming soon'}
          />

          <SidebarItem
            icon={<Info className="h-5 w-5" strokeWidth={1.8} />}
            label={isArabic ? 'حول MyLab' : 'About MyLab'}
            soon={isArabic ? 'قريباً' : 'Coming soon'}
          />
        </nav>

        <div className="mt-auto shrink-0 px-5 pb-7 pt-4">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await logout();
              router.replace('/login');
            }}
          >
            <button
              type="submit"
              className="mx-auto flex w-full max-w-[15rem] items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100"
            >
              <LogOut
                className="h-5 w-5 shrink-0"
                strokeWidth={1.8}
              />
              <span>{isArabic ? 'تسجيل الخروج' : 'Log out'}</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  icon,
  label,
  soon,
}: {
  icon: React.ReactNode;
  label: string;
  soon: string;
}) {
  return (
    <div
      aria-disabled="true"
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700"
    >
      <span className="shrink-0 text-gray-500">
        {icon}
      </span>

      <span className="flex-1">
        {label}
      </span>

      <span className="text-[10px] text-gray-400">
        {soon}
      </span>
    </div>
  );
}

function MenuIcon() {
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
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
