// Service-Role-Client (BE-12/BE-14). Nur serverseitig und nur für Einladungen (F-8, Q-23).
// Einladungen; I3-Service (Erinnerungslauf, Abmeldung, Webhook) siehe system.ts (F-43).
// Fachdaten laufen nie hierüber. Nicht aus src/app/** importieren.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFehler } from '../repo/supabase/mapping';
import { bestaetigungsUrl, supabaseUrl } from './umgebung';

export function erzeugeAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new RepositoryFehler('Einladungen sind nicht eingerichtet (Service-Schlüssel fehlt).');
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function vorhandeneId(admin: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await admin.rpc('benutzer_id_fuer_email', { p_email: email });
  if (error) {
    console.error('benutzer_id_fuer_email', error.message);
    throw new RepositoryFehler('Einladung fehlgeschlagen. Bitte erneut versuchen.');
  }
  return typeof data === 'string' ? data : null;
}

/**
 * Q-23: Bekannte E-Mail → vorhandene ID, keine Mail. Unbekannte → inviteUserByEmail mit Link auf /api/auth/confirm
 * (Vorlage in supabase/config.toml) und Name in den Metadaten.
 */
export async function ladeBenutzerEinPerServiceRole(
  daten: { email: string; name: string },
  admin: SupabaseClient = erzeugeAdminClient(),
): Promise<{ benutzerId: string; neu: boolean }> {
  const email = daten.email.trim().toLowerCase();
  const vorhanden = await vorhandeneId(admin, email);
  if (vorhanden) return { benutzerId: vorhanden, neu: false };
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: bestaetigungsUrl(),
    data: { name: daten.name },
  });
  if (error || !data.user) {
    // Wettlauf: Konto entstand zwischen Suche und Einladung
    const spaeter = await vorhandeneId(admin, email);
    if (spaeter) return { benutzerId: spaeter, neu: false };
    console.error('inviteUserByEmail', error?.message);
    throw new RepositoryFehler('Die Einladung konnte nicht versendet werden.');
  }
  return { benutzerId: data.user.id, neu: true };
}
