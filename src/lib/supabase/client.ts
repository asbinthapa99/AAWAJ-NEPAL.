import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var _supabaseClient: SupabaseClient | undefined;
}

export function createClient() {
  if (globalThis._supabaseClient) return globalThis._supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  globalThis._supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Disable navigator lock — safe since we enforce a single client instance
      lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
  });
  return globalThis._supabaseClient;
}
