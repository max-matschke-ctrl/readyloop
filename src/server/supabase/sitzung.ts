// Sitzung im Modus supabase (BE-12, F-8): Auth-Benutzer + aktive Mitgliedschaft; Organisation aus rl_org.
import { cookies } from 'next/headers';
import type { Id, OrganisationOption, Rolle, Sitzung } from '@/domain/types';
import { supabaseRepository } from '../repo/supabase/repository';
import type { Repository } from '../repo/types';
import { erzeugeServerClient } from './server';

const ORG_COOKIE = 'rl_org'; // wie sitzung.ts (Zyklus vermeiden)

interface MitgliedZeile {
  id: string;
  organisation_id: string;
  rolle: Rolle;
  anzeigename: string;
  email: string;
  organisation: { id: string; name: string; bg: string | null } | null;
}

export async function holeAuthBenutzer(): Promise<{ id: Id; email: string } | null> {
  const client = await erzeugeServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

/** null ohne Auth-Benutzer oder ohne aktive Mitgliedschaft. */
export async function leseSupabaseSitzung(): Promise<Sitzung | null> {
  const client = await erzeugeServerClient();
  const { data: auth, error: authFehler } = await client.auth.getUser();
  if (authFehler || !auth.user) return null;
  const { data, error } = await client
    .from('mitgliedschaft')
    .select('id, organisation_id, rolle, anzeigename, email, organisation:organisation_id (id, name, bg)')
    .eq('benutzer_id', auth.user.id)
    .eq('aktiv', true);
  if (error) {
    console.error('leseSupabaseSitzung', error.message);
    return null;
  }
  const zeilen = ((data ?? []) as unknown as MitgliedZeile[]).filter((z) => z.organisation !== null);
  if (zeilen.length === 0) return null;
  zeilen.sort((a, b) => a.organisation!.name.localeCompare(b.organisation!.name, 'de') || a.organisation_id.localeCompare(b.organisation_id));
  const wunsch = (await cookies()).get(ORG_COOKIE)?.value;
  const gewaehlt = zeilen.find((z) => z.organisation_id === wunsch) ?? zeilen[0];

  let bereichIds: Id[] = [];
  if (gewaehlt.rolle === 'verantwortlicher') {
    const { data: bv, error: bvFehler } = await client
      .from('bereich_verantwortung')
      .select('bereich_id')
      .eq('mitgliedschaft_id', gewaehlt.id);
    if (bvFehler) {
      console.error('leseSupabaseSitzung bereiche', bvFehler.message);
      return null;
    }
    bereichIds = ((bv ?? []) as { bereich_id: string }[]).map((z) => z.bereich_id);
  }
  const organisationen: OrganisationOption[] = zeilen.map((z) => ({ id: z.organisation!.id, name: z.organisation!.name, rolle: z.rolle }));
  return {
    benutzer: { id: auth.user.id, name: gewaehlt.anzeigename, email: gewaehlt.email || auth.user.email || '' },
    organisation: { id: gewaehlt.organisation!.id, name: gewaehlt.organisation!.name, bg: gewaehlt.organisation!.bg },
    mitgliedschaftId: gewaehlt.id,
    rolle: gewaehlt.rolle,
    bereichIds,
    organisationen,
    demo: false,
  };
}

export async function supabaseRepositoryFuerAnfrage(organisationId: Id | null): Promise<Repository> {
  return supabaseRepository(await erzeugeServerClient(), organisationId);
}
