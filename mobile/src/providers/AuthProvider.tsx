import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/types';
import type { User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';

// Required for OAuth to properly close the browser on iOS
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => { },
  refreshProfile: async () => { },
  sendOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (currentUser: User) => {
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        if (data.banned_at) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return;
        }
        setProfile(data as Profile);
        return;
      }
      // Profile may not exist yet (OAuth), wait and retry
      await new Promise((r) => setTimeout(r, 600));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    // Handle deep link callbacks from OAuth
    const createSessionFromUrl = async (url: string) => {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) { console.warn('[OAuth callback] error:', errorCode); return; }
      const { access_token, refresh_token } = params;
      if (!access_token) return;
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) console.warn('[OAuth callback] setSession error:', error.message);
    };

    // Handle deep links while app is open
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url) createSessionFromUrl(url);
    };
    const linkingSub = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username },
      },
    });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const sendOtp = async (email: string) => {
    // Generate the platform-specific redirect URL just like Google OAuth
    const appRedirectUrl = makeRedirectUri({
      scheme: 'guffgaff',
      path: 'auth/callback',
    });

    // Instead of giving Supabase the raw app deep link, give it the Web Interceptor
    // so it flawlessly jumps through Vercel into the App.
    const webFallbackRedirect = `https://aawaj-nepal.vercel.app/auth/redirect?redirect_to=${encodeURIComponent(appRedirectUrl)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: webFallbackRedirect,  // Force the email link to point directly back to the app!
      },
    });
    return { error: error?.message || null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error?.message || null };
  };

  const signInWithGoogle = async () => {
    try {
      // For Android Expo Go, sometimes makeRedirectUri with custom scheme fails to deep link back.
      // Use the standard makeRedirectUri but enforce the scheme if it's falling back.
      const appRedirectUrl = makeRedirectUri({
        scheme: 'guffgaff',
        path: 'auth/callback',
      });

      console.log('[Google OAuth] App Callback URL:', appRedirectUrl);

      // Force the web app to handle the Supabase callback, which then passes it back to this app appRedirectUrl 
      const webFallbackRedirect = `https://aawaj-nepal.vercel.app/auth/redirect?redirect_to=${encodeURIComponent(appRedirectUrl)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: webFallbackRedirect,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'consent' },
        },
      });
      if (error) return { error: error.message };
      if (!data.url) return { error: 'No OAuth URL returned' };

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        appRedirectUrl,
        { showInRecents: true }
      );

      console.log('[Google OAuth] result:', result.type);

      if (result.type === 'success') {
        const { params, errorCode } = QueryParams.getQueryParams(result.url);
        if (errorCode) return { error: errorCode };

        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!sessionError) {
            // Explicitly redirect to the feed
            router.replace('/(tabs)/home');
          }
          return { error: sessionError?.message || null };
        }
        return { error: 'No tokens received from Google' };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') return { error: null };
      return { error: 'Google sign-in was not completed' };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile, sendOtp, verifyOtp, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
