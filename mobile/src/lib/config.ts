// Supabase configuration for the mobile app
// Keys are loaded from .env file (see .env.example for required variables)
import { SUPABASE_URL as ENV_URL, SUPABASE_ANON_KEY as ENV_KEY } from '@env';

export const SUPABASE_URL = ENV_URL;
export const SUPABASE_ANON_KEY = ENV_KEY;
