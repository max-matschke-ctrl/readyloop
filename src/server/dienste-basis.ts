// Gemeinsame Bausteine der Dienste (BE-10): Ergebnis-Typ, Geltungsbereich, Kontext, Lesemodelle.
// Rein serverseitig, ohne Next-Abhängigkeit; testbar mit dem Demo-Repository.
import { randomUUID } from 'node:crypto';
import { anlassErledigtDurch } from '@/domain/anlass';
import { heuteBerlin } from '@/domain/datum';
import { ermittleFristVorschlag, waehleKatalogEintrag, wirksamerEinsatzort } from '@/domain/fristen';
import { istMangelOffen, terminUeberschritten } from '@/domain/maengel';
import { qualifikationsWarnung } from '@/domain/qualifikation';
import { can, imGeltungsbereich } from '@/domain/rechte';
import { berechneStatusImKontext, gesamtStatus } from '@/domain/status';
import {
  MANGEL_SCHWEREN,
  VOR_NUTZUNG_GRUENDE,
  type Anlass,
  type AnlassAnsicht,
  type Bereich,
  type Ereignis,
  type EreignisTyp,
  type FristStatus,
  type Geraet,
  type GeraetPruefart,
  type Id,
  type IsoDate,
  type KatalogEintrag,
  type Mangel,
  type MangelAnsicht,
  type Mitgliedschaft,
  type Nachweis,
  type PruefartAnsicht,
  type PrueferTyp,
  type Sitzung,
  type VorNutzungGrund,
} from '@/domain/types';
import type { Repository } from './repo/types';

export type DienstErgebnis<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; fehler: string; feld?: string };

export const fehler = (text: string, feld?: string): { ok: false; fehler: string; feld?: string } =>
  feld ? { ok: false, fehler: text, feld } : { ok: false, fehler: text };

export interface Zeit {
  heute: IsoDate;
  jetzt: Date;
}

export function neuesEreignis(
  sitzung: Sitzung,
  geraetId: Id | null,
  typ: EreignisTyp,
  daten: Record<string, unknown>,
  jetzt: Date,
): Ereignis {
  return {
    id: randomUUID(),
    organisationId: sitzung.organisation.id,
    geraetId,
    typ,
    akteurId: sitzung.benutzer.id,
    akteurName: sitzung.benutzer.name,
    zeitpunkt: jetzt.toISOString(),
    daten,
  };
}

// ---------------------------------------------------------------------------
// Geltungsbereich
// ---------------------------------------------------------------------------

/** Prüfart im Geltungsbereich (Prüfer: nur selbst zugewiesen). */
export function pruefartSichtbar(sitzung: Sitzung, geraet: Geraet, pruefart: GeraetPruefart): boolean {
  if (geraet.organisationId !== sitzung.organisation.id || pruefart.geraetId !== geraet.id) return false;
  return imGeltungsbereich(sitzung, {
    bereichId: geraet.bereichId,
    zugewiesenePrueferIds: pruefart.zugewiesenerPrueferId ? [pruefart.zugewiesenerPrueferId] : [],
  });
}

export function geraetSichtbar(sitzung: Sitzung, geraet: Geraet, pruefarten: readonly GeraetPruefart[]): boolean {
  if (!can(sitzung.rolle, 'geraet.lesen') || geraet.organisationId !== sitzung.organisation.id) return false;
  return imGeltungsbereich(sitzung, {
    bereichId: geraet.bereichId,
    zugewiesenePrueferIds: pruefarten
      .filter((p) => p.geraetId === geraet.id && p.zugewiesenerPrueferId !== null)
      .map((p) => p.zugewiesenerPrueferId as Id),
  });
}

/** Gerät im Bereich der Sitzung ohne Prüfer-Zuweisung (admin/sifa ganze Organisation, VER eigene Bereiche). */
export function geraetImBereich(sitzung: Sitzung, geraet: Geraet): boolean {
  return (
    geraet.organisationId === sitzung.organisation.id &&
    imGeltungsbereich(sitzung, { bereichId: geraet.bereichId, zugewiesenePrueferIds: [] })
  );
}

/** mangel.lesen: admin/sifa alles, VER Bereich, Prüfer nur Mängel zugewiesener Prüfarten. */
export function mangelSichtbar(sitzung: Sitzung, mangel: Mangel, geraet: Geraet, pruefarten: readonly GeraetPruefart[]): boolean {
  if (!can(sitzung.rolle, 'mangel.lesen') || mangel.organisationId !== sitzung.organisation.id) return false;
  if (mangel.geraetId !== geraet.id) return false;
  if (sitzung.rolle === 'pruefer') {
    const p = mangel.geraetPruefartId ? pruefarten.find((x) => x.id === mangel.geraetPruefartId) : undefined;
    return p !== undefined && p.zugewiesenerPrueferId === sitzung.benutzer.id;
  }
  return geraetImBereich(sitzung, geraet);
}

// ---------------------------------------------------------------------------
// Kontext
// ---------------------------------------------------------------------------

export interface Kontext {
  bereiche: Map<Id, Bereich>;
  geraete: Map<Id, Geraet>;
  pruefarten: GeraetPruefart[];
  katalog: KatalogEintrag[];
  nachweise: Nachweis[];
  anlaesse: Anlass[];
  maengel: Mangel[];
  mitgliedschaften: Mitgliedschaft[];
  benutzerName: Map<Id, string>;
}

export async function ladeKontext(sitzung: Sitzung, repo: Repository): Promise<Kontext> {
  const org = sitzung.organisation.id;
  const [bereiche, geraete, pruefarten, katalog, nachweise, anlaesse, maengel, mitgliedschaften, benutzer] = await Promise.all([
    repo.listeBereiche(org),
    repo.listeGeraete(org),
    repo.listePruefarten(org),
    repo.listeKatalog(),
    repo.listeNachweise(org),
    repo.listeAnlaesse(org),
    repo.listeMaengel(org),
    repo.listeMitgliedschaften(org),
    repo.listeBenutzer(org),
  ]);
  return {
    bereiche: new Map(bereiche.map((b) => [b.id, b])),
    geraete: new Map(geraete.map((g) => [g.id, g])),
    pruefarten,
    katalog,
    nachweise,
    anlaesse,
    maengel,
    mitgliedschaften,
    benutzerName: new Map(benutzer.map((b) => [b.id, b.name])),
  };
}

export function nachNeuestem(a: Nachweis, b: Nachweis): number {
  return b.pruefdatum.localeCompare(a.pruefdatum) || b.erfasstAm.localeCompare(a.erfasstAm);
}

/** Aktive Mitgliedschaft eines Benutzers mit einer der Rollen. */
export function aktivesMitglied(ctx: Pick<Kontext, 'mitgliedschaften'>, benutzerId: Id, rollen: readonly string[]): Mitgliedschaft | null {
  return ctx.mitgliedschaften.find((m) => m.benutzerId === benutzerId && m.aktiv && rollen.includes(m.rolle)) ?? null;
}

function prueferTypenVon(ctx: Kontext, benutzerId: Id): PrueferTyp[] {
  return ctx.mitgliedschaften.find((m) => m.benutzerId === benutzerId && m.rolle === 'pruefer')?.prueferTypen ?? [];
}

// ---------------------------------------------------------------------------
// Lesemodelle
// ---------------------------------------------------------------------------

export function anlassAnsicht(anlass: Anlass, ctx: Kontext): AnlassAnsicht {
  const e = anlassErledigtDurch(anlass, ctx.nachweise);
  return {
    ...anlass,
    pruefartBezeichnung: ctx.pruefarten.find((p) => p.id === anlass.geraetPruefartId)?.bezeichnung ?? '',
    offen: e.offen,
    erledigtDurchNachweisId: e.nachweisId,
  };
}

export function mangelAnsicht(m: Mangel, ctx: Kontext, heute: IsoDate): MangelAnsicht {
  const g = ctx.geraete.get(m.geraetId);
  return {
    ...m,
    geraetBezeichnung: g?.bezeichnung ?? '',
    inventarnummer: g?.inventarnummer ?? null,
    bereichId: g?.bereichId ?? '',
    bereichName: (g && ctx.bereiche.get(g.bereichId)?.name) ?? '',
    pruefartBezeichnung: m.geraetPruefartId
      ? (ctx.pruefarten.find((p) => p.id === m.geraetPruefartId)?.bezeichnung ?? null)
      : null,
    verantwortlichName: m.verantwortlichId ? (ctx.benutzerName.get(m.verantwortlichId) ?? null) : null,
    terminUeberschritten: terminUeberschritten(m, heute),
  };
}

/** Sortierung Mängelliste: Schwere, Termin aufsteigend, Erfassung. */
export function mangelSortierung(a: Mangel, b: Mangel): number {
  return (
    MANGEL_SCHWEREN.indexOf(a.schwere) - MANGEL_SCHWEREN.indexOf(b.schwere) ||
    a.termin.localeCompare(b.termin) ||
    a.erfasstAm.localeCompare(b.erfasstAm)
  );
}

export function baueAnsicht(pruefart: GeraetPruefart, geraet: Geraet, ctx: Kontext, heute: IsoDate): PruefartAnsicht {
  const bereich = ctx.bereiche.get(geraet.bereichId);
  if (!bereich) throw new Error(`Bereich ${geraet.bereichId} fehlt`);
  const einsatzort = wirksamerEinsatzort(geraet, bereich);
  const s = pruefart.katalogSchluessel;
  const katalogEintrag = s
    ? (waehleKatalogEintrag(ctx.katalog, s, einsatzort, 'freigegeben') ??
      waehleKatalogEintrag(ctx.katalog, s, einsatzort, 'entwurf'))
    : null;
  const eigeneNachweise = ctx.nachweise.filter((n) => n.geraetPruefartId === pruefart.id).sort(nachNeuestem);
  const letzter = eigeneNachweise[0];
  const offeneAnlaesse = ctx.anlaesse
    .filter((a) => a.geraetPruefartId === pruefart.id)
    .map((a) => anlassAnsicht(a, ctx))
    .filter((a) => a.offen)
    .sort((a, b) => b.datum.localeCompare(a.datum));
  const vorschlag = ermittleFristVorschlag({ pruefart, einsatzort, katalog: ctx.katalog });
  const status = berechneStatusImKontext(pruefart, heute, {
    betriebsstatus: geraet.betriebsstatus,
    anlassOffen: offeneAnlaesse.length > 0,
    nichtBestanden: letzter?.ergebnis === 'nicht_bestanden',
  });

  // F-13/F-16: Hinweise zur Frist
  let fristHinweis: PruefartAnsicht['fristHinweis'] = null;
  if (
    letzter?.fristEmpfehlungMonate != null &&
    letzter.fristEmpfehlungMonate !== pruefart.frist?.monate &&
    (pruefart.frist === null || pruefart.frist.freigegebenAm < letzter.erfasstAm)
  ) {
    fristHinweis = 'empfehlung_abweichend';
  } else if (
    pruefart.frist !== null &&
    (vorschlag.art === 'katalog' || vorschlag.art === 'hersteller') &&
    vorschlag.monate < pruefart.frist.monate
  ) {
    fristHinweis = 'kuerzerer_vorschlag';
  }

  const zugewiesen = pruefart.zugewiesenerPrueferId;
  return {
    pruefart,
    vorschlag,
    status,
    katalogEintrag,
    weiterbetriebUnzulaessig: letzter?.ergebnis === 'nicht_bestanden',
    zugewiesenerPrueferName: zugewiesen ? (ctx.benutzerName.get(zugewiesen) ?? null) : null,
    zugewiesenerPrueferAktiv: zugewiesen !== null && aktivesMitglied(ctx, zugewiesen, ['pruefer']) !== null,
    qualifikationsWarnung: zugewiesen
      ? qualifikationsWarnung(prueferTypenVon(ctx, zugewiesen), katalogEintrag?.prueferTypen ?? null)
      : null,
    offeneAnlaesse,
    offeneMaengel: ctx.maengel.filter((m) => m.geraetPruefartId === pruefart.id && istMangelOffen(m)).length,
    letzterNachweis: letzter
      ? {
          id: letzter.id,
          pruefdatum: letzter.pruefdatum,
          ergebnis: letzter.ergebnis,
          fristEmpfehlungMonate: letzter.fristEmpfehlungMonate,
          erfasstAm: letzter.erfasstAm,
        }
      : null,
    fristHinweis,
    maengelErfassenFuerNachweisId:
      letzter && letzter.ergebnis !== 'ohne_maengel' && !ctx.maengel.some((m) => m.nachweisId === letzter.id)
        ? letzter.id
        : null,
  };
}

/** F-9: Gesamtstatus aus sichtbaren Prüfarten und sichtbaren Mängeln, mit Grund bei vor_nutzung_pruefen. */
export function geraetGesamt(
  ansichten: readonly Pick<PruefartAnsicht, 'status'>[],
  sichtbareMaengel: readonly Mangel[],
): { status: FristStatus; grund: VorNutzungGrund | null } {
  const gefaehrlich = sichtbareMaengel.some((m) => m.schwere === 'gefaehrlich' && istMangelOffen(m));
  const status = gesamtStatus(
    ansichten.map((a) => a.status.status),
    gefaehrlich,
  );
  if (status !== 'vor_nutzung_pruefen') return { status, grund: null };
  const gruende = new Set<VorNutzungGrund>(ansichten.map((a) => a.status.grund).filter((g): g is VorNutzungGrund => !!g));
  if (gefaehrlich) gruende.add('gefaehrlicher_mangel');
  return { status, grund: VOR_NUTZUNG_GRUENDE.find((g) => gruende.has(g)) ?? null };
}

/** Datum einer Erfassung (UTC-Zeitpunkt) in Europe/Berlin. */
export function datumVon(zeitpunkt: string): IsoDate {
  return heuteBerlin(new Date(zeitpunkt));
}
