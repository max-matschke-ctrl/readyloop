// Dienste I3M für Mitarbeiter (BE-17): Meine Geräte, Suche, QR-Seite, Übernahme/Rückgabe, Mangel melden,
// sowie Zuordnung und „Übernahme beenden“ durch ADM/VER (F-20 bis F-27).
// Mitarbeiter lesen nur Rohdaten mit öffentlichen Feldern (KurzRohdaten); Namen anderer Halter verlassen den Dienst nie.
import { randomUUID } from 'node:crypto';
import { addTage } from '@/domain/datum';
import { istTokenFormat } from '@/domain/nutzung';
import { can } from '@/domain/rechte';
import type { GeraetAktionEingabe, GeraetZuordnenEingabe, MangelMeldenEingabe } from '@/domain/schemas';
import {
  MANGEL_TERMIN_TAGE,
  NUTZUNG,
  UEBERNAHME_HINWEIS_LABEL,
  type GeraetKurzansicht,
  type Id,
  type IsoDate,
  type Mangel,
  type MeinGeraet,
  type Sitzung,
  type TokenSeite,
  type Uebernahme,
} from '@/domain/types';
import {
  aktivesMitglied,
  fehler,
  geraetImBereich,
  geraetSichtbar,
  kurzansichtAus,
  neuesEreignis,
  statusKernAus,
  type DienstErgebnis,
  type Zeit,
} from './dienste-basis';
import type { Repository } from './repo/types';

const istMitarbeiter = (sitzung: Sitzung | null): sitzung is Sitzung => sitzung?.rolle === 'mitarbeiter';

function vergleicheNullZuerst(a: IsoDate | null, b: IsoDate | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a.localeCompare(b);
}

/** Kurzansicht eines Geräts der eigenen Organisation für einen Mitarbeiter, sonst null. */
async function kurzansicht(sitzung: Sitzung, repo: Repository, heute: IsoDate, geraetId: Id): Promise<GeraetKurzansicht | null> {
  // ma_kurzansichten liefert nur Geräte der übergebenen Organisation (SQL und Demo).
  const [roh] = await repo.listeKurzRohdaten(sitzung.organisation.id, { art: 'ids', geraetIds: [geraetId] }, sitzung.benutzer.id);
  return roh && roh.geraetId === geraetId ? kurzansichtAus(roh, heute) : null;
}

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

/** meine_geraete.lesen. Sortierung: nutzung (nicht_verwenden, unklar, verwendbar), naechsteFaelligkeit (null zuerst), Bezeichnung. */
export async function listeMeineGeraete(sitzung: Sitzung, repo: Repository, heute: IsoDate): Promise<MeinGeraet[]> {
  if (!can(sitzung.rolle, 'meine_geraete.lesen')) return [];
  const roh = await repo.listeKurzRohdaten(sitzung.organisation.id, { art: 'meine' }, sitzung.benutzer.id);
  return roh
    .map((r): MeinGeraet => {
      const k = kurzansichtAus(r, heute);
      const uebernommen = !r.zugeordnetMir && r.offeneUebernahme?.vonMir === true;
      return { ...k, bezug: uebernommen ? 'uebernommen' : 'zugeordnet', uebernommenSeit: uebernommen ? r.offeneUebernahme!.seit : null };
    })
    .sort(
      (a, b) =>
        NUTZUNG.indexOf(a.nutzung) - NUTZUNG.indexOf(b.nutzung) ||
        vergleicheNullZuerst(a.naechsteFaelligkeit, b.naechsteFaelligkeit) ||
        a.bezeichnung.localeCompare(b.bezeichnung, 'de'),
    );
}

/** geraet.suchen. suche < 2 Zeichen → []. Höchstens 50 Treffer, nach Bezeichnung. */
export async function sucheGeraete(sitzung: Sitzung, repo: Repository, heute: IsoDate, suche: string): Promise<GeraetKurzansicht[]> {
  if (!can(sitzung.rolle, 'geraet.suchen')) return [];
  const q = suche.trim();
  if (q.length < 2) return [];
  const roh = await repo.listeKurzRohdaten(sitzung.organisation.id, { art: 'suche', suche: q.slice(0, 80) }, sitzung.benutzer.id);
  return roh
    .map((r) => kurzansichtAus(r, heute))
    .sort((a, b) => a.bezeichnung.localeCompare(b.bezeichnung, 'de'))
    .slice(0, 50);
}

/** Kontext für /mangel-melden/[geraetId]: nur Rolle mitarbeiter, Gerät der eigenen Organisation; sonst null. */
export async function holeMangelMeldung(sitzung: Sitzung, repo: Repository, heute: IsoDate, geraetId: Id): Promise<GeraetKurzansicht | null> {
  if (!istMitarbeiter(sitzung) || !can(sitzung.rolle, 'mangel.erfassen')) return null;
  return kurzansicht(sitzung, repo, heute, geraetId);
}

/**
 * F-24: öffentliche QR-Seite. Falsches Format → null ohne Datenzugriff; unbekannter oder deaktivierter Token → null.
 * kurz nur für Rolle mitarbeiter derselben Organisation; akteUrl bei geraet.lesen + Geltungsbereich.
 * repo: Repository der Anfrage (ohne Sitzung: anonym).
 */
export async function holeTokenSeite(
  sitzung: Sitzung | null,
  repo: Repository,
  zeit: Zeit,
  token: string,
): Promise<TokenSeite | null> {
  if (!istTokenFormat(token)) return null;
  const roh = await repo.holeTokenRohdaten(
    token,
    sitzung ? { benutzerId: sitzung.benutzer.id, organisationId: sitzung.organisation.id } : null,
  );
  if (!roh) return null;
  const { organisationName, eigeneOrganisation, ...rest } = roh;
  const ansicht = { ...statusKernAus(rest, zeit.heute), organisationName, stand: zeit.jetzt.toISOString() };
  // Geräte-ID nur für aktive Mitglieder, deren aktuelle Organisation die Geräte-Organisation ist (F-24, Review I3M).
  const gleicheOrg = sitzung !== null && eigeneOrganisation !== null;

  let kurz: GeraetKurzansicht | null = null;
  let akteUrl: string | null = null;
  if (gleicheOrg && istMitarbeiter(sitzung)) {
    kurz = await kurzansicht(sitzung, repo, zeit.heute, eigeneOrganisation.geraetId);
  } else if (gleicheOrg && can(sitzung.rolle, 'geraet.lesen')) {
    const [geraet, pruefarten] = await Promise.all([
      repo.holeGeraet(eigeneOrganisation.geraetId),
      repo.listePruefarten(sitzung.organisation.id),
    ]);
    if (geraet && geraet.organisationId === sitzung.organisation.id && geraetSichtbar(sitzung, geraet, pruefarten)) {
      akteUrl = `/geraete/${geraet.id}`;
    }
  }
  return {
    token,
    ansicht,
    angemeldet: sitzung !== null,
    andereOrganisation: sitzung !== null && !gleicheOrg,
    kurz,
    akteUrl,
  };
}

// ---------------------------------------------------------------------------
// Übernahme und Rückgabe (F-23)
// ---------------------------------------------------------------------------

export const SCHON_UEBERNOMMEN = 'Sie haben dieses Gerät bereits übernommen.';

/** geraet.uebernehmen: nur Rolle MA, nur wechselnd, in Betrieb, nicht „nicht verwenden“. Fremde offene → 'uebergabe'. */
export async function geraetUebernehmen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetAktionEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ geraetId: Id; vorherigeBeendet: boolean }>> {
  if (!can(sitzung.rolle, 'geraet.uebernehmen') || !istMitarbeiter(sitzung)) return fehler('Keine Berechtigung, Geräte zu übernehmen.');
  const k = await kurzansicht(sitzung, repo, zeit.heute, eingabe.geraetId);
  if (!k) return fehler('Gerät nicht gefunden.');
  if (k.uebernahme === 'von_mir') return fehler(SCHON_UEBERNOMMEN);
  if (k.uebernahmeHinweis !== null) return fehler(UEBERNAHME_HINWEIS_LABEL[k.uebernahmeHinweis]);

  const jetzt = zeit.jetzt.toISOString();
  // Supabase: MA sieht fremde Übernahmen nicht (RLS) – die RPC beendet sie selbst; die Demo braucht den Datensatz.
  const offen = (await repo.listeOffeneUebernahmen(sitzung.organisation.id, k.geraetId))[0] ?? null;
  const vorherige: Uebernahme | null =
    offen && offen.benutzerId !== sitzung.benutzer.id
      ? { ...offen, bis: jetzt, endeArt: 'uebergabe', beendetVon: sitzung.benutzer.id }
      : null;
  await repo.starteUebernahme({
    uebernahme: {
      id: randomUUID(),
      organisationId: sitzung.organisation.id,
      geraetId: k.geraetId,
      benutzerId: sitzung.benutzer.id,
      benutzerName: sitzung.benutzer.name,
      von: jetzt,
      bis: null,
      endeArt: null,
      beendetVon: null,
    },
    vorherige,
  });
  return { ok: true, geraetId: k.geraetId, vorherigeBeendet: k.uebernahme === 'von_anderen' };
}

/** geraet.uebernehmen: nur eigene offene Übernahme, immer möglich (auch bei „Nicht verwenden“). */
export async function geraetZurueckgeben(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetAktionEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ geraetId: Id }>> {
  if (!can(sitzung.rolle, 'geraet.uebernehmen') || !istMitarbeiter(sitzung)) return fehler('Keine Berechtigung.');
  const eigene = (await repo.listeOffeneUebernahmen(sitzung.organisation.id, eingabe.geraetId)).find(
    (u) => u.bis === null && u.benutzerId === sitzung.benutzer.id && u.organisationId === sitzung.organisation.id,
  );
  if (!eigene) return fehler('Sie haben dieses Gerät nicht übernommen.');
  await repo.beendeUebernahme({
    uebernahme: { ...eigene, bis: zeit.jetzt.toISOString(), endeArt: 'rueckgabe', beendetVon: sitzung.benutzer.id },
  });
  return { ok: true, geraetId: eigene.geraetId };
}

/** F-23 (c): geraet.zuordnen + Geltungsbereich beendet eine fremde offene Übernahme ('beendet_verwaltung'). */
export async function uebernahmeBeenden(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetAktionEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ geraetId: Id }>> {
  if (!can(sitzung.rolle, 'geraet.zuordnen')) return fehler('Keine Berechtigung, Übernahmen zu beenden.');
  const geraet = await repo.holeGeraet(eingabe.geraetId);
  if (!geraet || !geraetImBereich(sitzung, geraet)) return fehler('Gerät nicht gefunden.');
  const offen = (await repo.listeOffeneUebernahmen(sitzung.organisation.id, geraet.id))[0];
  if (!offen) return fehler('Das Gerät ist nicht übernommen.');
  await repo.beendeUebernahme({
    uebernahme: { ...offen, bis: zeit.jetzt.toISOString(), endeArt: 'beendet_verwaltung', beendetVon: sitzung.benutzer.id },
  });
  return { ok: true, geraetId: geraet.id };
}

// ---------------------------------------------------------------------------
// Zuordnung (F-22)
// ---------------------------------------------------------------------------

export const NUR_PERSONENBEZOGEN = 'Nur personenbezogene Geräte werden zugeordnet.';

/** geraet.zuordnen + Geltungsbereich; Ziel aktives Mitglied mit Rolle mitarbeiter; Ereignis ohne Personenbezug. */
export async function geraetZuordnen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetZuordnenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; geloest: boolean }>> {
  if (!can(sitzung.rolle, 'geraet.zuordnen')) return fehler('Keine Berechtigung, Geräte zuzuordnen.');
  const geraet = await repo.holeGeraet(eingabe.geraetId);
  if (!geraet || !geraetImBereich(sitzung, geraet)) return fehler('Gerät nicht gefunden.');
  if (geraet.kategorie !== 'personenbezogen') return fehler(NUR_PERSONENBEZOGEN, 'benutzerId');
  if (eingabe.benutzerId !== null) {
    const ctx = { mitgliedschaften: await repo.listeMitgliedschaften(sitzung.organisation.id) };
    if (!aktivesMitglied(ctx, eingabe.benutzerId, ['mitarbeiter'])) {
      return fehler('Zuordnung nur an aktive Mitarbeiter der Organisation.', 'benutzerId');
    }
  }
  const geloest = eingabe.benutzerId === null;
  if (geraet.zugeordnetAn === eingabe.benutzerId) return { ok: true, geraetId: geraet.id, geloest };
  await repo.setzeZuordnung({
    geraetId: geraet.id,
    benutzerId: eingabe.benutzerId,
    ereignis: neuesEreignis(sitzung, geraet.id, 'zuordnung_geaendert', { zugeordnet: !geloest }, jetzt),
  });
  return { ok: true, geraetId: geraet.id, geloest };
}

/** geraet.zuordnen: aktive Mitglieder mit Rolle mitarbeiter, alphabetisch. Sonst []. */
export async function listeMitarbeiterOptionen(sitzung: Sitzung, repo: Repository) {
  if (!can(sitzung.rolle, 'geraet.zuordnen')) return [];
  const [mitglieder, benutzer] = await Promise.all([
    repo.listeMitgliedschaften(sitzung.organisation.id),
    repo.listeBenutzer(sitzung.organisation.id),
  ]);
  const name = new Map(benutzer.map((b) => [b.id, b.name]));
  return mitglieder
    .filter((m) => m.aktiv && m.rolle === 'mitarbeiter')
    .map((m) => ({ benutzerId: m.benutzerId, name: name.get(m.benutzerId) ?? '', rolle: m.rolle }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// ---------------------------------------------------------------------------
// Mangel melden (F-26)
// ---------------------------------------------------------------------------

export const MANGEL_GEMELDET = 'Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.';

/** mangel.erfassen + Rolle mitarbeiter; jedes Gerät der Organisation; ohne Prüfart, Nachweis, Verantwortlichen; Termin nach Q-16. */
export async function mangelMelden(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MangelMeldenEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ id: Id; geraetId: Id }>> {
  if (!istMitarbeiter(sitzung) || !can(sitzung.rolle, 'mangel.erfassen')) return fehler('Keine Berechtigung, Mängel zu melden.');
  const beschreibung = eingabe.beschreibung.trim();
  if (beschreibung.length < 5) return fehler('Mindestens 5 Zeichen', 'beschreibung');
  const k = await kurzansicht(sitzung, repo, zeit.heute, eingabe.geraetId);
  if (!k) return fehler('Gerät nicht gefunden.');
  const mangel: Mangel = {
    id: randomUUID(),
    organisationId: sitzung.organisation.id,
    geraetId: k.geraetId,
    geraetPruefartId: null,
    nachweisId: null,
    beschreibung,
    schwere: eingabe.schwere,
    termin: addTage(zeit.heute, MANGEL_TERMIN_TAGE[eingabe.schwere]),
    status: 'offen',
    verantwortlichId: null,
    erfasstVon: sitzung.benutzer.id,
    erfasstVonName: sitzung.benutzer.name,
    erfasstAm: zeit.jetzt.toISOString(),
    kenntnisVon: null,
    kenntnisVonName: null,
    kenntnisAm: null,
    behobenAm: null,
    behobenDurch: null,
    behebung: null,
    behebungErfasstVon: null,
    behebungErfasstVonName: null,
    behebungErfasstAm: null,
  };
  await repo.erfasseMangel({
    mangel,
    ereignis: neuesEreignis(
      sitzung,
      k.geraetId,
      'mangel_erfasst',
      { mangelId: mangel.id, pruefartId: null, nachweisId: null, schwere: mangel.schwere, termin: mangel.termin },
      zeit.jetzt,
    ),
  });
  return { ok: true, id: mangel.id, geraetId: k.geraetId };
}
