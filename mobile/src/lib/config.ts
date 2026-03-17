// Supabase configuration for the mobile app
// Keys loaded from .env via react-native-dotenv (@env module)
// Falls back to process.env for compatibility

let _supabaseUrl: string;
let _supabaseAnonKey: string;

try {
  const env = require('@env');
  _supabaseUrl = env.SUPABASE_URL;
  _supabaseAnonKey = env.SUPABASE_ANON_KEY;
} catch {
  _supabaseUrl = process.env.SUPABASE_URL ?? '';
  _supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
}

export const SUPABASE_URL = _supabaseUrl;
export const SUPABASE_ANON_KEY = _supabaseAnonKey;
