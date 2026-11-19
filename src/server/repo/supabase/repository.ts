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
  vonFrist,
  vonGeraet,
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

export function supabaseRepository(client: SupabaseClient, organisationId: Id | null): Repository {
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
  const nichtImplementiert = (): never => {
    throw new Error('nicht implementiert (BE-14)');
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
    speichereBereich: nichtImplementiert,
    ladeBenutzerEin: nichtImplementiert,
    speichereMitgliedschaft: nichtImplementiert,
    setzePruefer: nichtImplementiert,
    setzeGbuDokument: nichtImplementiert,
    verschiebeGeraet: nichtImplementiert,
    setzeBetriebsstatus: nichtImplementiert,
    erfasseAnlaesse: nichtImplementiert,
    hebeAnlassAuf: nichtImplementiert,
    erfasseMangel: nichtImplementiert,
    aktualisiereMangel: nichtImplementiert,
  };
}
