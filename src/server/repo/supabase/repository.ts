// Supabase-Repository (BE-13/BE-14). Gleiche Schnittstelle wie das Demo-Repository; läuft über den Benutzer-Client,
// damit RLS als zweite Verteidigungslinie greift (P-07). Ereignisse entstehen per Trigger: der Parameter `ereignis`
// wird ignoriert (Ausnahme: Zusatzdaten wie `eingeladen` gehen an die RPC).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Id } from '@/domain/types';
import type { Repository } from '../types';
import {
  RepositoryFehler,
  SPALTEN,
  nachweisPfad,
  pgFehlerText,
  vonBereich,
  vonFrist,
  vonGbuDokument,
  vonGeraet,
  vonMangel,
  vonMitgliedschaft,
  vonNachweis,
  zuAnlass,
  zuBenutzer,
  zuBereich,
  zuEreignis,
  zuGeraet,
  zuKatalog,
  zuMangel,
  zuMitgliedschaft,
  zuNachweis,
  zuOrganisation,
  zuPruefart,
  type AnlassZeile,
  type BereichZeile,
  type EreignisZeile,
  type GeraetZeile,
  type KatalogZeile,
  type MangelZeile,
  type MitgliedschaftZeile,
  type NachweisZeile,
  type OrganisationZeile,
  type PruefartZeile,
} from './mapping';

export const NACHWEIS_BUCKET = 'nachweise';

interface PgFehler {
  code?: string;
  message?: string;
}

/** Supabase-Antwort prüfen; Fehler als RepositoryFehler mit deutscher Meldung. */
export function pruefe<T>(antwort: { data: T; error: PgFehler | null }, kontext: string): T {
  if (antwort.error) {
    console.error(`supabase ${kontext}`, antwort.error.code, antwort.error.message);
    throw new RepositoryFehler(pgFehlerText(antwort.error.code, antwort.error.message), antwort.error.code);
  }
  return antwort.data;
}

export interface SupabaseRepositoryOptionen {
  /** Einladung per Service-Role (Standard: src/server/supabase/admin.ts); für Tests ersetzbar. */
  einladen?: Repository['ladeBenutzerEin'];
}

async function standardEinladen(daten: { email: string; name: string }) {
  const { ladeBenutzerEinPerServiceRole } = await import('../../supabase/admin');
  return ladeBenutzerEinPerServiceRole(daten);
}

export function supabaseRepository(
  client: SupabaseClient,
  organisationId: Id | null,
  optionen: SupabaseRepositoryOptionen = {},
): Repository {
  const einladen = optionen.einladen ?? standardEinladen;
  const liste = async <Z>(tabelle: string, spalten: string, filter: [string, unknown][] = []): Promise<Z[]> => {
    let q = client.from(tabelle).select(spalten);
    for (const [s, w] of filter) q = q.eq(s, w);
    return (pruefe(await q, `${tabelle} lesen`) ?? []) as Z[];
  };
  const eine = async <Z>(tabelle: string, spalten: string, id: Id): Promise<Z | null> =>
    (pruefe(await client.from(tabelle).select(spalten).eq('id', id).maybeSingle(), `${tabelle} lesen`) ?? null) as Z | null;
  const bereichIdsVon = async (mitgliedschaftIds: Id[]): Promise<Map<Id, Id[]>> => {
    const map = new Map<Id, Id[]>();
    if (mitgliedschaftIds.length === 0) return map;
    const zeilen = (pruefe(
      await client.from('bereich_verantwortung').select('mitgliedschaft_id, bereich_id').in('mitgliedschaft_id', mitgliedschaftIds),
      'bereich_verantwortung lesen',
    ) ?? []) as { mitgliedschaft_id: Id; bereich_id: Id }[];
    for (const z of zeilen) map.set(z.mitgliedschaft_id, [...(map.get(z.mitgliedschaft_id) ?? []), z.bereich_id]);
    return map;
  };
  const mitBereichen = async (zeilen: MitgliedschaftZeile[]) => {
    const bereiche = await bereichIdsVon(zeilen.map((z) => z.id));
    return zeilen.map((z) => zuMitgliedschaft(z, bereiche.get(z.id) ?? []));
  };
  /** UPDATE einer Zeile; 0 betroffene Zeilen = nicht sichtbar oder keine Berechtigung (RLS). */
  const aendere = async (tabelle: string, id: Id, werte: Record<string, unknown>) => {
    const antwort = await client.from(tabelle).update(werte, { count: 'exact' }).eq('id', id);
    pruefe(antwort, `${tabelle} ändern`);
    if (antwort.count === 0) throw new RepositoryFehler(pgFehlerText('42501'), '42501');
  };

  return {
    // ------------------------------------------------------------------ Lesen
    async holeOrganisation(id) {
      const z = await eine<OrganisationZeile>('organisation', SPALTEN.organisation, id);
      return z ? zuOrganisation(z) : null;
    },
    /** Benutzer im Kontext der aktuellen Organisation (Name = anzeigename). */
    async holeBenutzer(id) {
      const filter: [string, unknown][] = [['benutzer_id', id]];
      if (organisationId) filter.push(['organisation_id', organisationId]);
      const [z] = await liste<MitgliedschaftZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, filter);
      return z ? zuBenutzer(z) : null;
    },
    async listeBenutzer(org) {
      return (await liste<MitgliedschaftZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['organisation_id', org]])).map(zuBenutzer);
    },
    async listeMitgliedschaften(org) {
      return mitBereichen(await liste<MitgliedschaftZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['organisation_id', org]]));
    },
    async mitgliedschaftenVonBenutzer(benutzerId) {
      return mitBereichen(await liste<MitgliedschaftZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['benutzer_id', benutzerId]]));
    },
    async listeBereiche(org) {
      return (await liste<BereichZeile>('bereich', SPALTEN.bereich, [['organisation_id', org]])).map(zuBereich);
    },
    async listeKatalog() {
      return (await liste<KatalogZeile>('katalog_eintrag', SPALTEN.katalog)).map(zuKatalog);
    },
    async listeGeraete(org) {
      return (await liste<GeraetZeile>('geraet', SPALTEN.geraet, [['organisation_id', org]])).map(zuGeraet);
    },
    async holeGeraet(id) {
      const z = await eine<GeraetZeile>('geraet', SPALTEN.geraet, id);
      return z ? zuGeraet(z) : null;
    },
    async listePruefarten(org) {
      return (await liste<PruefartZeile>('geraet_pruefart', SPALTEN.pruefart, [['organisation_id', org]])).map(zuPruefart);
    },
    async holePruefart(id) {
      const z = await eine<PruefartZeile>('geraet_pruefart', SPALTEN.pruefart, id);
      return z ? zuPruefart(z) : null;
    },
    async listeNachweise(org) {
      return (await liste<NachweisZeile>('nachweis', SPALTEN.nachweis, [['organisation_id', org]])).map(zuNachweis);
    },
    async holeNachweis(id) {
      const z = await eine<NachweisZeile>('nachweis', SPALTEN.nachweis, id);
      return z ? zuNachweis(z) : null;
    },
    /** Download über den Benutzer-Client: Storage-RLS prüft die Sicht über die Nachweis-Zeile. */
    async holeNachweisPdf(id) {
      const z = await eine<Pick<NachweisZeile, 'pdf_pfad'>>('nachweis', 'pdf_pfad', id);
      if (!z) return null;
      const { data, error } = await client.storage.from(NACHWEIS_BUCKET).download(z.pdf_pfad);
      if (error || !data) {
        console.error('supabase nachweis-pdf', error?.message);
        return null;
      }
      return new Uint8Array(await data.arrayBuffer());
    },
    async listeEreignisse(org, geraetId) {
      let q = client.from('ereignis').select(SPALTEN.ereignis).eq('organisation_id', org);
      if (geraetId !== undefined) q = q.eq('geraet_id', geraetId);
      const zeilen = (pruefe(await q.order('zeitpunkt', { ascending: false }), 'ereignis lesen') ?? []) as EreignisZeile[];
      return zeilen.map(zuEreignis);
    },
    async listeAnlaesse(org) {
      return (await liste<AnlassZeile>('anlass', SPALTEN.anlass, [['organisation_id', org]])).map(zuAnlass);
    },
    async holeAnlass(id) {
      const z = await eine<AnlassZeile>('anlass', SPALTEN.anlass, id);
      return z ? zuAnlass(z) : null;
    },
    async listeMaengel(org) {
      return (await liste<MangelZeile>('mangel', SPALTEN.mangel, [['organisation_id', org]])).map(zuMangel);
    },
    async holeMangel(id) {
      const z = await eine<MangelZeile>('mangel', SPALTEN.mangel, id);
      return z ? zuMangel(z) : null;
    },

    // ------------------------------------------------------------ Schreiben I1
    /** RPC geraet_anlegen: Gerät + Prüfarten ohne Frist in einer Transaktion; Ereignis per Trigger. */
    async legeGeraetAn({ geraet, pruefarten }) {
      const g = vonGeraet(geraet);
      pruefe(
        await client.rpc('geraet_anlegen', {
          p_geraet: {
            id: g.id,
            organisation_id: g.organisation_id,
            bereich_id: g.bereich_id,
            bezeichnung: g.bezeichnung,
            inventarnummer: g.inventarnummer,
            geraetegruppe: g.geraetegruppe,
            kategorie: g.kategorie,
            hersteller: g.hersteller,
            typ: g.typ,
            seriennummer: g.seriennummer,
            baujahr: g.baujahr,
            einsatzort: g.einsatzort,
          },
          p_pruefarten: pruefarten.map((p) => ({
            id: p.id,
            katalog_schluessel: p.katalogSchluessel,
            bezeichnung: p.bezeichnung,
            herstellerfrist_monate: p.herstellerfristMonate,
            herstellerfrist_quelle: p.herstellerfristQuelle,
            letzte_pruefung: p.letztePruefung,
            letzte_pruefung_herkunft: p.letztePruefungHerkunft,
          })),
        }),
        'geraet_anlegen',
      );
    },
    /** RPC frist_setzen: Trigger stempeln Freigabe (auth.uid, now) und schreiben frist_freigegeben mit nachweisId/richtung. */
    async setzeFrist({ pruefartId, frist, nachweisId }) {
      pruefe(await client.rpc('frist_setzen', { p_pruefart: pruefartId, p_frist: vonFrist(frist), p_nachweis: nachweisId }), 'frist_setzen');
    },
    /**
     * Erst PDF hochladen (upsert: false), dann Nachweis-Zeile mit derselben ID. Scheitert das Einfügen, bleibt die Datei
     * verwaist (kein Löschrecht für Clients) und wird geloggt. letzte_pruefung schreibt der Trigger fort (F-7).
     */
    async erfasseNachweis({ nachweis, pdf }) {
      const pfad = nachweisPfad(nachweis);
      const hoch = await client.storage.from(NACHWEIS_BUCKET).upload(pfad, pdf, { contentType: 'application/pdf', upsert: false });
      if (hoch.error) {
        console.error('supabase nachweis-upload', hoch.error.message);
        throw new RepositoryFehler('Das PDF konnte nicht gespeichert werden.');
      }
      const { erfasst_am: _erfasstAm, ...zeile } = vonNachweis(nachweis); // erfasst_am setzt der Trigger
      void _erfasstAm;
      const antwort = await client.from('nachweis').insert(zeile);
      if (antwort.error) {
        console.error('supabase nachweis: Datei verwaist', pfad, antwort.error.code, antwort.error.message);
        throw new RepositoryFehler(pgFehlerText(antwort.error.code, antwort.error.message), antwort.error.code);
      }
    },

    // ------------------------------------------------------------ Schreiben I2 (BE-14)
    async speichereBereich({ bereich, neu }) {
      if (neu) {
        let standortId = bereich.standortId;
        if (!standortId) {
          const [s] = await liste<{ id: Id }>('standort', 'id', [['organisation_id', bereich.organisationId]]);
          if (!s) throw new RepositoryFehler('Für die Organisation ist kein Standort angelegt.');
          standortId = s.id;
        }
        pruefe(await client.from('bereich').insert(vonBereich({ ...bereich, standortId })), 'bereich anlegen');
      } else {
        await aendere('bereich', bereich.id, { name: bereich.name, einsatzort: bereich.einsatzort });
      }
    },
    async ladeBenutzerEin(daten) {
      return einladen(daten);
    },
    /** RPC mitglied_speichern: Mitgliedschaft + Bereichsmenge atomar; Ereignis mitglied_gespeichert per Trigger. */
    async speichereMitgliedschaft({ mitgliedschaft, benutzer, ereignis }) {
      pruefe(
        await client.rpc('mitglied_speichern', {
          p_mitgliedschaft: { ...vonMitgliedschaft(mitgliedschaft, benutzer), eingeladen: ereignis.daten.eingeladen === true },
          p_bereich_ids: mitgliedschaft.bereichIds,
        }),
        'mitglied_speichern',
      );
    },
    async setzePruefer({ pruefartId, prueferId }) {
      await aendere('geraet_pruefart', pruefartId, { zugewiesener_pruefer_id: prueferId });
    },
    async setzeGbuDokument({ pruefartId, gbuDokument }) {
      await aendere('geraet_pruefart', pruefartId, vonGbuDokument(gbuDokument));
    },
    async verschiebeGeraet({ geraetId, bereichId, begruendung }) {
      pruefe(await client.rpc('geraet_verschieben', { p_geraet: geraetId, p_bereich: bereichId, p_begruendung: begruendung }), 'geraet_verschieben');
    },
    async setzeBetriebsstatus({ geraetId, betriebsstatus, begruendung }) {
      pruefe(
        await client.rpc('betriebsstatus_setzen', { p_geraet: geraetId, p_status: betriebsstatus, p_begruendung: begruendung }),
        'betriebsstatus_setzen',
      );
    },
    /** Ein INSERT mit n Zeilen (eine Transaktion); Erfasser stempelt der Trigger. */
    async erfasseAnlaesse({ anlaesse }) {
      if (anlaesse.length === 0) return;
      const zeilen = anlaesse.map((a) => ({
        id: a.id,
        organisation_id: a.organisationId,
        geraet_id: a.geraetId,
        geraet_pruefart_id: a.geraetPruefartId,
        art: a.art,
        datum: a.datum,
        beschreibung: a.beschreibung,
        erfasst_von: a.erfasstVon,
      }));
      pruefe(await client.from('anlass').insert(zeilen), 'anlass erfassen');
    },
    /** Nur die Begründung; aufgehoben_von/_name/_am stempelt der Trigger (einmalig). */
    async hebeAnlassAuf({ anlass }) {
      await aendere('anlass', anlass.id, { aufhebungsgrund: anlass.aufhebungsgrund });
    },
    async erfasseMangel({ mangel }) {
      const z = vonMangel(mangel);
      pruefe(
        await client.from('mangel').insert({
          id: z.id,
          organisation_id: z.organisation_id,
          geraet_id: z.geraet_id,
          geraet_pruefart_id: z.geraet_pruefart_id,
          nachweis_id: z.nachweis_id,
          beschreibung: z.beschreibung,
          schwere: z.schwere,
          termin: z.termin,
          verantwortlich_id: z.verantwortlich_id,
          erfasst_von: z.erfasst_von,
        }),
        'mangel erfassen',
      );
    },
    /** Nur Übergänge F-14; Kenntnis- und Behebungs-Stempel setzt der Trigger. */
    async aktualisiereMangel({ mangel }) {
      if (mangel.status === 'in_bearbeitung') {
        await aendere('mangel', mangel.id, { status: 'in_bearbeitung', verantwortlich_id: mangel.verantwortlichId, termin: mangel.termin });
      } else if (mangel.status === 'behoben') {
        await aendere('mangel', mangel.id, {
          status: 'behoben',
          behoben_am: mangel.behobenAm,
          behoben_durch: mangel.behobenDurch,
          behebung: mangel.behebung,
        });
      } else {
        throw new RepositoryFehler('Statusübergang nicht erlaubt.', '23514');
      }
    },
  };
}
