// Service-Role-Client für den Systemzugriff ohne Benutzersitzung (F-43, Q-54): Erinnerungslauf, One-Click-Abmeldung,
// Webhook. Darf NUR von src/server/repo/supabase/system-repository.ts importiert werden (statischer Test
// tests/service-role.test.ts). Jede Abfrage filtert dort ausdrücklich nach organisation_id; geschrieben wird nur über
// System-RPCs, die ausschließlich service_role ausführen darf.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFehler } from '../repo/supabase/mapping';
import { supabaseUrl } from './umgebung';

export function erzeugeSystemClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new RepositoryFehler('Erinnerungen sind nicht eingerichtet (Service-Schlüssel fehlt).');
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
