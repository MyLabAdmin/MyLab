import { createClient } from '@/lib/supabase/server';
import { resolveAvatarUrl } from '@/lib/storage/avatar-server';
import CommunityNavigation from './CommunityNavigation';

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  let profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null = null;

  if (userId) {
    const { data } = await supabase
      .from('profiles_public')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      profile = {
        ...data,
        avatar_url: await resolveAvatarUrl(data.avatar_url),
      };
    }
  }

  return (
    <div className="min-h-screen">
      <CommunityNavigation
        locale={locale as 'ar' | 'en'}
        profile={profile}
      />
      {children}
    </div>
  );
}
