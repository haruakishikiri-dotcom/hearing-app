import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.error(
    '[hearing-app] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません。.env.local を確認してください。',
  );
}

export const supabase = createClient(url ?? '', anon ?? '', {
  realtime: { params: { eventsPerSecond: 5 } },
  auth: { persistSession: false },
});

export const supabaseConfigured = Boolean(url && anon);
