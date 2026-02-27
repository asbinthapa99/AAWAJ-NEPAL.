'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch profile with retry — OAuth profile may be created asynchronously in the callback
  const fetchProfile = useCallback(async (currentUser: User, retries = 5): Promise<Profile | null> => {
    for (let i = 0; i < retries; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        // Check if user is banned
        if (data.banned_at) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?error=banned';
          }
          return null;
        }
        setProfile(data);
        return data;
      }

      // If profile not found and this is an OAuth user, create it client-side as fallback
      if (i === 1) {
        const meta = currentUser.user_metadata ?? {};
        const baseUsername =
          meta.user_name ||
          meta.preferred_username ||
          (meta.full_name
            ? meta.full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
            : 'user');
        const username = `${baseUsername}_${Math.random().toString(36).substring(2, 8)}`;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            username,
            email: currentUser.email ?? '',
            full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User',
            avatar_url: meta.avatar_url || meta.picture || null,
            district: null,
          }, { onConflict: 'id' });

        if (!upsertError) {
          // Re-fetch the newly created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          if (newProfile) {
            setProfile(newProfile);
            return newProfile;
          }
        }
      }

      // Wait before retrying — profile may still be propagating from the auth callback
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setProfile(null);
    return null;
  }, [supabase]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false); // Unblock the UI immediately

      if (currentUser) {
        fetchProfile(currentUser); // Fetch profile in the background
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
