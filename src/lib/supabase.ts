import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Hardcoded project — used when VITE_SUPABASE_* env vars aren't picked up.
// The anon / publishable key is designed to be exposed to clients; data
// access is gated by RLS policies on the database. Env vars take precedence
// over these fallbacks, so setting them in .env.local still works.
const FALLBACK_URL = 'https://kaqyumwuwcgusibelcju.supabase.co';
const FALLBACK_ANON_KEY = 'sb_publishable_WqpXL9UK1dS-9rwzJihYFA__UqHVMu3';

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  FALLBACK_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = supabase !== null;
