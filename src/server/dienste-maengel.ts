// Mängel (BE-10, F-14): Lesen, Erfassen, Kenntnisnahme, Behebung. Kein Löschen, kein Rückweg.
import { randomUUID } from 'node:crypto';
import { istIsoDate } from '@/domain/datum';
import { istMangelOffen, mangelUebergangErlaubt } from '@/domain/maengel';
import { can } from '@/domain/rechte';
import type { MangelBehebenEingabe, MangelErfassenEingabe, MangelKenntnisEingabe } from '@/domain/schemas';
import type {
  Id,
  IsoDate,
  Mangel,
  MangelAnsicht,
  MangelFilter,
  MangelFormularKontext,
  PersonOption,
  Sitzung,
} from '@/domain/types';
import {
  aktivesMitglied,
  datumVon,
  fehler,
  geraetImBereich,
  geraetSichtbar,
  ladeKontext,
  mangelAnsicht,
  mangelSichtbar,
  mangelSortierung,
  neuesEreignis,
  pruefartSichtbar,
  type DienstErgebnis,
  type Kontext,
  type Zeit,
} from './dienste-basis';
import type { Repository } from './repo/types';

const VERANTWORTLICHE_ROLLEN = ['admin', 'sifa', 'verantwortlicher'] as const;

function sichtbareMaengel(sitzung: Sitzung, ctx: Kontext): Mangel[] {
  return ctx.maengel.filter((m) => {
    const g = ctx.geraete.get(m.geraetId);
    return g !== undefined && mangelSichtbar(sitzung, m, g, ctx.pruefarten);
  });
}

/** mangel.lesen + Geltungsbereich. Default-Filter 'offen' = offen + in_bearbeitung. Sortierung: Schwere, Termin, Erfassung. */
export async function listeMaengel(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  filter: MangelFilter = {},
): Promise<MangelAnsicht[]> {
  if (!can(sitzung.rolle, 'mangel.lesen')) return [];
  const ctx = await ladeKontext(sitzung, repo);
  const status = filter.status ?? 'offen';
  return sichtbareMaengel(sitzung, ctx)
    .filter((m) => (status === 'alle' ? true : status === 'offen' ? istMangelOffen(m) : m.status === 'behoben'))
    .filter((m) => !filter.schwere || m.schwere === filter.schwere)
    .filter((m) => !filter.bereichId || ctx.geraete.get(m.geraetId)?.bereichId === filter.bereichId)
    .sort(mangelSortierung)
    .map((m) => mangelAnsicht(m, ctx, heute));
}

export async function holeMangel(sitzung: Sitzung, repo: Repository, heute: IsoDate, mangelId: Id): Promise<MangelAnsicht | null> {
  if (!can(sitzung.rolle, 'mangel.lesen')) return null;
  const ctx = await ladeKontext(sitzung, repo);
  const m = sichtbareMaengel(sitzung, ctx).find((x) => x.id === mangelId);
  return m ? mangelAnsicht(m, ctx, heute) : null;
}

/** mangel.bearbeiten (bzw. Erfassung durch SIF/VER): aktive Mitglieder mit Rolle admin, sifa, verantwortlicher; alphabetisch. */
export async function listeMangelVerantwortliche(sitzung: Sitzung, repo: Repository): Promise<PersonOption[]> {
  if (!can(sitzung.rolle, 'mangel.bearbeiten')) return [];
  const [mitglieder, benutzer] = await Promise.all([
    repo.listeMitgliedschaften(sitzung.organisation.id),
    repo.listeBenutzer(sitzung.organisation.id),
  ]);
  const name = new Map(benutzer.map((b) => [b.id, b.name]));
  return mitglieder
    .filter((m) => m.aktiv && (VERANTWORTLICHE_ROLLEN as readonly string[]).includes(m.rolle))
    .map((m) => ({ benutzerId: m.benutzerId, name: name.get(m.benutzerId) ?? '', rolle: m.rolle }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** mangel.erfassen + Gerät im Geltungsbereich; nachweisId muss zum Gerät und zu einer sichtbaren Prüfart gehören. */
export async function holeMangelFormular(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  geraetId: Id,
  vorbelegung: { geraetPruefartId?: Id; nachweisId?: Id } = {},
): Promise<MangelFormularKontext | null> {
  if (!can(sitzung.rolle, 'mangel.erfassen')) return null;
  const ctx = await ladeKontext(sitzung, repo);
  const geraet = ctx.geraete.get(geraetId);
  if (!geraet || !geraetSichtbar(sitzung, geraet, ctx.pruefarten)) return null;
  const pruefarten = ctx.pruefarten.filter((p) => p.geraetId === geraet.id && pruefartSichtbar(sitzung, geraet, p));
  if (sitzung.rolle === 'pruefer' && pruefarten.length === 0) return null;

  let nachweis: MangelFormularKontext['nachweis'] = null;
  if (vorbelegung.nachweisId) {
    const n = ctx.nachweise.find((x) => x.id === vorbelegung.nachweisId);
    if (!n || n.geraetId !== geraet.id || !pruefarten.some((p) => p.id === n.geraetPruefartId)) return null;
    nachweis = { id: n.id, geraetPruefartId: n.geraetPruefartId, pruefdatum: n.pruefdatum, ergebnis: n.ergebnis };
  }
  const wunsch = vorbelegung.geraetPruefartId && pruefarten.some((p) => p.id === vorbelegung.geraetPruefartId)
    ? vorbelegung.geraetPruefartId
    : null;
  return {
    geraet: { id: geraet.id, bezeichnung: geraet.bezeichnung, inventarnummer: geraet.inventarnummer },
    bereichName: ctx.bereiche.get(geraet.bereichId)?.name ?? '',
    pruefarten: pruefarten.map((p) => ({ id: p.id, bezeichnung: p.bezeichnung })),
    nachweis,
    vorbelegtePruefartId: nachweis?.geraetPruefartId ?? wunsch,
    verantwortliche: sitzung.rolle === 'pruefer' ? [] : await listeMangelVerantwortliche(sitzung, repo),
    heute,
  };
}

/** F-14: mangel.erfassen. Prüfer nur an zugewiesener Prüfart, ohne Verantwortlichen; SIF/VER mit Verantwortlichem. */
export async function mangelErfassen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MangelErfassenEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ id: Id; geraetId: Id }>> {
  if (!can(sitzung.rolle, 'mangel.erfassen')) return fehler('Keine Berechtigung, Mängel zu erfassen.');
  const ctx = await ladeKontext(sitzung, repo);
  const geraet = ctx.geraete.get(eingabe.geraetId);
  if (!geraet || !geraetSichtbar(sitzung, geraet, ctx.pruefarten)) return fehler('Gerät nicht gefunden.');
  const istPruefer = sitzung.rolle === 'pruefer';

  let pruefartId = eingabe.geraetPruefartId;
  if (eingabe.nachweisId !== null) {
    const n = ctx.nachweise.find((x) => x.id === eingabe.nachweisId);
    if (!n || n.geraetId !== geraet.id) return fehler('Der Nachweis gehört nicht zu diesem Gerät.', 'nachweisId');
    if (pruefartId !== null && pruefartId !== n.geraetPruefartId) {
      return fehler('Die Prüfart passt nicht zum Nachweis.', 'geraetPruefartId');
    }
    pruefartId = n.geraetPruefartId;
  }
  if (pruefartId !== null) {
    const p = ctx.pruefarten.find((x) => x.id === pruefartId);
    if (!p || !pruefartSichtbar(sitzung, geraet, p)) return fehler('Prüfart nicht verfügbar.', 'geraetPruefartId');
  } else if (istPruefer) {
    return fehler('Bitte die Prüfart wählen.', 'geraetPruefartId');
  }
  if (!istPruefer && !geraetImBereich(sitzung, geraet)) return fehler('Gerät nicht gefunden.');

  if (!istIsoDate(eingabe.termin)) return fehler('Ungültiges Datum.', 'termin');
  if (eingabe.termin < zeit.heute) return fehler('Der Termin darf nicht in der Vergangenheit liegen.', 'termin');

  const verantwortlichId = istPruefer ? null : eingabe.verantwortlichId;
  if (!istPruefer) {
    if (verantwortlichId === null) return fehler('Bitte einen Verantwortlichen wählen.', 'verantwortlichId');
    if (!aktivesMitglied(ctx, verantwortlichId, VERANTWORTLICHE_ROLLEN)) {
      return fehler('Verantwortlich können nur aktive Admins, Sifas oder Verantwortliche sein.', 'verantwortlichId');
    }
  }

  const zeitpunkt = zeit.jetzt.toISOString();
  const mangel: Mangel = {
    id: randomUUID(),
    organisationId: sitzung.organisation.id,
    geraetId: geraet.id,
    geraetPruefartId: pruefartId,
    nachweisId: eingabe.nachweisId,
    beschreibung: eingabe.beschreibung,
    schwere: eingabe.schwere,
    termin: eingabe.termin,
    status: 'offen',
    verantwortlichId,
    erfasstVon: sitzung.benutzer.id,
    erfasstVonName: sitzung.benutzer.name,
    erfasstAm: zeitpunkt,
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
      geraet.id,
      'mangel_erfasst',
      { mangelId: mangel.id, pruefartId, nachweisId: mangel.nachweisId, schwere: mangel.schwere, termin: mangel.termin },
      zeit.jetzt,
    ),
  });
  return { ok: true, id: mangel.id, geraetId: geraet.id };
}

async function ladeMangelZumBearbeiten(sitzung: Sitzung, repo: Repository, mangelId: Id) {
  if (!can(sitzung.rolle, 'mangel.bearbeiten')) return null;
  const m = await repo.holeMangel(mangelId);
  if (!m || m.organisationId !== sitzung.organisation.id) return null;
  const g = await repo.holeGeraet(m.geraetId);
  return g && geraetImBereich(sitzung, g) ? { mangel: m, geraet: g } : null;
}

/** F-14: Kenntnisnahme (offen → in_bearbeitung) mit Verantwortlichem und Termin ≥ heute. */
export async function mangelKenntnisNehmen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MangelKenntnisEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ id: Id; geraetId: Id }>> {
  if (!can(sitzung.rolle, 'mangel.bearbeiten')) return fehler('Keine Berechtigung, Mängel zu bearbeiten.');
  const geladen = await ladeMangelZumBearbeiten(sitzung, repo, eingabe.mangelId);
  if (!geladen) return fehler('Mangel nicht gefunden.');
  const { mangel, geraet } = geladen;
  if (!mangelUebergangErlaubt(mangel.status, 'in_bearbeitung')) return fehler('Nur offene Mängel können zur Kenntnis genommen werden.');
  const mitglieder = { mitgliedschaften: await repo.listeMitgliedschaften(sitzung.organisation.id) };
  if (!aktivesMitglied(mitglieder, eingabe.verantwortlichId, VERANTWORTLICHE_ROLLEN)) {
    return fehler('Verantwortlich können nur aktive Admins, Sifas oder Verantwortliche sein.', 'verantwortlichId');
  }
  if (!istIsoDate(eingabe.termin)) return fehler('Ungültiges Datum.', 'termin');
  if (eingabe.termin < zeit.heute) return fehler('Der Termin darf nicht in der Vergangenheit liegen.', 'termin');
  const verantwortlichName = (await repo.holeBenutzer(eingabe.verantwortlichId))?.name ?? null;
  const neu: Mangel = {
    ...mangel,
    status: 'in_bearbeitung',
    verantwortlichId: eingabe.verantwortlichId,
    termin: eingabe.termin,
    kenntnisVon: sitzung.benutzer.id,
    kenntnisVonName: sitzung.benutzer.name,
    kenntnisAm: zeit.jetzt.toISOString(),
  };
  await repo.aktualisiereMangel({
    mangel: neu,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'mangel_kenntnis',
      { mangelId: mangel.id, verantwortlichId: neu.verantwortlichId, verantwortlichName, terminAlt: mangel.termin, terminNeu: neu.termin },
      zeit.jetzt,
    ),
  });
  return { ok: true, id: mangel.id, geraetId: geraet.id };
}

/** F-14: Behebung (offen/in_bearbeitung → behoben); Datum ≤ heute und ≥ Erfassungsdatum. */
export async function mangelBeheben(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MangelBehebenEingabe,
  zeit: Zeit,
): Promise<DienstErgebnis<{ id: Id; geraetId: Id }>> {
  if (!can(sitzung.rolle, 'mangel.bearbeiten')) return fehler('Keine Berechtigung, Mängel zu bearbeiten.');
  const geladen = await ladeMangelZumBearbeiten(sitzung, repo, eingabe.mangelId);
  if (!geladen) return fehler('Mangel nicht gefunden.');
  const { mangel, geraet } = geladen;
  if (!mangelUebergangErlaubt(mangel.status, 'behoben')) return fehler('Der Mangel ist bereits behoben.');
  if (!istIsoDate(eingabe.behobenAm)) return fehler('Ungültiges Datum.', 'behobenAm');
  if (eingabe.behobenAm > zeit.heute) return fehler('Das Behebungsdatum darf nicht in der Zukunft liegen.', 'behobenAm');
  if (eingabe.behobenAm < datumVon(mangel.erfasstAm)) {
    return fehler('Das Behebungsdatum liegt vor der Erfassung des Mangels.', 'behobenAm');
  }
  const neu: Mangel = {
    ...mangel,
    status: 'behoben',
    behobenAm: eingabe.behobenAm,
    behobenDurch: eingabe.behobenDurch,
    behebung: eingabe.behebung,
    behebungErfasstVon: sitzung.benutzer.id,
    behebungErfasstVonName: sitzung.benutzer.name,
    behebungErfasstAm: zeit.jetzt.toISOString(),
  };
  await repo.aktualisiereMangel({
    mangel: neu,
    ereignis: neuesEreignis(
      sitzung,
      geraet.id,
      'mangel_behoben',
      { mangelId: mangel.id, behobenAm: neu.behobenAm, behobenDurch: neu.behobenDurch },
      zeit.jetzt,
    ),
  });
  return { ok: true, id: mangel.id, geraetId: geraet.id };
}
