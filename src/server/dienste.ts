// Dienste (BE-5): Anwendungslogik mit explizitem Kontext (sitzung, repo, heute/jetzt) – testbar ohne Next und Cookies.
// Jede Funktion prüft Rolle (can) und Geltungsbereich selbst; Aufrufer müssen nichts vorprüfen.
import { randomUUID } from 'node:crypto';
import { istIsoDate } from '@/domain/datum';
import {
  ermittleFristVorschlag,
  legeFristFest,
  waehleKatalogEintrag,
  wirksamerEinsatzort,
} from '@/domain/fristen';
import { can, imGeltungsbereich } from '@/domain/rechte';
import type { FristFreigebenEingabe, GeraetAnlegenEingabe } from '@/domain/schemas';
import { berechneStatus, gesamtStatus, naechsteFaelligkeit, prueferGruppe, statusRang } from '@/domain/status';
import type {
  Bereich,
  DemoRolle,
  Ereignis,
  FestgelegteFrist,
  Geraet,
  GeraetDetail,
  GeraeteFilter,
  GeraetegruppeOption,
  GeraetListenEintrag,
  GeraetPruefart,
  Id,
  IsoDate,
  KatalogEintrag,
  Nachweis,
  NachweisAnsicht,
  PruefartAnsicht,
  PrueferAufgabe,
  PruefErgebnis,
  Sitzung,
} from '@/domain/types';
import { sha256Hex } from './pdf';
import { DEMO_ROLLE_BENUTZER } from './repo/demo/daten';
import type { Repository } from './repo/types';

export type DienstErgebnis<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; fehler: string; feld?: string };

const fehler = (text: string, feld?: string): { ok: false; fehler: string; feld?: string } =>
  feld ? { ok: false, fehler: text, feld } : { ok: false, fehler: text };

// ---------------------------------------------------------------------------
// Sitzung
// ---------------------------------------------------------------------------

export async function sitzungFuerDemoRolle(repo: Repository, rolle: DemoRolle): Promise<Sitzung | null> {
  const benutzer = await repo.holeBenutzer(DEMO_ROLLE_BENUTZER[rolle]);
  if (!benutzer) return null;
  const mitgliedschaft = (await repo.mitgliedschaftenVonBenutzer(benutzer.id)).find((m) => m.rolle === rolle);
  if (!mitgliedschaft) return null;
  const organisation = await repo.holeOrganisation(mitgliedschaft.organisationId);
  if (!organisation) return null;
  return {
    benutzer,
    organisation,
    mitgliedschaftId: mitgliedschaft.id,
    rolle: mitgliedschaft.rolle,
    bereichIds: mitgliedschaft.bereichIds,
    organisationen: [{ id: organisation.id, name: organisation.name, rolle: mitgliedschaft.rolle }], // BE-10/11: alle aktiven
    demo: true,
  };
}

// ---------------------------------------------------------------------------
// Geltungsbereich
// ---------------------------------------------------------------------------

/** Prüfart im Geltungsbereich (Prüfer: nur selbst zugewiesen). */
function pruefartSichtbar(sitzung: Sitzung, geraet: Geraet, pruefart: GeraetPruefart): boolean {
  if (geraet.organisationId !== sitzung.organisation.id || pruefart.geraetId !== geraet.id) return false;
  return imGeltungsbereich(sitzung, {
    bereichId: geraet.bereichId,
    zugewiesenePrueferIds: pruefart.zugewiesenerPrueferId ? [pruefart.zugewiesenerPrueferId] : [],
  });
}

function geraetSichtbar(sitzung: Sitzung, geraet: Geraet, pruefarten: readonly GeraetPruefart[]): boolean {
  if (!can(sitzung.rolle, 'geraet.lesen') || geraet.organisationId !== sitzung.organisation.id) return false;
  return imGeltungsbereich(sitzung, {
    bereichId: geraet.bereichId,
    zugewiesenePrueferIds: pruefarten
      .filter((p) => p.geraetId === geraet.id && p.zugewiesenerPrueferId !== null)
      .map((p) => p.zugewiesenerPrueferId as Id),
  });
}

// ---------------------------------------------------------------------------
// Lesemodelle
// ---------------------------------------------------------------------------

interface Kontext {
  bereiche: Map<Id, Bereich>;
  katalog: KatalogEintrag[];
  nachweise: Nachweis[];
  benutzerName: Map<Id, string>;
}

async function ladeKontext(sitzung: Sitzung, repo: Repository): Promise<Kontext> {
  const [bereiche, katalog, nachweise, benutzer] = await Promise.all([
    repo.listeBereiche(sitzung.organisation.id),
    repo.listeKatalog(),
    repo.listeNachweise(sitzung.organisation.id),
    repo.listeBenutzer(sitzung.organisation.id),
  ]);
  return {
    bereiche: new Map(bereiche.map((b) => [b.id, b])),
    katalog,
    nachweise,
    benutzerName: new Map(benutzer.map((b) => [b.id, b.name])),
  };
}

function nachNeuestem(a: Nachweis, b: Nachweis): number {
  return b.pruefdatum.localeCompare(a.pruefdatum) || b.erfasstAm.localeCompare(a.erfasstAm);
}

function baueAnsicht(pruefart: GeraetPruefart, geraet: Geraet, ctx: Kontext, heute: IsoDate): PruefartAnsicht {
  const bereich = ctx.bereiche.get(geraet.bereichId);
  if (!bereich) throw new Error(`Bereich ${geraet.bereichId} fehlt`);
  const einsatzort = wirksamerEinsatzort(geraet, bereich);
  const s = pruefart.katalogSchluessel;
  const katalogEintrag = s
    ? (waehleKatalogEintrag(ctx.katalog, s, einsatzort, 'freigegeben') ??
      waehleKatalogEintrag(ctx.katalog, s, einsatzort, 'entwurf'))
    : null;
  const letzter = ctx.nachweise.filter((n) => n.geraetPruefartId === pruefart.id).sort(nachNeuestem)[0];
  return {
    pruefart,
    vorschlag: ermittleFristVorschlag({ pruefart, einsatzort, katalog: ctx.katalog }),
    status: berechneStatus(pruefart, heute),
    katalogEintrag,
    weiterbetriebUnzulaessig: letzter?.ergebnis === 'nicht_bestanden',
    zugewiesenerPrueferName: pruefart.zugewiesenerPrueferId
      ? (ctx.benutzerName.get(pruefart.zugewiesenerPrueferId) ?? null)
      : null,
    letzterNachweis: letzter
      ? {
          id: letzter.id,
          pruefdatum: letzter.pruefdatum,
          ergebnis: letzter.ergebnis,
          fristEmpfehlungMonate: letzter.fristEmpfehlungMonate,
          erfasstAm: letzter.erfasstAm,
        }
      : null,
    // I2-Felder: Platzhalter bis BE-8/BE-10 (Qualifikation, Anlässe, Mängel, Hinweise).
    qualifikationsWarnung: null,
    offeneAnlaesse: [],
    offeneMaengel: 0,
    fristHinweis: null,
    maengelErfassenFuerNachweisId: null,
  };
}

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
  const [geraete, pruefarten, ctx] = await Promise.all([
    repo.listeGeraete(sitzung.organisation.id),
    repo.listePruefarten(sitzung.organisation.id),
    ladeKontext(sitzung, repo),
  ]);
  const suche = filter.suche?.trim().toLocaleLowerCase('de') ?? '';

  const eintraege: GeraetListenEintrag[] = [];
  for (const g of geraete) {
    if (!geraetSichtbar(sitzung, g, pruefarten)) continue;
    if (filter.bereichId && g.bereichId !== filter.bereichId) continue;
    if (suche) {
      const felder = [g.bezeichnung, g.inventarnummer, g.hersteller, g.seriennummer];
      if (!felder.some((f) => f?.toLocaleLowerCase('de').includes(suche))) continue;
    }
    const eigene = pruefarten.filter((p) => p.geraetId === g.id && pruefartSichtbar(sitzung, g, p));
    const ergebnisse = eigene.map((p) => ({ p, s: berechneStatus(p, heute) }));
    const gesamt = gesamtStatus(ergebnisse.map((e) => e.s.status));
    if (filter.status && gesamt !== filter.status) continue;
    eintraege.push({
      geraet: g,
      bereichName: ctx.bereiche.get(g.bereichId)?.name ?? '',
      gesamtStatus: gesamt,
      naechsteFaelligkeit: naechsteFaelligkeit(ergebnisse.map((e) => e.s)),
      offeneMaengel: 0, // BE-10
      pruefarten: ergebnisse.map(({ p, s }) => ({ id: p.id, bezeichnung: p.bezeichnung, status: s.status, faelligAm: s.faelligAm })),
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
): Promise<GeraetDetail | null> {
  const geraet = await repo.holeGeraet(geraetId);
  if (!geraet) return null;
  const pruefarten = (await repo.listePruefarten(sitzung.organisation.id)).filter((p) => p.geraetId === geraet.id);
  if (!geraetSichtbar(sitzung, geraet, pruefarten)) return null;

  const ctx = await ladeKontext(sitzung, repo);
  const bereich = ctx.bereiche.get(geraet.bereichId);
  if (!bereich) return null;
  const sichtbar = pruefarten.filter((p) => pruefartSichtbar(sitzung, geraet, p));
  const ansichten = sichtbar.map((p) => baueAnsicht(p, geraet, ctx, heute));
  const sichtbareIds = new Set(sichtbar.map((p) => p.id));
  const bezeichnung = new Map(sichtbar.map((p) => [p.id, p.bezeichnung]));

  const nachweise: NachweisAnsicht[] = can(sitzung.rolle, 'nachweis.lesen')
    ? ctx.nachweise
        .filter((n) => n.geraetId === geraet.id && sichtbareIds.has(n.geraetPruefartId))
        .sort(nachNeuestem)
        .map((n) => ({ ...n, pruefartBezeichnung: bezeichnung.get(n.geraetPruefartId) ?? '', pdfUrl: `/api/nachweise/${n.id}` }))
    : [];

  const verlauf: Ereignis[] = can(sitzung.rolle, 'verlauf.lesen')
    ? (await repo.listeEreignisse(sitzung.organisation.id, geraet.id)).sort(
        (a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt) || b.id.localeCompare(a.id),
      )
    : [];

  return {
    geraet,
    bereich,
    einsatzort: wirksamerEinsatzort(geraet, bereich),
    gesamtStatus: gesamtStatus(ansichten.map((a) => a.status.status)),
    gesamtStatusGrund: null, // BE-10 (F-9)
    naechsteFaelligkeit: naechsteFaelligkeit(ansichten.map((a) => a.status)),
    pruefarten: ansichten,
    nachweise,
    maengel: [], // BE-10
    anlaesse: [], // BE-10
    verlauf,
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
  const [geraete, pruefarten, ctx] = await Promise.all([
    repo.listeGeraete(sitzung.organisation.id),
    repo.listePruefarten(sitzung.organisation.id),
    ladeKontext(sitzung, repo),
  ]);
  const geraetMap = new Map(geraete.map((g) => [g.id, g]));
  const aufgaben: PrueferAufgabe[] = [];
  for (const p of pruefarten) {
    if (nurPruefartId !== undefined && p.id !== nurPruefartId) continue;
    const g = geraetMap.get(p.geraetId);
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

/** Nur Rolle pruefer: zugewiesene Prüfarten; 'faellig' vor 'spaeter', innerhalb nach faelligAm (null zuerst). */
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
  // F-13 (Nachweisbezug, Richtung) folgt mit BE-10; bis dahin nicht still verwerfen.
  if (eingabe.nachweisId !== null) return fehler('Fristfestlegung mit Nachweisbezug ist noch nicht verfügbar.', 'nachweisId');
  const geladen = await ladePruefartImBereich(sitzung, repo, eingabe.geraetPruefartId);
  if (!geladen) return fehler('Prüfart nicht gefunden.');
  const { pruefart, geraet } = geladen;
  const bereich = (await repo.listeBereiche(sitzung.organisation.id)).find((b) => b.id === geraet.bereichId);
  if (!bereich) return fehler('Bereich nicht gefunden.');

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
    nachweisId: null,
    ereignis: {
      id: randomUUID(),
      organisationId: sitzung.organisation.id,
      geraetId: geraet.id,
      typ: 'frist_freigegeben',
      akteurId: sitzung.benutzer.id,
      akteurName: sitzung.benutzer.name,
      zeitpunkt,
      daten: { pruefartId: pruefart.id, pruefart: pruefart.bezeichnung, alt: pruefart.frist, neu: frist },
    },
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
