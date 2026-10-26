import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
// supabase-js eagerly inits a Realtime WebSocket client in its constructor.
// On Node < 22 (Vercel currently caps adapter-vercel at Node 20) there's no
// native WebSocket, so we hand it the `ws` polyfill — even though we never
// use realtime ourselves.
import ws from 'ws';

let _client: SupabaseClient | null = null;

export function hasSupabase(): boolean {
  const url = (publicEnv.PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const key = (privateEnv.SUPABASE_SECRET_KEY ?? '').trim();
  return Boolean(
    url &&
    key &&
    /^https?:\/\//.test(url) &&
    !url.includes('your-project-ref') &&
    !url.includes('example.com')
  );
}

/**
 * Lazy-init Supabase client. Throws a clear error only when first called
 * if env vars are missing or malformed — so the dev server still boots
 * without .env.local.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = (publicEnv.PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const key = (privateEnv.SUPABASE_SECRET_KEY ?? '').trim();

  if (!url || !key) {
    throw new Error(
      'Supabase env vars not set. Copy .env.example to .env.local and fill in PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (the new sb_secret_... key, not the legacy service_role). See docs/SUPABASE_SETUP.md.'
    );
  }

  if (!/^https?:\/\//.test(url)) {
    throw new Error(`PUBLIC_SUPABASE_URL is missing the https:// protocol. Got: "${url}"`);
  }
  if (url.includes('/dashboard/') || url.includes('supabase.com')) {
    throw new Error(
      `PUBLIC_SUPABASE_URL looks like the dashboard URL, not the project URL. Got: "${url}". The correct one is in Settings → API → "Project URL" and looks like https://<project-ref>.supabase.co`
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: {
      // Cast: supabase-realtime expects a WebSocket constructor; `ws` is shape-compatible.
      transport: ws as unknown as typeof WebSocket
    }
  });
  return _client;
}
