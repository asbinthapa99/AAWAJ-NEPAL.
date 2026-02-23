import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // Auto-create profile for OAuth users (Google, Facebook, etc.)
      const meta = user.user_metadata ?? {};
      const generatedUsername =
        meta.user_name ||
        meta.preferred_username ||
        (meta.full_name
          ? meta.full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + user.id.slice(0, 4)
          : 'user_' + user.id.slice(0, 8));

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: generatedUsername,
          email: user.email ?? '',
          full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || null,
          district: null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
}

