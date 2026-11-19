// Service-Role-Client (BE-12/BE-14). Nur serverseitig und nur für Einladungen (F-8).
// Fachdaten laufen nie hierüber. Nicht aus src/app/** importieren.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl } from './umgebung';

export function erzeugeAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt (nur für Einladungen nötig)');
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
