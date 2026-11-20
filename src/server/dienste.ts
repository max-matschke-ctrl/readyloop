// Dienste (BE-5/BE-10): Anwendungslogik mit explizitem Kontext (sitzung, repo, heute/jetzt) – testbar ohne Next und Cookies.
// Jede Funktion prüft Rolle (can) und Geltungsbereich selbst; Aufrufer müssen nichts vorprüfen.
// Mängel: dienste-maengel.ts · Verwaltung: dienste-verwaltung.ts · gemeinsame Bausteine: dienste-basis.ts
import { randomUUID } from 'node:crypto';
import { anlassErledigtDurch } from '@/domain/anlass';
import { istIsoDate } from '@/domain/datum';
import { ermittleFristVorschlag, fristRichtung, legeFristFest, wirksamerEinsatzort } from '@/domain/fristen';
import { imUebernahmeVerlauf } from '@/domain/nutzung';
import { can, darfVerschieben, imGeltungsbereich } from '@/domain/rechte';
import type {
  AnlassAufhebenEingabe,
  AnlassErfassenEingabe,
  BetriebsstatusSetzenEingabe,
  FristFreigebenEingabe,
  GbuDokumentSetzenEingabe,
  GeraetAnlegenEingabe,
  GeraetVerschiebenEingabe,
  PrueferZuweisenEingabe,
} from '@/domain/schemas';
import { naechsteFaelligkeit, prueferGruppe, statusRang } from '@/domain/status';
import {
  WAEHLBARER_BETRIEBSSTATUS,
  type Anlass,
  type Bereich,
  type DemoRolle,
  type Ereignis,
  type FestgelegteFrist,
  type GbuDokument,
  type Geraet,
  type GeraetDetail,
  type GeraeteFilter,
  type GeraetegruppeOption,
  type GeraetListenEintrag,
  type GeraetNutzung,
  type GeraetPruefart,
  type Id,
  type IsoDate,
  type KatalogEintrag,
  type Nachweis,
  type NachweisAnsicht,
  type OrganisationOption,
  type PrueferAufgabe,
  type PrueferOption,
  type PruefErgebnis,
  type Sitzung,
} from '@/domain/types';
import {
  aktivesMitglied,
  anlassAnsicht,
  baueAnsicht,
  fehler,
  geraetGesamt,
  geraetImBereich,
  geraetSichtbar,
  ladeKontext,
  mangelAnsicht,
  mangelSichtbar,
  nachNeuestem,
  neuesEreignis,
  pruefartSichtbar,
  type DienstErgebnis,
  type Zeit,
} from './dienste-basis';
import { sha256Hex } from './pdf';
import { neuerToken, tokenUrl } from './token';
import { DEMO_ROLLE_BENUTZER } from './repo/demo/daten';
import type { Repository } from './repo/types';

export type { DienstErgebnis } from './dienste-basis';

// ---------------------------------------------------------------------------
// Sitzung
// ---------------------------------------------------------------------------

/**
 * Sitzung für einen Benutzer (F-8): aktive Mitgliedschaften alphabetisch nach Organisation; gewünschte Organisation,
 * wenn dort eine aktive Mitgliedschaft besteht, sonst die erste. null ohne aktive Mitgliedschaft.
 * nurRolle: nur Mitgliedschaften dieser Rolle (Demo-Rollenwahl).
 */
export async function sitzungFuerBenutzer(
  repo: Repository,
  benutzerId: Id,
  optionen: { organisationId?: Id | null; demo: boolean; nurRolle?: DemoRolle; name?: string | null },
): Promise<Sitzung | null> {
  const benutzer = await repo.holeBenutzer(benutzerId);
  if (!benutzer) return null;
  const aktiv = (await repo.mitgliedschaftenVonBenutzer(benutzerId)).filter(
    (m) => m.aktiv && (optionen.nurRolle === undefined || m.rolle === optionen.nurRolle),
  );
  const mitOrg = (
    await Promise.all(aktiv.map(async (m) => ({ m, org: await repo.holeOrganisation(m.organisationId) })))
  ).filter((x): x is { m: (typeof aktiv)[number]; org: NonNullable<typeof x.org> } => x.org !== null);
  if (mitOrg.length === 0) return null;
  mitOrg.sort((a, b) => a.org.name.localeCompare(b.org.name, 'de') || a.org.id.localeCompare(b.org.id));
  const gewaehlt = mitOrg.find((x) => x.org.id === optionen.organisationId) ?? mitOrg[0];
  const organisationen: OrganisationOption[] = mitOrg.map((x) => ({ id: x.org.id, name: x.org.name, rolle: x.m.rolle }));
  return {
    benutzer: optionen.name ? { ...benutzer, name: optionen.name } : benutzer,
    organisation: gewaehlt.org,
    mitgliedschaftId: gewaehlt.m.id,
    rolle: gewaehlt.m.rolle,
    bereichIds: gewaehlt.m.rolle === 'verantwortlicher' ? gewaehlt.m.bereichIds : [],
    organisationen,
    demo: optionen.demo,
  };
}

export async function sitzungFuerDemoRolle(
  repo: Repository,
  rolle: DemoRolle,
  organisationId?: Id | null,
): Promise<Sitzung | null> {
  return sitzungFuerBenutzer(repo, DEMO_ROLLE_BENUTZER[rolle], { organisationId, demo: true, nurRolle: rolle });
}

// ---------------------------------------------------------------------------
// Lesemodelle
// ---------------------------------------------------------------------------

/** Bereiche im Geltungsbereich, alphabetisch. */
export async function listeBereiche(sitzung: Sitzung, repo: Repository): Promise<Bereich[]> {
  const bereiche = await repo.listeBereiche(sitzung.organisation.id);
  let sichtbar: Bereich[];
  if (sitzung.rolle === 'pruefer') {
    const [geraete, pruefarten] = await Promise.all([
      repo.listeGeraete(sitzung.organisation.id),
      repo.listePruefarten(sitzung.organisation.id),
    ]);
    const ids = new Set(geraete.filter((g) => geraetSichtbar(sitzung, g, pruefarten)).map((g) => g.bereichId));
    sichtbar = bereiche.filter((b) => ids.has(b.id));
  } else {
    sichtbar = bereiche.filter((b) => imGeltungsbereich(sitzung, { bereichId: b.id, zugewiesenePrueferIds: [] }));
  }
  return sichtbar.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export async function listeGeraete(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  filter: GeraeteFilter = {},
): Promise<GeraetListenEintrag[]> {
  if (!can(sitzung.rolle, 'geraet.lesen')) return [];
  const ctx = await ladeKontext(sitzung, repo);
  const suche = filter.suche?.trim().toLocaleLowerCase('de') ?? '';

  const eintraege: GeraetListenEintrag[] = [];
  for (const g of ctx.geraete.values()) {
    if (!geraetSichtbar(sitzung, g, ctx.pruefarten)) continue;
    if (filter.bereichId && g.bereichId !== filter.bereichId) continue;
    if (suche) {
      const felder = [g.bezeichnung, g.inventarnummer, g.hersteller, g.seriennummer];
      if (!felder.some((f) => f?.toLocaleLowerCase('de').includes(suche))) continue;
    }
    const eigene = ctx.pruefarten.filter((p) => p.geraetId === g.id && pruefartSichtbar(sitzung, g, p));
    const ansichten = eigene.map((p) => baueAnsicht(p, g, ctx, heute));
    const maengel = ctx.maengel.filter((m) => m.geraetId === g.id && mangelSichtbar(sitzung, m, g, ctx.pruefarten));
    const gesamt = geraetGesamt(ansichten, maengel).status;
    if (filter.status && gesamt !== filter.status) continue;
    eintraege.push({
      geraet: g,
      bereichName: ctx.bereiche.get(g.bereichId)?.name ?? '',
      gesamtStatus: gesamt,
      naechsteFaelligkeit: naechsteFaelligkeit(ansichten.map((a) => a.status)),
      offeneMaengel: maengel.filter((m) => m.status !== 'behoben').length,
      pruefarten: ansichten.map((a) => ({
        id: a.pruefart.id,
        bezeichnung: a.pruefart.bezeichnung,
        status: a.status.status,
        faelligAm: a.status.faelligAm,
      })),
    });
  }

  return eintraege.sort(
    (a, b) =>
      statusRang(a.gesamtStatus) - statusRang(b.gesamtStatus) ||
      vergleicheDatumNullZuletzt(a.naechsteFaelligkeit, b.naechsteFaelligkeit) ||
      a.geraet.bezeichnung.localeCompare(b.geraet.bezeichnung, 'de'),
  );
}

function vergleicheDatumNullZuletzt(a: IsoDate | null, b: IsoDate | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

function vergleicheDatumNullZuerst(a: IsoDate | null, b: IsoDate | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a.localeCompare(b);
}

export async function holeGeraetDetail(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  geraetId: Id,
  jetzt: Date = new Date(`${heute}T12:00:00Z`),
): Promise<GeraetDetail | null> {
  const ctx = await ladeKontext(sitzung, repo);
  const geraet = ctx.geraete.get(geraetId);
  if (!geraet || !geraetSichtbar(sitzung, geraet, ctx.pruefarten)) return null;
  const bereich = ctx.bereiche.get(geraet.bereichId);
  if (!bereich) return null;
  const sichtbar = ctx.pruefarten.filter((p) => p.geraetId === geraet.id && pruefartSichtbar(sitzung, geraet, p));
  const ansichten = sichtbar.map((p) => baueAnsicht(p, geraet, ctx, heute));
  const sichtbareIds = new Set(sichtbar.map((p) => p.id));
  const bezeichnung = new Map(sichtbar.map((p) => [p.id, p.bezeichnung]));

  const nachweise: NachweisAnsicht[] = can(sitzung.rolle, 'nachweis.lesen')
    ? ctx.nachweise
        .filter((n) => n.geraetId === geraet.id && sichtbareIds.has(n.geraetPruefartId))
        .sort(nachNeuestem)
        .map((n) => ({ ...n, pruefartBezeichnung: bezeichnung.get(n.geraetPruefartId) ?? '', pdfUrl: `/api/nachweise/${n.id}` }))
    : [];

  const sichtbareMaengel = ctx.maengel.filter((m) => m.geraetId === geraet.id && mangelSichtbar(sitzung, m, geraet, ctx.pruefarten));
  const maengel = sichtbareMaengel
    .map((m) => mangelAnsicht(m, ctx, heute))
    .sort(
      (a, b) =>
        Number(a.status === 'behoben') - Number(b.status === 'behoben') ||
        a.termin.localeCompare(b.termin) ||
        a.erfasstAm.localeCompare(b.erfasstAm),
    );
  const anlaesse = ctx.anlaesse
    .filter((a) => a.geraetId === geraet.id && sichtbareIds.has(a.geraetPruefartId))
    .map((a) => anlassAnsicht(a, ctx))
    .sort((a, b) => b.datum.localeCompare(a.datum) || b.erfasstAm.localeCompare(a.erfasstAm));

  const verlauf: Ereignis[] = can(sitzung.rolle, 'verlauf.lesen')
    ? (await repo.listeEreignisse(sitzung.organisation.id, geraet.id)).sort(
        (a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt) || b.id.localeCompare(a.id),
      )
    : [];

  const gesamt = geraetGesamt(ansichten, sichtbareMaengel);
  return {
    geraet,
    bereich,
    einsatzort: wirksamerEinsatzort(geraet, bereich),
    gesamtStatus: gesamt.status,
    gesamtStatusGrund: gesamt.grund,
    naechsteFaelligkeit: naechsteFaelligkeit(ansichten.map((a) => a.status)),
    pruefarten: ansichten,
    nachweise,
    maengel,
    anlaesse,
    verlauf,
    nutzung: await geraetNutzung(sitzung, repo, ctx, geraet, jetzt),
  };
}

/**
 * F-22/F-27: Zuordnung und aktueller Halter mit Namen für ADM, SIF, VER (Bereich); PRF → null.
 * Abgeschlossene Übernahmen nur mit uebernahmen.lesen (ADM), ≤ 90 Tage nach Ende, Person vorhanden, neueste zuerst.
 */
async function geraetNutzung(
  sitzung: Sitzung,
  repo: Repository,
  ctx: Awaited<ReturnType<typeof ladeKontext>>,
  geraet: Geraet,
  jetzt: Date,
): Promise<GeraetNutzung | null> {
  if (sitzung.rolle === 'pruefer' || sitzung.rolle === 'mitarbeiter' || !geraetImBereich(sitzung, geraet)) return null;
  const [uebernahmen, tokens] = await Promise.all([
    repo.listeUebernahmen(sitzung.organisation.id, geraet.id),
    can(sitzung.rolle, 'etikett.verwalten') ? repo.listeTokens(sitzung.organisation.id) : Promise.resolve([]),
  ]);
  const eigene = uebernahmen.filter((u) => u.geraetId === geraet.id);
  const offen = eigene.find((u) => u.bis === null && u.benutzerName !== null) ?? null;
  const zugeordnetAn = geraet.kategorie === 'personenbezogen' ? geraet.zugeordnetAn : null;
  const token = tokens.find((t) => t.geraetId === geraet.id && t.aktiv) ?? null;
  return {
    zugeordnet: zugeordnetAn
      ? { benutzerId: zugeordnetAn, name: ctx.benutzerName.get(zugeordnetAn) ?? '', rolle: 'mitarbeiter' }
      : null,
    uebernahme: offen ? { benutzerName: offen.benutzerName!, seit: offen.von } : null,
    verlauf: can(sitzung.rolle, 'uebernahmen.lesen')
      ? eigene.filter((u) => imUebernahmeVerlauf(u, jetzt)).sort((a, b) => (b.bis ?? '').localeCompare(a.bis ?? ''))
      : [],
    darfZuordnen: can(sitzung.rolle, 'geraet.zuordnen'), // Geltungsbereich oben geprüft
    etikett: can(sitzung.rolle, 'etikett.verwalten') && token ? { token: token.token, url: tokenUrl(token.token) } : null,
  };
}

/** Aus dem Katalog (freigegeben und Entwurf), alphabetisch nach Label; je Prüfart-Schlüssel ein Eintrag. */
export async function listeGeraetegruppen(repo: Repository): Promise<GeraetegruppeOption[]> {
  const katalog = (await repo.listeKatalog()).filter((k) => k.freigabestatus !== 'zurueckgezogen');
  const rang = (k: KatalogEintrag) => [k.einsatzort === null ? 0 : 1, k.freigabestatus === 'freigegeben' ? 0 : 1, -k.version];
  const bevorzugt = new Map<string, KatalogEintrag>();
  for (const k of katalog) {
    const bisher = bevorzugt.get(k.schluessel);
    if (!bisher) {
      bevorzugt.set(k.schluessel, k);
      continue;
    }
    const [a, b] = [rang(k), rang(bisher)];
    const besser = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    if (besser < 0) bevorzugt.set(k.schluessel, k);
  }
  const gruppen = new Map<string, GeraetegruppeOption>();
  for (const k of bevorzugt.values()) {
    const g = gruppen.get(k.geraetegruppe) ?? { schluessel: k.geraetegruppe, label: k.geraetegruppeLabel, pruefarten: [] };
    g.pruefarten.push({
      schluessel: k.schluessel,
      bezeichnung: k.pruefart,
      stufe: k.stufe,
      intervallMonate: k.intervallMonate,
      freigabestatus: k.freigabestatus,
    });
    gruppen.set(k.geraetegruppe, g);
  }
  return [...gruppen.values()]
    .map((g) => ({ ...g, pruefarten: g.pruefarten.sort((a, b) => a.schluessel.localeCompare(b.schluessel)) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

async function aufgabenFuer(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  nurPruefartId?: Id,
): Promise<PrueferAufgabe[]> {
  const ctx = await ladeKontext(sitzung, repo);
  const aufgaben: PrueferAufgabe[] = [];
  for (const p of ctx.pruefarten) {
    if (nurPruefartId !== undefined && p.id !== nurPruefartId) continue;
    const g = ctx.geraete.get(p.geraetId);
    if (!g || !pruefartSichtbar(sitzung, g, p)) continue;
    const ansicht = baueAnsicht(p, g, ctx, heute);
    aufgaben.push({
      pruefartAnsicht: ansicht,
      geraet: { id: g.id, bezeichnung: g.bezeichnung, inventarnummer: g.inventarnummer, hersteller: g.hersteller, typ: g.typ, seriennummer: g.seriennummer },
      bereichName: ctx.bereiche.get(g.bereichId)?.name ?? '',
      gruppe: prueferGruppe(ansicht.status.status),
    });
  }
  return aufgaben;
}

/** Nur Rolle pruefer: zugewiesene Prüfarten der aktuellen Organisation; 'faellig' vor 'spaeter', innerhalb nach faelligAm (null zuerst). */
export async function listePrueferAufgaben(sitzung: Sitzung, repo: Repository, heute: IsoDate): Promise<PrueferAufgabe[]> {
  if (!can(sitzung.rolle, 'pruefaufgaben.lesen')) return [];
  const aufgaben = await aufgabenFuer(sitzung, repo, heute);
  return aufgaben.sort(
    (a, b) =>
      (a.gruppe === b.gruppe ? 0 : a.gruppe === 'faellig' ? -1 : 1) ||
      vergleicheDatumNullZuerst(a.pruefartAnsicht.status.faelligAm, b.pruefartAnsicht.status.faelligAm) ||
      a.geraet.bezeichnung.localeCompare(b.geraet.bezeichnung, 'de'),
  );
}

/** Kontext für das Nachweisformular; null ohne Recht nachweis.erfassen auf diese Prüfart. */
export async function holeNachweisKontext(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  pruefartId: Id,
): Promise<PrueferAufgabe | null> {
  if (!can(sitzung.rolle, 'nachweis.erfassen')) return null;
  const [aufgabe] = await aufgabenFuer(sitzung, repo, heute, pruefartId);
  return aufgabe ?? null;
}

export async function holeNachweisPdf(
  sitzung: Sitzung,
  repo: Repository,
  nachweisId: Id,
): Promise<{ dateiname: string; inhalt: Uint8Array } | null> {
  if (!can(sitzung.rolle, 'nachweis.lesen')) return null;
  const nachweis = await repo.holeNachweis(nachweisId);
  if (!nachweis || nachweis.organisationId !== sitzung.organisation.id) return null;
  const [geraet, pruefart] = await Promise.all([repo.holeGeraet(nachweis.geraetId), repo.holePruefart(nachweis.geraetPruefartId)]);
  if (!geraet || !pruefart || !pruefartSichtbar(sitzung, geraet, pruefart)) return null;
  const inhalt = await repo.holeNachweisPdf(nachweis.id);
  return inhalt ? { dateiname: nachweis.pdfDateiname, inhalt } : null;
}

/** pruefer.zuweisen: aktive Mitglieder mit Rolle pruefer, alphabetisch. Sonst []. */
export async function listePrueferOptionen(sitzung: Sitzung, repo: Repository): Promise<PrueferOption[]> {
  if (!can(sitzung.rolle, 'pruefer.zuweisen')) return [];
  const [mitglieder, benutzer] = await Promise.all([
    repo.listeMitgliedschaften(sitzung.organisation.id),
    repo.listeBenutzer(sitzung.organisation.id),
  ]);
  const name = new Map(benutzer.map((b) => [b.id, b.name]));
  return mitglieder
    .filter((m) => m.aktiv && m.rolle === 'pruefer')
    .map((m) => ({ benutzerId: m.benutzerId, name: name.get(m.benutzerId) ?? '', prueferTypen: m.prueferTypen }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// ---------------------------------------------------------------------------
// Mutationen
// ---------------------------------------------------------------------------

export async function geraetAnlegen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetAnlegenEingabe,
  zeit: { heute: IsoDate; jetzt: Date },
): Promise<DienstErgebnis<{ id: Id }>> {
  if (!can(sitzung.rolle, 'geraet.anlegen')) return fehler('Keine Berechtigung, Geräte anzulegen.');
  const org = sitzung.organisation.id;
  const bereich = (await repo.listeBereiche(org)).find((b) => b.id === eingabe.bereichId);
  if (!bereich || !imGeltungsbereich(sitzung, { bereichId: bereich.id, zugewiesenePrueferIds: [] })) {
    return fehler('Bereich nicht verfügbar.', 'bereichId');
  }

  const katalog = await repo.listeKatalog();
  if (eingabe.geraetegruppe !== 'sonstiges' && !katalog.some((k) => k.geraetegruppe === eingabe.geraetegruppe)) {
    return fehler('Unbekannte Gerätegruppe.', 'geraetegruppe');
  }
  const schluessel = new Set<string>();
  for (const p of eingabe.pruefartenJson) {
    if (p.katalogSchluessel !== null) {
      if (!katalog.some((k) => k.schluessel === p.katalogSchluessel)) {
        return fehler(`Unbekannte Prüfart: ${p.katalogSchluessel}`, 'pruefartenJson');
      }
      if (schluessel.has(p.katalogSchluessel)) return fehler('Prüfart doppelt gewählt.', 'pruefartenJson');
      schluessel.add(p.katalogSchluessel);
    }
    if (p.letztePruefung !== null && p.letztePruefung > zeit.heute) {
      return fehler('Letzte Prüfung liegt in der Zukunft.', 'pruefartenJson');
    }
  }
  if (eingabe.inventarnummer) {
    const vorhanden = (await repo.listeGeraete(org)).some(
      (g) => g.inventarnummer?.toLocaleLowerCase('de') === eingabe.inventarnummer?.toLocaleLowerCase('de'),
    );
    if (vorhanden) return fehler('Inventarnummer bereits vergeben.', 'inventarnummer');
  }

  const jetzt = zeit.jetzt.toISOString();
  const geraet: Geraet = {
    id: randomUUID(),
    organisationId: org,
    bereichId: bereich.id,
    bezeichnung: eingabe.bezeichnung,
    inventarnummer: eingabe.inventarnummer,
    geraetegruppe: eingabe.geraetegruppe,
    kategorie: eingabe.kategorie,
    hersteller: eingabe.hersteller,
    typ: eingabe.typ,
    seriennummer: eingabe.seriennummer,
    baujahr: eingabe.baujahr,
    einsatzort: eingabe.einsatzort,
    betriebsstatus: 'in_betrieb',
    angelegtAm: jetzt,
    zugeordnetAn: null,
  };
  const pruefarten: GeraetPruefart[] = eingabe.pruefartenJson.map((p) => ({
    id: randomUUID(),
    organisationId: org,
    geraetId: geraet.id,
    katalogSchluessel: p.katalogSchluessel,
    bezeichnung: p.bezeichnung,
    herstellerfristMonate: p.herstellerfristMonate,
    herstellerfristQuelle: p.herstellerfristQuelle,
    frist: null,
    letztePruefung: p.letztePruefung,
    letztePruefungHerkunft: p.letztePruefung === null ? 'unbekannt' : p.letztePruefungHerkunft,
    zugewiesenerPrueferId: null,
    gbuDokument: null,
  }));
  await repo.legeGeraetAn({
    geraet,
    pruefarten,
    // F-24: genau ein aktiver Token je Gerät, entsteht beim Anlegen (Supabase: Trigger)
    token: { id: randomUUID(), organisationId: org, geraetId: geraet.id, token: neuerToken(), aktiv: true, erstelltAm: jetzt, deaktiviertAm: null },
    ereignis: {
      id: randomUUID(),
      organisationId: org,
      geraetId: geraet.id,
      typ: 'geraet_angelegt',
      akteurId: sitzung.benutzer.id,
      akteurName: sitzung.benutzer.name,
      zeitpunkt: jetzt,
      daten: { bezeichnung: geraet.bezeichnung, bereichId: bereich.id, pruefarten: pruefarten.map((p) => p.bezeichnung) },
    },
  });
  return { ok: true, id: geraet.id };
}

async function ladePruefartImBereich(sitzung: Sitzung, repo: Repository, pruefartId: Id) {
  const pruefart = await repo.holePruefart(pruefartId);
  if (!pruefart || pruefart.organisationId !== sitzung.organisation.id) return null;
  const geraet = await repo.holeGeraet(pruefart.geraetId);
  if (!geraet || !pruefartSichtbar(sitzung, geraet, pruefart)) return null;
  return { pruefart, geraet };
}

export async function fristFreigeben(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: FristFreigebenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; pruefartId: Id }>> {
  if (!can(sitzung.rolle, 'frist.freigeben')) return fehler('Keine Berechtigung, Fristen freizugeben.');
  const geladen = await ladePruefartImBereich(sitzung, repo, eingabe.geraetPruefartId);
  if (!geladen) return fehler('Prüfart nicht gefunden.');
  const { pruefart, geraet } = geladen;
  const bereich = (await repo.listeBereiche(sitzung.organisation.id)).find((b) => b.id === geraet.bereichId);
  if (!bereich) return fehler('Bereich nicht gefunden.');

  // F-13: Bezug auf einen Nachweis derselben Prüfart
  if (eingabe.nachweisId !== null) {
    const n = await repo.holeNachweis(eingabe.nachweisId);
    if (!n || n.geraetPruefartId !== pruefart.id || n.organisationId !== sitzung.organisation.id) {
      return fehler('Der Nachweis gehört nicht zu dieser Prüfart.', 'nachweisId');
    }
  }

  const katalog = await repo.listeKatalog();
  const einsatzort = wirksamerEinsatzort(geraet, bereich);
  const vorschlag = ermittleFristVorschlag({ pruefart, einsatzort, katalog });
  const ergebnis = legeFristFest(
    eingabe.modus === 'vorschlag'
      ? { modus: 'vorschlag' }
      : { modus: 'gbu', monate: eingabe.monate, fundstelle: eingabe.fundstelle, begruendung: eingabe.begruendung },
    { vorschlag, pruefart, einsatzort, katalog },
  );
  if (!ergebnis.ok) return fehler(ergebnis.fehler, eingabe.modus === 'gbu' ? 'monate' : undefined);

  const zeitpunkt = jetzt.toISOString();
  const frist: FestgelegteFrist = {
    ...ergebnis.frist,
    freigegebenVon: sitzung.benutzer.id,
    freigegebenVonName: sitzung.benutzer.name,
    freigegebenAm: zeitpunkt,
  };
  await repo.setzeFrist({
    pruefartId: pruefart.id,
    frist,
    nachweisId: eingabe.nachweisId,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'frist_freigegeben',
      {
        pruefartId: pruefart.id,
        pruefart: pruefart.bezeichnung,
        alt: pruefart.frist,
        neu: frist,
        nachweisId: eingabe.nachweisId,
        richtung: fristRichtung(pruefart.frist?.monate ?? null, frist.monate),
      },
      jetzt,
    ),
  });
  return { ok: true, geraetId: geraet.id, pruefartId: pruefart.id };
}

export interface NachweisDienstEingabe {
  geraetPruefartId: Id;
  pruefdatum: IsoDate;
  ergebnis: PruefErgebnis;
  pruefumfang: string;
  prueferName: string;
  unterschriftImPdf: true;
  pdf: { name: string; inhalt: Uint8Array };
  fristEmpfehlungMonate?: number | null; // F-13, wirkt nie selbst
}

const PDF_SIGNATUR = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export async function nachweisErfassen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: NachweisDienstEingabe,
  zeit: { heute: IsoDate; jetzt: Date },
): Promise<DienstErgebnis<{ id: Id; geraetId: Id }>> {
  if (!can(sitzung.rolle, 'nachweis.erfassen')) return fehler('Keine Berechtigung, Nachweise zu erfassen.');
  const geladen = await ladePruefartImBereich(sitzung, repo, eingabe.geraetPruefartId);
  if (!geladen) return fehler('Prüfart nicht gefunden.');
  const { pruefart, geraet } = geladen;

  if (!istIsoDate(eingabe.pruefdatum)) return fehler('Ungültiges Datum.', 'pruefdatum');
  if (eingabe.pruefdatum > zeit.heute) return fehler('Das Prüfdatum darf nicht in der Zukunft liegen.', 'pruefdatum');
  if (eingabe.unterschriftImPdf !== true) return fehler('Bitte bestätigen, dass das PDF die Unterschrift enthält.', 'unterschriftImPdf');
  const kopf = eingabe.pdf.inhalt.subarray(0, PDF_SIGNATUR.length);
  if (kopf.length < PDF_SIGNATUR.length || PDF_SIGNATUR.some((b, i) => kopf[i] !== b)) {
    return fehler('Die Datei ist kein PDF.', 'pdf');
  }

  // F-7: bestanden und neuer → letzte Prüfung fortschreiben; nicht_bestanden ändert nichts.
  const bestanden = eingabe.ergebnis !== 'nicht_bestanden';
  const neuer = pruefart.letztePruefung === null || eingabe.pruefdatum > pruefart.letztePruefung;
  const letztePruefung = bestanden && neuer ? eingabe.pruefdatum : null;

  const id = randomUUID();
  const zeitpunkt = zeit.jetzt.toISOString();
  const dateiname = eingabe.pdf.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || `${id}.pdf`;
  const nachweis: Nachweis = {
    id,
    organisationId: sitzung.organisation.id,
    geraetId: geraet.id,
    geraetPruefartId: pruefart.id,
    pruefdatum: eingabe.pruefdatum,
    ergebnis: eingabe.ergebnis,
    pruefumfang: eingabe.pruefumfang,
    prueferName: eingabe.prueferName,
    prueferBenutzerId: sitzung.rolle === 'pruefer' ? sitzung.benutzer.id : null,
    unterschriftImPdf: true,
    pdfDateiname: dateiname,
    pdfSha256: sha256Hex(eingabe.pdf.inhalt),
    fristEmpfehlungMonate: eingabe.fristEmpfehlungMonate ?? null,
    erfasstVon: sitzung.benutzer.id,
    erfasstAm: zeitpunkt,
  };
  await repo.erfasseNachweis({
    nachweis,
    pdf: eingabe.pdf.inhalt,
    letztePruefung,
    ereignis: {
      id: randomUUID(),
      organisationId: sitzung.organisation.id,
      geraetId: geraet.id,
      typ: 'nachweis_erfasst',
      akteurId: sitzung.benutzer.id,
      akteurName: sitzung.benutzer.name,
      zeitpunkt,
      daten: {
        nachweisId: id,
        pruefartId: pruefart.id,
        pruefdatum: eingabe.pruefdatum,
        ergebnis: eingabe.ergebnis,
        prueferName: eingabe.prueferName,
      },
    },
  });
  return { ok: true, id, geraetId: geraet.id };
}

// ---------------------------------------------------------------------------
// Inkrement 2: Prüfer, GBU-Verweis, Betriebsstatus, Verschieben, Anlass
// ---------------------------------------------------------------------------

/** F-15: pruefer.zuweisen + Bereich (ADM ganze Organisation, VER eigene Bereiche). Warnung blockiert nicht. */
export async function prueferZuweisen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: PrueferZuweisenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; pruefartId: Id; entfernt: boolean }>> {
  if (!can(sitzung.rolle, 'pruefer.zuweisen')) return fehler('Keine Berechtigung, Prüfer zuzuweisen.');
  const pruefart = await repo.holePruefart(eingabe.geraetPruefartId);
  const geraet = pruefart && pruefart.organisationId === sitzung.organisation.id ? await repo.holeGeraet(pruefart.geraetId) : null;
  if (!pruefart || !geraet || !geraetImBereich(sitzung, geraet)) return fehler('Prüfart nicht gefunden.');

  let neuName: string | null = null;
  if (eingabe.prueferId !== null) {
    const ctx = { mitgliedschaften: await repo.listeMitgliedschaften(sitzung.organisation.id) };
    if (!aktivesMitglied(ctx, eingabe.prueferId, ['pruefer'])) {
      return fehler('Zuweisung nur an aktive Prüfer der Organisation.', 'prueferId');
    }
    neuName = (await repo.holeBenutzer(eingabe.prueferId))?.name ?? null;
  }
  if (pruefart.zugewiesenerPrueferId === eingabe.prueferId) {
    return { ok: true, geraetId: geraet.id, pruefartId: pruefart.id, entfernt: eingabe.prueferId === null };
  }
  await repo.setzePruefer({
    pruefartId: pruefart.id,
    prueferId: eingabe.prueferId,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'pruefer_zugewiesen',
      { pruefartId: pruefart.id, pruefart: pruefart.bezeichnung, alt: pruefart.zugewiesenerPrueferId, neu: eingabe.prueferId, neuName },
      jetzt,
    ),
  });
  return { ok: true, geraetId: geraet.id, pruefartId: pruefart.id, entfernt: eingabe.prueferId === null };
}

/** F-18: frist.freigeben + Bereich. titel null = Verweis entfernen. */
export async function gbuDokumentSetzen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GbuDokumentSetzenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; pruefartId: Id }>> {
  if (!can(sitzung.rolle, 'frist.freigeben')) return fehler('Keine Berechtigung, den GBU-Verweis zu ändern.');
  const geladen = await ladePruefartImBereich(sitzung, repo, eingabe.geraetPruefartId);
  if (!geladen) return fehler('Prüfart nicht gefunden.');
  const { pruefart, geraet } = geladen;
  if (eingabe.url !== null && !eingabe.url.startsWith('https://')) return fehler('Nur https-Links.', 'url');
  if (eingabe.titel === null && eingabe.url !== null) return fehler('Link nur mit Titel.', 'titel');
  const neu: GbuDokument | null = eingabe.titel === null ? null : { titel: eingabe.titel, url: eingabe.url };
  const alt = pruefart.gbuDokument;
  if (JSON.stringify(alt) !== JSON.stringify(neu)) {
    await repo.setzeGbuDokument({
      pruefartId: pruefart.id,
      gbuDokument: neu,
      ereignis: neuesEreignis(sitzung, geraet.id, 'gbu_dokument_gesetzt', { pruefartId: pruefart.id, pruefart: pruefart.bezeichnung, alt, neu }, jetzt),
    });
  }
  return { ok: true, geraetId: geraet.id, pruefartId: pruefart.id };
}

async function ladeGeraetImBereich(sitzung: Sitzung, repo: Repository, geraetId: Id): Promise<Geraet | null> {
  const geraet = await repo.holeGeraet(geraetId);
  return geraet && geraetImBereich(sitzung, geraet) ? geraet : null;
}

/** F-11: geraet.bearbeiten + Bereich; nur in_betrieb ↔ ausser_betrieb. */
export async function betriebsstatusSetzen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: BetriebsstatusSetzenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id }>> {
  if (!can(sitzung.rolle, 'geraet.bearbeiten')) return fehler('Keine Berechtigung, Geräte zu bearbeiten.');
  if (!(WAEHLBARER_BETRIEBSSTATUS as readonly string[]).includes(eingabe.betriebsstatus)) {
    return fehler('Dieser Betriebsstatus ist nicht wählbar.', 'betriebsstatus');
  }
  const geraet = await ladeGeraetImBereich(sitzung, repo, eingabe.geraetId);
  if (!geraet) return fehler('Gerät nicht gefunden.');
  if (geraet.betriebsstatus === eingabe.betriebsstatus) return fehler('Der Betriebsstatus ist bereits gesetzt.', 'betriebsstatus');
  await repo.setzeBetriebsstatus({
    geraetId: geraet.id,
    betriebsstatus: eingabe.betriebsstatus,
    begruendung: eingabe.begruendung,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'betriebsstatus_geaendert',
      { alt: geraet.betriebsstatus, neu: eingabe.betriebsstatus, begruendung: eingabe.begruendung },
      jetzt,
    ),
  });
  return { ok: true, geraetId: geraet.id };
}

/** F-16: geraet.bearbeiten + darfVerschieben. Frist, Nachweise, Mängel, Anlässe, Zuweisungen bleiben. */
export async function geraetVerschieben(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: GeraetVerschiebenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; nochSichtbar: boolean }>> {
  if (!can(sitzung.rolle, 'geraet.bearbeiten')) return fehler('Keine Berechtigung, Geräte zu verschieben.');
  const geraet = await ladeGeraetImBereich(sitzung, repo, eingabe.geraetId);
  if (!geraet) return fehler('Gerät nicht gefunden.');
  const bereiche = await repo.listeBereiche(sitzung.organisation.id);
  const von = bereiche.find((b) => b.id === geraet.bereichId);
  const nach = bereiche.find((b) => b.id === eingabe.bereichId);
  if (!von || !nach || !darfVerschieben(sitzung, von.id, nach.id)) return fehler('Zielbereich nicht verfügbar.', 'bereichId');
  if (von.id === nach.id) return fehler('Das Gerät ist bereits in diesem Bereich.', 'bereichId');
  await repo.verschiebeGeraet({
    geraetId: geraet.id,
    bereichId: nach.id,
    begruendung: eingabe.begruendung,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'geraet_verschoben',
      { vonBereichId: von.id, vonBereich: von.name, nachBereichId: nach.id, nachBereich: nach.name, begruendung: eingabe.begruendung },
      jetzt,
    ),
  });
  return { ok: true, geraetId: geraet.id, nochSichtbar: geraetImBereich(sitzung, { ...geraet, bereichId: nach.id }) };
}

/** F-10: anlass.erfassen + Bereich; je Prüfart ein Anlass; Datum ≤ heute. */
export async function anlassErfassen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: AnlassErfassenEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ geraetId: Id; anlassIds: Id[] }>> {
  if (!can(sitzung.rolle, 'anlass.erfassen')) return fehler('Keine Berechtigung, Anlässe zu erfassen.');
  const geraet = await ladeGeraetImBereich(sitzung, repo, eingabe.geraetId);
  if (!geraet) return fehler('Gerät nicht gefunden.');
  if (!istIsoDate(eingabe.datum)) return fehler('Ungültiges Datum.', 'datum');
  if (eingabe.datum > zeit.heute) return fehler('Das Anlassdatum darf nicht in der Zukunft liegen.', 'datum');
  const pruefarten = (await repo.listePruefarten(sitzung.organisation.id)).filter((p) => p.geraetId === geraet.id);
  const ids = [...new Set(eingabe.geraetPruefartIds)];
  const gewaehlt = ids.map((id) => pruefarten.find((p) => p.id === id));
  if (ids.length === 0 || gewaehlt.some((p) => p === undefined)) {
    return fehler('Prüfarten gehören nicht zu diesem Gerät.', 'geraetPruefartIds');
  }
  const zeitpunkt = zeit.jetzt.toISOString();
  const anlaesse: Anlass[] = (gewaehlt as GeraetPruefart[]).map((p) => ({
    id: randomUUID(),
    organisationId: sitzung.organisation.id,
    geraetId: geraet.id,
    geraetPruefartId: p.id,
    art: eingabe.art,
    datum: eingabe.datum,
    beschreibung: eingabe.beschreibung,
    erfasstVon: sitzung.benutzer.id,
    erfasstVonName: sitzung.benutzer.name,
    erfasstAm: zeitpunkt,
    aufgehobenVon: null,
    aufgehobenVonName: null,
    aufgehobenAm: null,
    aufhebungsgrund: null,
  }));
  const ereignisse = anlaesse.map((a, i) =>
    neuesEreignis(
      sitzung,
      geraet.id,
      'anlass_erfasst',
      { anlassId: a.id, pruefartId: a.geraetPruefartId, pruefart: (gewaehlt[i] as GeraetPruefart).bezeichnung, art: a.art, datum: a.datum },
      zeit.jetzt,
    ),
  );
  await repo.erfasseAnlaesse({ anlaesse, ereignisse });
  return { ok: true, geraetId: geraet.id, anlassIds: anlaesse.map((a) => a.id) };
}

/** Q-25: anlass.erfassen + Bereich; nur offene Anlässe; Begründung ≥ 10 Zeichen. */
export async function anlassAufheben(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: AnlassAufhebenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; anlassId: Id }>> {
  if (!can(sitzung.rolle, 'anlass.erfassen')) return fehler('Keine Berechtigung, Anlässe aufzuheben.');
  const grund = eingabe.grund.trim();
  if (grund.length < 10) return fehler('Begründung fehlt (mindestens 10 Zeichen).', 'grund');
  const anlass = await repo.holeAnlass(eingabe.anlassId);
  if (!anlass || anlass.organisationId !== sitzung.organisation.id) return fehler('Anlass nicht gefunden.');
  const geraet = await ladeGeraetImBereich(sitzung, repo, anlass.geraetId);
  if (!geraet) return fehler('Anlass nicht gefunden.');
  const nachweise = (await repo.listeNachweise(sitzung.organisation.id)).filter((n) => n.geraetPruefartId === anlass.geraetPruefartId);
  if (!anlassErledigtDurch(anlass, nachweise).offen) return fehler('Der Anlass ist nicht mehr offen.');
  const aufgehoben: Anlass = {
    ...anlass,
    aufgehobenVon: sitzung.benutzer.id,
    aufgehobenVonName: sitzung.benutzer.name,
    aufgehobenAm: jetzt.toISOString(),
    aufhebungsgrund: grund,
  };
  await repo.hebeAnlassAuf({
    anlass: aufgehoben,
    ereignis: neuesEreignis(sitzung, geraet.id, 'anlass_aufgehoben', { anlassId: anlass.id, pruefartId: anlass.geraetPruefartId, grund }, jetzt),
  });
  return { ok: true, geraetId: geraet.id, anlassId: anlass.id };
}
