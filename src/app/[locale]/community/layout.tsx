import { createClient } from '@/lib/supabase/server';
import { parseMediaRef } from '@/lib/storage';
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server';
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
      let resolvedAvatarUrl = data.avatar_url;

      if (data.avatar_url) {
        const parsedAvatar = parseMediaRef(data.avatar_url);

        if (parsedAvatar.provider === 'imagekit' && parsedAvatar.path.trim()) {
          resolvedAvatarUrl = await getImagekitSignedUrl(parsedAvatar.path);
        }
      }

      profile = {
        ...data,
        avatar_url: resolvedAvatarUrl,
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
