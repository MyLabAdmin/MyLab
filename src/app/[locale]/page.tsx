import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-600">
        {t('title')}
      </h1>
    </main>
  );
}
