import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

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
      
      // Generate base username
      const baseUsername =
        meta.user_name ||
        meta.preferred_username ||
        (meta.full_name
          ? meta.full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          : 'user');

      // Ensure username is unique by adding random suffix if needed
      let username = baseUsername;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (!existingUser) break;
        
        // Add random suffix to make unique
        username = `${baseUsername}_${Math.random().toString(36).substring(2, 8)}`;
        attempts++;
      }

      // Create or update profile for OAuth users
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          email: user.email ?? '',
          full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || null,
          district: null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Still redirect to feed even if profile creation failed - user is authenticated
        return NextResponse.redirect(`${origin}${next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
}

