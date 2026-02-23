import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  var _supabaseClient: SupabaseClient | undefined;
}

export function createClient() {
  if (globalThis._supabaseClient) return globalThis._supabaseClient;

  // Disable navigator lock — safe since we enforce a single client instance
  const lock: <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => Promise<R> = (
    _name,
    _acquireTimeout,
    fn
  ) => fn();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      throw new Error(
        'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    // Server build fallback to avoid prerender crash; real calls should not happen server-side.
    return createBrowserClient('http://localhost', 'anon', {
      auth: {
        lock,
      },
    });
  }

  globalThis._supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock,
    },
  });
  return globalThis._supabaseClient;
}
