// Supabase-System-Repository (BE-28, F-43): ohne Benutzersitzung über den Service-Role-Client (supabase/system.ts).
// Regeln: jede Leseabfrage mit .eq('organisation_id', …) (Ausnahmen: Liste der Organisationen, globaler Katalog);
// Schreiben ausschließlich über die System-RPCs (nur service_role). Pseudonymisierung läuft per pg_cron (No-op hier).
import type { SupabaseClient } from '@supabase/supabase-js';
import { addTage, isoWocheMontag } from '@/domain/datum';
import {
  MAIL_ART_FUER_ROLLE,
  VERSAND_ERFOLGREICH,
  type AbbestellbareMailArt,
  type Benutzer,
  type Ereignis,
  type Id,
  type IsoDate,
} from '@/domain/types';
import type { ErinnerungsSystemRepository, LaufDaten } from '../types';
import {
  RepositoryFehler,
  SPALTEN,
  SPALTEN_I3,
  vonErinnerungPosten,
  vonMailVersand,
  zuAnlass,
  zuBereich,
  zuErinnerungEinstellung,
  zuErinnerungLauf,
  zuErinnerungPosten,
  zuGeraet,
  zuKatalog,
  zuMangel,
  zuMitgliedschaft,
  zuNachweis,
  zuOrganisation,
  zuPruefart,
  zuUebernahme,
  type AnlassZeile,
  type BereichZeile,
  type ErinnerungEinstellungZeile,
  type ErinnerungLaufZeile,
  type ErinnerungPostenZeile,
  type GeraetZeile,
  type KatalogZeile,
  type MangelZeile,
  type MitgliedschaftZeile,
  type NachweisZeile,
  type OrganisationZeile,
  type PruefartZeile,
  type UebernahmeZeile,
} from './mapping';
import { pruefe } from './repository';

const SEITE = 1000; // PostgREST max-rows

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Abfrage = any;

export function supabaseSystemRepository(client: SupabaseClient): ErinnerungsSystemRepository {
  /** Alle Zeilen seitenweise (PostgREST kappt bei max-rows). */
  const alle = async <Z>(kontext: string, baue: () => Abfrage): Promise<Z[]> => {
    const zeilen: Z[] = [];
    for (let von = 0; ; von += SEITE) {
      const teil = (pruefe(await baue().range(von, von + SEITE - 1), kontext) ?? []) as Z[];
      zeilen.push(...teil);
      if (teil.length < SEITE) return zeilen;
    }
  };
  const vonOrg = <Z>(tabelle: string, spalten: string, org: Id, weiter: (q: Abfrage) => Abfrage = (q) => q) =>
    alle<Z>(`${tabelle} lesen (System)`, () => weiter(client.from(tabelle).select(spalten).eq('organisation_id', org)).order('id'));
  const rpc = async <T>(name: string, args: Record<string, unknown>): Promise<T> => pruefe(await client.rpc(name, args), name) as T;

  const aktiveRolle = async (org: Id, benutzerId: Id) => {
    const zeilen = (pruefe(
      await client.from('mitgliedschaft').select('rolle').eq('organisation_id', org).eq('benutzer_id', benutzerId).eq('aktiv', true),
      'mitgliedschaft lesen (System)',
    ) ?? []) as { rolle: MitgliedschaftZeile['rolle'] }[];
    return zeilen[0]?.rolle ?? null;
  };

  return {
    async listeOrganisationIds() {
      const zeilen = await alle<{ organisation_id: Id }>('mitgliedschaft lesen (System)', () =>
        client.from('mitgliedschaft').select('organisation_id').eq('aktiv', true).order('organisation_id'),
      );
      return [...new Set(zeilen.map((z) => z.organisation_id))].sort();
    },

    async holeLaufDaten(org, heute: IsoDate): Promise<LaufDaten> {
      const orgZeilen = (pruefe(
        await client.from('organisation').select(SPALTEN.organisation).eq('id', org),
        'organisation lesen (System)',
      ) ?? []) as OrganisationZeile[];
      if (orgZeilen.length === 0) throw new RepositoryFehler('Organisation nicht gefunden.');
      const fristAb = addTage(heute, -730);
      const wocheAb = isoWocheMontag(heute);
      const [bereiche, einstellungen, mitglieder, verantwortung, katalog, geraete, pruefarten, nachweise, anlaesse, maengel, uebernahmen, ereignisse, abmeldungen, posten] =
        await Promise.all([
          vonOrg<BereichZeile>('bereich', SPALTEN.bereich, org),
          alle<ErinnerungEinstellungZeile>('erinnerung_einstellung lesen (System)', () =>
            client.from('erinnerung_einstellung').select(SPALTEN_I3.einstellung).eq('organisation_id', org).order('bereich_id'),
          ),
          vonOrg<MitgliedschaftZeile>('mitgliedschaft', `${SPALTEN.mitgliedschaft}, email`, org),
          vonOrg<{ mitgliedschaft_id: Id; bereich_id: Id }>('bereich_verantwortung', 'id, mitgliedschaft_id, bereich_id', org),
          alle<KatalogZeile>('katalog_eintrag lesen (System)', () => client.from('katalog_eintrag').select(SPALTEN.katalog).order('id')), // global
          vonOrg<GeraetZeile>('geraet', SPALTEN.geraet, org),
          vonOrg<PruefartZeile>('geraet_pruefart', SPALTEN.pruefart, org),
          vonOrg<NachweisZeile>('nachweis', SPALTEN.nachweis, org),
          vonOrg<AnlassZeile>('anlass', SPALTEN.anlass, org),
          vonOrg<MangelZeile>('mangel', SPALTEN.mangel, org),
          vonOrg<UebernahmeZeile>('uebernahme', SPALTEN.uebernahme, org, (q) => q.is('bis', null)),
          vonOrg<{ id: Id; geraet_id: Id | null; zeitpunkt: string }>('ereignis', 'id, geraet_id, zeitpunkt', org, (q) =>
            q.eq('typ', 'betriebsstatus_geaendert'),
          ),
          vonOrg<{ benutzer_id: Id; art: AbbestellbareMailArt }>('mail_abmeldung', 'id, benutzer_id, art', org, (q) => q.eq('abgemeldet', true)),
          vonOrg<ErinnerungPostenZeile & { mail_versand: { status: string } }>(
            'erinnerung_posten',
            `${SPALTEN_I3.posten}, mail_versand!inner(status)`,
            org,
            (q) => q.in('mail_versand.status', [...VERSAND_ERFOLGREICH]).not('empfaenger_benutzer_id', 'is', null),
          ),
        ]);
      const bereicheJe = new Map<Id, Id[]>();
      for (const v of verantwortung) bereicheJe.set(v.mitgliedschaft_id, [...(bereicheJe.get(v.mitgliedschaft_id) ?? []), v.bereich_id]);
      const benutzer: Benutzer[] = mitglieder.map((m) => ({ id: m.benutzer_id, name: m.anzeigename, email: m.email ?? '' }));
      return {
        organisation: zuOrganisation(orgZeilen[0]),
        bereiche: bereiche.map(zuBereich),
        einstellungen: einstellungen.map(zuErinnerungEinstellung),
        mitgliedschaften: mitglieder.map((m) => zuMitgliedschaft(m, bereicheJe.get(m.id) ?? [])),
        benutzer,
        katalog: katalog.map(zuKatalog),
        geraete: geraete.map(zuGeraet),
        pruefarten: pruefarten.map(zuPruefart),
        nachweise: nachweise.map(zuNachweis),
        anlaesse: anlaesse.map(zuAnlass),
        maengel: maengel.map(zuMangel),
        offeneUebernahmen: uebernahmen.map(zuUebernahme),
        betriebsstatusEreignisse: ereignisse.map((e): Pick<Ereignis, 'id' | 'geraetId' | 'zeitpunkt'> => ({
          id: e.id,
          geraetId: e.geraet_id,
          zeitpunkt: new Date(e.zeitpunkt).toISOString(),
        })),
        abmeldungen: abmeldungen.map((a) => ({ benutzerId: a.benutzer_id, art: a.art })),
        bisherigePosten: posten
          .map((z) => zuErinnerungPosten(z))
          .filter(
            (p) =>
              p.art === 'ma_hinweis' ||
              (p.art === 'frist' && p.bezugDatum !== null && p.bezugDatum >= fristAb) ||
              (p.art === 'pruefer_woche' && p.bezugDatum !== null && p.bezugDatum >= wocheAb),
          )
          .map((p) => ({
            art: p.art,
            stufe: p.stufe,
            geraetId: p.geraetId,
            geraetPruefartId: p.geraetPruefartId,
            bezugDatum: p.bezugDatum,
            empfaengerBenutzerId: p.empfaengerBenutzerId as Id,
            schluessel: p.schluessel,
          })),
      };
    },

    async starteLauf({ laufDatum, ausloeser, erzwingen }) {
      const r = await rpc<{ ergebnis: string; lauf?: ErinnerungLaufZeile }>('erinnerung_lauf_starten', {
        p_datum: laufDatum,
        p_ausloeser: ausloeser,
        p_erzwingen: erzwingen,
      });
      if (r?.ergebnis === 'gestartet' && r.lauf) return { ergebnis: 'gestartet' as const, lauf: zuErinnerungLauf(r.lauf) };
      if (r?.ergebnis === 'bereits_gelaufen') return { ergebnis: 'bereits_gelaufen' as const };
      return { ergebnis: 'laeuft' as const };
    },

    async beendeLauf({ laufId, status }) {
      await rpc('erinnerung_lauf_beenden', { p_lauf: laufId, p_status: status });
    },

    async reserviereVersand({ versand, posten }) {
      const v = vonMailVersand(versand);
      const r = await rpc<boolean>('erinnerung_versand_reservieren', {
        p_versand: { id: v.id, organisation_id: v.organisation_id, lauf_id: v.lauf_id, lauf_datum: v.lauf_datum, art: v.art, empfaenger_benutzer_id: v.empfaenger_benutzer_id },
        p_posten: posten.map((p) => {
          const z = vonErinnerungPosten(p);
          return {
            id: z.id,
            organisation_id: z.organisation_id,
            schluessel: z.schluessel,
            art: z.art,
            stufe: z.stufe,
            geraet_id: z.geraet_id,
            geraet_pruefart_id: z.geraet_pruefart_id,
            bereich_id: z.bereich_id,
            bezug_datum: z.bezug_datum,
            rolle: z.rolle,
          };
        }),
      });
      return r === true;
    },

    async setzeVersandStatus({ versandId, status, versuche, anbieterId, fehlerCode }) {
      await rpc('erinnerung_versand_status', {
        p_versand: versandId,
        p_status: status,
        p_versuche: versuche,
        p_anbieter_id: anbieterId,
        p_fehler_code: fehlerCode,
      });
    },

    async setzeStatusPerAnbieterId({ anbieterId, status }) {
      return (await rpc<boolean>('erinnerung_status_per_anbieter', { p_anbieter_id: anbieterId, p_status: status })) === true;
    },

    async holeAbmeldeKontext({ organisationId, benutzerId, art }) {
      const rolle = await aktiveRolle(organisationId, benutzerId);
      if (rolle === null || MAIL_ART_FUER_ROLLE[rolle] !== art) return null;
      const [org] = (pruefe(await client.from('organisation').select('name').eq('id', organisationId), 'organisation lesen (System)') ??
        []) as { name: string }[];
      if (!org) return null;
      const [abmeldung] = (pruefe(
        await client
          .from('mail_abmeldung')
          .select('abgemeldet')
          .eq('organisation_id', organisationId)
          .eq('benutzer_id', benutzerId)
          .eq('art', art),
        'mail_abmeldung lesen (System)',
      ) ?? []) as { abgemeldet: boolean }[];
      return { organisationName: org.name, abgemeldet: abmeldung?.abgemeldet ?? false };
    },

    async setzeAbmeldungSystem({ organisationId, benutzerId, art, abgemeldet }) {
      return (
        (await rpc<boolean>('mail_abmelden_system', { p_org: organisationId, p_benutzer: benutzerId, p_art: art, p_abgemeldet: abgemeldet })) === true
      );
    },

    /** No-op: pg_cron-Job readyloop_mail_pseudonymisieren (03:20 Europe/Berlin). */
    async pseudonymisiereMaHinweise() {},
  };
}

/** Standard: Service-Role-Client aus supabase/system.ts (einzige Importstelle). */
export async function standardSystemRepository(): Promise<ErinnerungsSystemRepository> {
  const { erzeugeSystemClient } = await import('../../supabase/system');
  return supabaseSystemRepository(erzeugeSystemClient());
}
