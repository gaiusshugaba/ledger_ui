// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

let cached: SupabaseBrowserClient | undefined;

export function createClient(): SupabaseBrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('[supabase] env check failed', {
      url: url ? 'set' : 'MISSING',
      publishable: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'set' : 'MISSING',
      anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    });
    throw new Error(
      'Supabase env vars missing. Check .env.local and restart the dev server.',
    );
  }

  if (!cached) {
    cached = createBrowserClient(url, key);
  }

  return cached;
}