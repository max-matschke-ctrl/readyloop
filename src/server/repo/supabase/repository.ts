// Supabase-Repository (BE-13/BE-14). Gleiche Schnittstelle wie das Demo-Repository; läuft über den Benutzer-Client,
// damit RLS als zweite Verteidigungslinie greift (P-07). Ereignisse entstehen per Trigger: der Parameter `ereignis`
// wird ignoriert (Ausnahme: Zusatzdaten wie `eingeladen` gehen an die RPC).
import type { SupabaseClient } from '@supabase/supabase-js';
import { PROTOKOLL_PRO_SEITE, type AbbestellbareMailArt, type Id } from '@/domain/types';
import type { Repository } from '../types';
import {
  RepositoryFehler,
  SPALTEN,
  SPALTEN_I3,
  vonErinnerungEinstellung,
  zuErinnerungEinstellung,
  zuProtokollRohdaten,
  type ErinnerungEinstellungZeile,
  type ProtokollJson,
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
  zuGeraetToken,
  zuKurzRohdaten,
  zuPruefart,
  zuTokenRohdaten,
  zuUebernahme,
  zuUebernahmeVerlauf,
  type AnlassZeile,
  type BereichZeile,
  type EreignisZeile,
  type GeraetTokenZeile,
  type GeraetZeile,
  type KatalogZeile,
  type KurzRohJson,
  type MangelZeile,
  type MitgliedschaftLeseZeile,
  type NachweisZeile,
  type OrganisationZeile,
  type PruefartZeile,
  type TokenRohJson,
  type UebernahmeZeile,
  type UebernahmeVerlaufZeile,
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
  const mitBereichen = async (zeilen: MitgliedschaftLeseZeile[]) => {
    const bereiche = await bereichIdsVon(zeilen.map((z) => z.id));
    return zeilen.map((z) => zuMitgliedschaft(z, bereiche.get(z.id) ?? []));
  };
  /** E-Mail je Benutzer: RPC liefert nur für Admins der Organisation Zeilen, sonst leer (Befund I2-5). */
  const emailsVon = async (org: Id): Promise<Map<Id, string>> => {
    const zeilen = (pruefe(await client.rpc('mitglied_emails', { p_organisation: org }), 'mitglied_emails') ?? []) as {
      benutzer_id: Id;
      email: string;
    }[];
    return new Map(zeilen.map((z) => [z.benutzer_id, z.email]));
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
      const [z] = await liste<MitgliedschaftLeseZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, filter);
      if (!z) return null;
      const emails = organisationId ? await emailsVon(organisationId) : new Map<Id, string>();
      return zuBenutzer(z, emails.get(z.benutzer_id) ?? '');
    },
    async listeBenutzer(org) {
      const [zeilen, emails] = await Promise.all([
        liste<MitgliedschaftLeseZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['organisation_id', org]]),
        emailsVon(org),
      ]);
      return zeilen.map((z) => zuBenutzer(z, emails.get(z.benutzer_id) ?? ''));
    },
    async listeMitgliedschaften(org) {
      return mitBereichen(await liste<MitgliedschaftLeseZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['organisation_id', org]]));
    },
    async mitgliedschaftenVonBenutzer(benutzerId) {
      return mitBereichen(await liste<MitgliedschaftLeseZeile>('mitgliedschaft', SPALTEN.mitgliedschaft, [['benutzer_id', benutzerId]]));
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
    /** RPC geraet_anlegen: Gerät + Prüfarten ohne Frist in einer Transaktion; Ereignis und Token (F-24) per Trigger. */
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
    /** Ohne .select() nach dem Insert: Mitarbeiter haben keine SELECT-Policy auf mangel (F-26). */
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

    // ------------------------------------------------------------ I3M (BE-20)
    async listeTokens(org) {
      return (await liste<GeraetTokenZeile>('geraet_token', SPALTEN.token, [['organisation_id', org]])).map(zuGeraetToken);
    },
    /** Nur offene Zeilen (Filter bis is null); RLS (F-27): MA eigene; admin/sifa alle; VER Bereich; Prüfer keine. */
    async listeOffeneUebernahmen(org, geraetId) {
      let q = client.from('uebernahme').select(SPALTEN.uebernahme).eq('organisation_id', org);
      if (geraetId !== undefined) q = q.eq('geraet_id', geraetId);
      const zeilen = (pruefe(await q.is('bis', null), 'uebernahme lesen') ?? []) as unknown as UebernahmeZeile[];
      return zeilen.map(zuUebernahme);
    },
    /** RPC uebernahmen_verlauf (security definer): ein Gerät, nur admin, ≤ 90 Tage; jetzt rechnet die DB selbst. */
    async listeUebernahmeVerlauf(geraetId) {
      const daten = pruefe(await client.rpc('uebernahmen_verlauf', { p_geraet: geraetId }), 'uebernahmen_verlauf');
      return ((daten ?? []) as UebernahmeVerlaufZeile[]).map(zuUebernahmeVerlauf);
    },
    /** RPC ma_kurzansichten (security definer, nur öffentliche Felder); der Benutzer ergibt sich aus der Sitzung. */
    async listeKurzRohdaten(org, auswahl) {
      const daten = pruefe(
        await client.rpc('ma_kurzansichten', {
          p_org: org,
          p_art: auswahl.art,
          p_suche: auswahl.art === 'suche' ? auswahl.suche : null,
          p_ids: auswahl.art === 'ids' ? auswahl.geraetIds : null,
        }),
        'ma_kurzansichten',
      );
      return ((daten ?? []) as KurzRohJson[]).map(zuKurzRohdaten);
    },
    /** RPC geraet_oeffentlich – auch ohne Sitzung (anon). null bei falschem Format, unbekanntem oder inaktivem Token.
     *  Der Benutzer ergibt sich aus dem JWT; geraet_id nur, wenn p_organisation die Geräte-Organisation und er dort Mitglied ist. */
    async holeTokenRohdaten(token, fuer) {
      const daten = pruefe(
        await client.rpc('geraet_oeffentlich', { p_token: token, p_organisation: fuer?.organisationId ?? null }),
        'geraet_oeffentlich',
      );
      return daten ? zuTokenRohdaten(daten as TokenRohJson) : null;
    },
    /** RPC uebernahme_starten: beendet eine fremde offene Übernahme selbst ('uebergabe'); `vorherige` wird ignoriert. */
    async starteUebernahme({ uebernahme }) {
      pruefe(await client.rpc('uebernahme_starten', { p_geraet: uebernahme.geraetId }), 'uebernahme_starten');
    },
    /** RPC uebernahme_beenden: Ende-Art aus der Rolle (MA eigene → rueckgabe, admin/VER → beendet_verwaltung). */
    async beendeUebernahme({ uebernahme }) {
      pruefe(await client.rpc('uebernahme_beenden', { p_geraet: uebernahme.geraetId }), 'uebernahme_beenden');
    },
    /** Spalten-Grant zugeordnet_an; Trigger prüft Rolle/Ziel und schreibt zuordnung_geaendert ohne Person. */
    async setzeZuordnung({ geraetId, benutzerId }) {
      await aendere('geraet', geraetId, { zugeordnet_an: benutzerId });
    },
    /** RPC etikett_erneuern (invoker, RLS): Token entsteht in der DB; Rückgabe = neuer Token. */
    async erneuereToken({ geraetId }) {
      const token = pruefe(await client.rpc('etikett_erneuern', { p_geraet: geraetId }), 'etikett_erneuern');
      if (typeof token !== 'string') throw new RepositoryFehler('Der Aufkleber konnte nicht erneuert werden.');
      return token;
    },
    /** No-op: Trigger app.mitarbeiter_austritt in derselben Transaktion wie mitglied_speichern. */
    async loeseNutzungen() {},

    // ------------------------------------------------------------ I3 (BE-28)
    /** RLS: ADM/SIF alle Bereiche, VER eigene Bereiche. */
    async listeErinnerungEinstellungen(org) {
      return (await liste<ErinnerungEinstellungZeile>('erinnerung_einstellung', SPALTEN_I3.einstellung, [['organisation_id', org]])).map(
        zuErinnerungEinstellung,
      );
    },
    /** Upsert je Bereich (nur ADM, RLS). geaendert_* und das Ereignis setzen die Trigger; `ereignis` wird ignoriert. */
    async speichereErinnerungEinstellung({ einstellung }) {
      const { geaendert_von: _v, geaendert_von_name: _n, geaendert_am: _a, ...werte } = vonErinnerungEinstellung(einstellung);
      void _v;
      void _n;
      void _a;
      pruefe(await client.from('erinnerung_einstellung').upsert(werte, { onConflict: 'bereich_id' }), 'erinnerung_einstellung speichern');
    },
    /** RLS: nur eigene Zeilen. */
    async listeEigeneAbmeldungen(org, benutzerId) {
      const zeilen = (pruefe(
        await client.from('mail_abmeldung').select('art').eq('organisation_id', org).eq('benutzer_id', benutzerId).eq('abgemeldet', true),
        'mail_abmeldung lesen',
      ) ?? []) as { art: AbbestellbareMailArt }[];
      return zeilen.map((z) => z.art);
    },
    /** Upsert (organisation_id, benutzer_id, art); RLS prüft Person und passende Rolle; geaendert_am setzt der Trigger. */
    async setzeEigeneAbmeldung({ organisationId, benutzerId, art, abgemeldet }) {
      pruefe(
        await client
          .from('mail_abmeldung')
          .upsert({ organisation_id: organisationId, benutzer_id: benutzerId, art, abgemeldet }, { onConflict: 'organisation_id,benutzer_id,art' }),
        'mail_abmeldung speichern',
      );
    },
    /** RPC mail_protokoll (security definer, nur ADM/SIF, maskiert MA-Hinweise). 42501 → RepositoryFehler. */
    async listeMailProtokoll(org, filter) {
      const seite = Math.max(filter.seite ?? 1, 1);
      const daten = pruefe(
        await client.rpc('mail_protokoll', {
          p_org: org,
          p_von: filter.von,
          p_bis: filter.bis,
          p_status: filter.status ?? null,
          p_art: filter.art ?? null,
          p_bereich: filter.bereichId ?? null,
          p_limit: PROTOKOLL_PRO_SEITE,
          p_offset: (seite - 1) * PROTOKOLL_PRO_SEITE,
        }),
        'mail_protokoll',
      );
      return zuProtokollRohdaten((daten ?? { gesamt: 0, versand: [], posten: [], letzter_lauf: null }) as ProtokollJson);
    },
  };
}
