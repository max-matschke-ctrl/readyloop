// BE-17: Dienste I3M gegen das Demo-Repository (Abnahme docs/backlog.md §6 BE-17), inkl. negativer Fälle (F-27).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTage } from '@/domain/datum';
import { geraetAnlegenSchema } from '@/domain/schemas';
import { ETIKETTEN_MAX, type DemoRolle, type Sitzung } from '@/domain/types';
import { geraetAnlegen, holeGeraetDetail, listeGeraete, sitzungFuerBenutzer, sitzungFuerDemoRolle } from '@/server/dienste';
import { etikettErneuern, holeEtiketten } from '@/server/dienste-etiketten';
import { holeMangelFormular, listeMaengel, mangelErfassen } from '@/server/dienste-maengel';
import {
  geraetUebernehmen,
  geraetZuordnen,
  geraetZurueckgeben,
  holeMangelMeldung,
  holeTokenSeite,
  listeMeineGeraete,
  listeMitarbeiterOptionen,
  mangelMelden,
  SCHON_UEBERNOMMEN,
  sucheGeraete,
  uebernahmeBeenden,
} from '@/server/dienste-mitarbeiter';
import { listeMitarbeiter, mitarbeiterEinladen, mitgliedAendern, mitgliedEinladen } from '@/server/dienste-verwaltung';
import { DEMO_BENUTZER_IDS, DEMO_BEREICH_IDS, DEMO_ORG2_ID, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { erzeugeDemoRepository, type DemoRepository } from '@/server/repo/demo/repository';
import { alleUebernahmen } from './hilfen/demo-stand';

const HEUTE = '2026-11-19';
const JETZT = new Date('2026-11-19T10:00:00Z');
const ZEIT = { heute: HEUTE, jetzt: JETZT };
let repo: DemoRepository;
beforeEach(() => {
  repo = erzeugeDemoRepository(HEUTE);
});

const sitzung = async (rolle: DemoRolle): Promise<Sitzung> => (await sitzungFuerDemoRolle(repo, rolle))!;
const jonas = () => sitzung('mitarbeiter');
const aylin = async () => (await sitzungFuerBenutzer(repo, DEMO_BENUTZER_IDS.aylin, { demo: true }))!;
const idVon = async (inv: string, org = DEMO_ORG_ID) => (await repo.listeGeraete(org)).find((g) => g.inventarnummer === inv)!.id;
const aktion = async (inv: string) => ({ geraetId: await idVon(inv) });
const NAMEN = ['Katrin Vogel', 'Dr. Jens Hartmann', 'Marco Lindner', 'Sabine Krüger', 'Jonas Richter', 'Aylin Demir'];
/** JSON ohne Prüfernamen (Pflichtinhalt § 14 Abs. 7 BetrSichV, ausdrücklich erlaubt). */
const ohnePruefer = (x: unknown) => JSON.stringify(x, (k, v) => (k === 'prueferName' ? undefined : v));

describe('listeMeineGeraete', () => {
  it('Jonas → 3 Geräte, L-008 zuerst mit nicht_verwenden', async () => {
    const liste = await listeMeineGeraete(await jonas(), repo, HEUTE);
    expect(liste.map((g) => g.inventarnummer)).toEqual(['L-008', 'L-002', 'P-008']);
    expect(liste[0]).toMatchObject({ nutzung: 'nicht_verwenden', gesamtStatus: 'ueberfaellig', bezug: 'uebernommen' });
    expect(liste[0].uebernommenSeit).not.toBeNull();
    expect(liste.find((g) => g.inventarnummer === 'P-008')).toMatchObject({ bezug: 'zugeordnet', uebernommenSeit: null, zugeordnetMir: true, uebernahme: null });
    expect(liste[0].pruefarten[0].frist).toMatchObject({ monate: 12, quelle: 'gbu', stufe: 'C' });
  });
  it('Aylin → 1 (P-003)', async () => {
    expect((await listeMeineGeraete(await aylin(), repo, HEUTE)).map((g) => g.inventarnummer)).toEqual(['P-003']);
  });
  it('andere Rollen → []', async () => {
    expect(await listeMeineGeraete(await sitzung('verantwortlicher'), repo, HEUTE)).toEqual([]);
  });
  it('MA sieht keine Namen anderer Halter, Melder oder Freigebender', async () => {
    const text = ohnePruefer([
      await listeMeineGeraete(await jonas(), repo, HEUTE),
      await sucheGeraete(await jonas(), repo, HEUTE, 'bohr'),
      await sucheGeraete(await aylin(), repo, HEUTE, 'leiter'),
    ]);
    for (const n of NAMEN) expect(text).not.toContain(n);
  });
});

describe('geraetUebernehmen', () => {
  it('L-001 (überfällig) → Fehler nicht verwenden', async () => {
    const r = await geraetUebernehmen(await jonas(), repo, await aktion('L-001'), ZEIT);
    expect(r).toMatchObject({ ok: false, fehler: expect.stringContaining('nicht verwenden') });
  });
  it('L-003 (ortsgebunden) → Fehler nicht wechselnd', async () => {
    const r = await geraetUebernehmen(await jonas(), repo, await aktion('L-003'), ZEIT);
    expect(r).toMatchObject({ ok: false, fehler: 'Nur Geräte mit wechselndem Einsatzort werden übernommen.' });
  });
  it('V-003 (außer Betrieb) → Fehler', async () => {
    expect((await geraetUebernehmen(await jonas(), repo, await aktion('V-003'), ZEIT)).ok).toBe(false);
  });
  it('P-003 durch Jonas → ok, Aylins Übernahme uebergabe, Aylin hat 0 Geräte', async () => {
    const r = await geraetUebernehmen(await jonas(), repo, await aktion('P-003'), ZEIT);
    expect(r).toMatchObject({ ok: true, vorherigeBeendet: true });
    const u = await alleUebernahmen(repo, DEMO_ORG_ID, await idVon('P-003'));
    expect(u.find((x) => x.benutzerId === DEMO_BENUTZER_IDS.aylin && x.bis !== null && x.endeArt === 'uebergabe')).toBeDefined();
    expect(u.filter((x) => x.bis === null).map((x) => x.benutzerId)).toEqual([DEMO_BENUTZER_IDS.jonas]);
    expect(await listeMeineGeraete(await aylin(), repo, HEUTE)).toEqual([]);
  });
  it('L-002 durch Jonas erneut → Fehler', async () => {
    expect(await geraetUebernehmen(await jonas(), repo, await aktion('L-002'), ZEIT)).toMatchObject({ ok: false, fehler: SCHON_UEBERNOMMEN });
  });
  it('als VER → Fehler', async () => {
    expect((await geraetUebernehmen(await sitzung('verantwortlicher'), repo, await aktion('L-006'), ZEIT)).ok).toBe(false);
  });
  it('Gerät einer anderen Organisation → Fehler', async () => {
    expect((await geraetUebernehmen(await jonas(), repo, { geraetId: await idVon('M-001', DEMO_ORG2_ID) }, ZEIT)).ok).toBe(false);
  });
  it('L-006 frei → ok ohne vorherige', async () => {
    expect(await geraetUebernehmen(await jonas(), repo, await aktion('L-006'), ZEIT)).toMatchObject({ ok: true, vorherigeBeendet: false });
  });
});

describe('geraetZurueckgeben / uebernahmeBeenden', () => {
  it('P-003 durch Aylin nach Übergabe → Fehler', async () => {
    await geraetUebernehmen(await jonas(), repo, await aktion('P-003'), ZEIT);
    expect((await geraetZurueckgeben(await aylin(), repo, await aktion('P-003'), ZEIT)).ok).toBe(false);
  });
  it('L-002 durch Jonas → ok (rueckgabe), danach nicht mehr in Meine Geräte', async () => {
    expect((await geraetZurueckgeben(await jonas(), repo, await aktion('L-002'), ZEIT)).ok).toBe(true);
    const u = (await alleUebernahmen(repo, DEMO_ORG_ID, await idVon('L-002')))[0];
    expect(u).toMatchObject({ endeArt: 'rueckgabe', beendetVon: DEMO_BENUTZER_IDS.jonas, bis: JETZT.toISOString() });
    expect((await listeMeineGeraete(await jonas(), repo, HEUTE)).map((g) => g.inventarnummer)).not.toContain('L-002');
  });
  it('L-008 (nicht verwenden) zurückgeben bleibt möglich', async () => {
    expect((await geraetZurueckgeben(await jonas(), repo, await aktion('L-008'), ZEIT)).ok).toBe(true);
  });
  it('VER Lager beendet L-002 → beendet_verwaltung; P-003 (Produktion) → Fehler', async () => {
    const ver = await sitzung('verantwortlicher');
    expect((await uebernahmeBeenden(ver, repo, await aktion('L-002'), ZEIT)).ok).toBe(true);
    expect((await alleUebernahmen(repo, DEMO_ORG_ID, await idVon('L-002')))[0].endeArt).toBe('beendet_verwaltung');
    expect((await uebernahmeBeenden(ver, repo, await aktion('P-003'), ZEIT)).ok).toBe(false);
  });
  it('SIF und MA dürfen keine fremde Übernahme beenden', async () => {
    expect((await uebernahmeBeenden(await sitzung('sifa'), repo, await aktion('L-002'), ZEIT)).ok).toBe(false);
    expect((await uebernahmeBeenden(await aylin(), repo, await aktion('L-002'), ZEIT)).ok).toBe(false);
  });
});

describe('geraetZuordnen', () => {
  it('ADM P-008 → Aylin: ok, Ereignisdaten exakt { zugeordnet: true }', async () => {
    const r = await geraetZuordnen(await sitzung('admin'), repo, { geraetId: await idVon('P-008'), benutzerId: DEMO_BENUTZER_IDS.aylin }, JETZT);
    expect(r).toMatchObject({ ok: true, geloest: false });
    const e = (await repo.listeEreignisse(DEMO_ORG_ID, await idVon('P-008'))).filter((x) => x.typ === 'zuordnung_geaendert').at(-1)!;
    expect(e.daten).toEqual({ zugeordnet: true });
    expect((await listeMeineGeraete(await aylin(), repo, HEUTE)).map((g) => g.inventarnummer)).toContain('P-008');
    expect((await listeMeineGeraete(await jonas(), repo, HEUTE)).map((g) => g.inventarnummer)).not.toContain('P-008');
  });
  it('lösen → { zugeordnet: false }', async () => {
    const r = await geraetZuordnen(await sitzung('admin'), repo, { geraetId: await idVon('P-008'), benutzerId: null }, JETZT);
    expect(r).toMatchObject({ ok: true, geloest: true });
    const e = (await repo.listeEreignisse(DEMO_ORG_ID, await idVon('P-008'))).filter((x) => x.typ === 'zuordnung_geaendert').at(-1)!;
    expect(e.daten).toEqual({ zugeordnet: false });
  });
  it('L-001 (wechselnd) → Fehler', async () => {
    const r = await geraetZuordnen(await sitzung('admin'), repo, { geraetId: await idVon('L-001'), benutzerId: DEMO_BENUTZER_IDS.aylin }, JETZT);
    expect(r).toMatchObject({ ok: false, fehler: 'Nur personenbezogene Geräte werden zugeordnet.' });
  });
  it('Ziel VER-Benutzer oder deaktivierter MA → Fehler', async () => {
    const adm = await sitzung('admin');
    expect((await geraetZuordnen(adm, repo, { geraetId: await idVon('P-008'), benutzerId: DEMO_BENUTZER_IDS.marco }, JETZT)).ok).toBe(false);
    await mitgliedAendern(adm, repo, { mitgliedschaftId: '50000000-0000-4000-8000-000000000010', name: 'Aylin Demir', rolle: 'mitarbeiter', bereichIds: [], prueferTypen: [], aktiv: false }, JETZT);
    expect((await geraetZuordnen(adm, repo, { geraetId: await idVon('P-008'), benutzerId: DEMO_BENUTZER_IDS.aylin }, JETZT)).ok).toBe(false);
  });
  it('VER Lager P-008 (Produktion) → Fehler; SIF → Fehler', async () => {
    const ziel = { geraetId: await idVon('P-008'), benutzerId: DEMO_BENUTZER_IDS.aylin };
    expect((await geraetZuordnen(await sitzung('verantwortlicher'), repo, ziel, JETZT)).ok).toBe(false);
    expect((await geraetZuordnen(await sitzung('sifa'), repo, ziel, JETZT)).ok).toBe(false);
  });
  it('listeMitarbeiterOptionen: nur aktive MA, alphabetisch; MA/SIF → []', async () => {
    expect((await listeMitarbeiterOptionen(await sitzung('admin'), repo)).map((p) => p.name)).toEqual(['Aylin Demir', 'Jonas Richter']);
    expect(await listeMitarbeiterOptionen(await sitzung('sifa'), repo)).toEqual([]);
    expect(await listeMitarbeiterOptionen(await jonas(), repo)).toEqual([]);
  });
});

describe('mangelMelden (F-26)', () => {
  it('Jonas, V-001, gefährlich → V-001 vor_nutzung_pruefen / nicht_verwenden; Mangel ohne Prüfart/Verantwortlichen, Termin heute', async () => {
    const v001 = await idVon('V-001');
    const r = await mangelMelden(await jonas(), repo, { geraetId: v001, schwere: 'gefaehrlich', beschreibung: 'Kabel angeschmort' }, ZEIT);
    expect(r.ok).toBe(true);
    const k = (await sucheGeraete(await jonas(), repo, HEUTE, 'kaffee'))[0];
    expect(k).toMatchObject({ gesamtStatus: 'vor_nutzung_pruefen', gesamtStatusGrund: 'gefaehrlicher_mangel', nutzung: 'nicht_verwenden', offeneMaengel: 1 });
    const m = (await repo.listeMaengel(DEMO_ORG_ID)).find((x) => x.geraetId === v001)!;
    expect(m).toMatchObject({ termin: HEUTE, geraetPruefartId: null, nachweisId: null, verantwortlichId: null, status: 'offen', erfasstVonName: 'Jonas Richter' });
    const tokenSeite = await holeTokenSeite(null, repo, ZEIT, 'demoV001xxxxxxxxxxxxxx');
    expect(tokenSeite?.ansicht.nutzung).toBe('nicht_verwenden');
    // VER sieht den Melder (Q-37) – hier ADM, weil V-001 in Verwaltung liegt
    expect((await listeMaengel(await sitzung('admin'), repo, HEUTE)).find((x) => x.geraetId === v001)?.erfasstVonName).toBe('Jonas Richter');
  });
  it('Termin nach Schwere: erheblich +30, gering +90', async () => {
    await mangelMelden(await jonas(), repo, { geraetId: await idVon('L-008'), schwere: 'erheblich', beschreibung: 'Holm eingerissen' }, ZEIT);
    await mangelMelden(await jonas(), repo, { geraetId: await idVon('L-002'), schwere: 'gering', beschreibung: 'Aufkleber fehlt' }, ZEIT);
    const m = await repo.listeMaengel(DEMO_ORG_ID);
    expect(m.find((x) => x.beschreibung === 'Holm eingerissen')?.termin).toBe(addTage(HEUTE, 30));
    expect(m.find((x) => x.beschreibung === 'Aufkleber fehlt')?.termin).toBe(addTage(HEUTE, 90));
  });
  it('mangelErfassen und holeMangelFormular als MA → Fehler/null; mangelMelden als VER → Fehler', async () => {
    const v001 = await idVon('V-001');
    const r = await mangelErfassen(await jonas(), repo, { geraetId: v001, geraetPruefartId: null, nachweisId: null, beschreibung: 'Direkt erfasst', schwere: 'gering', termin: HEUTE, verantwortlichId: null, zurueck: null }, ZEIT);
    expect(r.ok).toBe(false);
    expect(await holeMangelFormular(await jonas(), repo, HEUTE, v001)).toBeNull();
    expect((await mangelMelden(await sitzung('verantwortlicher'), repo, { geraetId: await idVon('L-001'), schwere: 'gering', beschreibung: 'Test test' }, ZEIT)).ok).toBe(false);
  });
  it('fremde Organisation → Fehler; holeMangelMeldung null', async () => {
    const m001 = await idVon('M-001', DEMO_ORG2_ID);
    expect((await mangelMelden(await jonas(), repo, { geraetId: m001, schwere: 'gering', beschreibung: 'Fremdes Gerät' }, ZEIT)).ok).toBe(false);
    expect(await holeMangelMeldung(await jonas(), repo, HEUTE, m001)).toBeNull();
    expect((await holeMangelMeldung(await jonas(), repo, HEUTE, await idVon('V-001')))?.bezeichnung).toBe('Kaffeevollautomat Teeküche');
    expect(await holeMangelMeldung(await sitzung('verantwortlicher'), repo, HEUTE, await idVon('L-001'))).toBeNull();
  });
  it('MA sieht keine Geräteliste, keine Mängelliste', async () => {
    expect(await listeGeraete(await jonas(), repo, HEUTE)).toEqual([]);
    expect(await listeMaengel(await jonas(), repo, HEUTE)).toEqual([]);
    expect(await holeGeraetDetail(await jonas(), repo, HEUTE, await idVon('L-002'))).toBeNull();
  });
});

describe('holeTokenSeite (F-24)', () => {
  it('L-001 ohne Sitzung: nicht_verwenden, keine Namen außer Prüfer, kein kurz/akteUrl', async () => {
    const s = (await holeTokenSeite(null, repo, ZEIT, 'demoL001xxxxxxxxxxxxxx'))!;
    expect(s).toMatchObject({ angemeldet: false, andereOrganisation: false, kurz: null, akteUrl: null, token: 'demoL001xxxxxxxxxxxxxx' });
    expect(s.ansicht).toMatchObject({ nutzung: 'nicht_verwenden', gesamtStatus: 'ueberfaellig', organisationName: 'Elbtal Fördertechnik GmbH', inventarnummer: 'L-001', stand: JETZT.toISOString() });
    expect(s.ansicht.pruefarten[0].letzterNachweis?.prueferName).toBe('Tobias Berger, Prüfdienst Berger');
    const text = JSON.stringify(s);
    for (const n of NAMEN) expect(text).not.toContain(n);
    expect(text).not.toContain(DEMO_BEREICH_IDS.lager);
    expect(text).not.toContain('Lager"');
    expect(Object.keys(s.ansicht)).not.toContain('bereichName');
  });
  it('Review I3M (F-24): öffentliche Seite ohne interne IDs; Repository bekommt Sitzungs-Organisation', async () => {
    const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    for (const t of ['demoL001xxxxxxxxxxxxxx', 'demoP001xxxxxxxxxxxxxx', 'demoL008xxxxxxxxxxxxxx']) {
      expect(JSON.stringify(await holeTokenSeite(null, repo, ZEIT, t)), t).not.toMatch(UUID);
    }
    const spion = vi.spyOn(repo, 'holeTokenRohdaten');
    const ver = await sitzung('verantwortlicher');
    await holeTokenSeite(ver, repo, ZEIT, 'demoL003xxxxxxxxxxxxxx');
    expect(spion).toHaveBeenCalledWith('demoL003xxxxxxxxxxxxxx', { benutzerId: ver.benutzer.id, organisationId: DEMO_ORG_ID });
  });
  it('deaktivierter, unbekannter Token und falsches Format → null; falsches Format ohne Repository-Aufruf', async () => {
    const spion = vi.spyOn(repo, 'holeTokenRohdaten');
    expect(await holeTokenSeite(null, repo, ZEIT, 'abc')).toBeNull();
    expect(await holeTokenSeite(null, repo, ZEIT, 'demoL001xxxxxxxxxxxxx+')).toBeNull();
    expect(spion).not.toHaveBeenCalled();
    expect(await holeTokenSeite(null, repo, ZEIT, 'demoL001altxxxxxxxxxxx')).toBeNull();
    expect(await holeTokenSeite(null, repo, ZEIT, 'Unbekannt0123456789abc')).toBeNull();
  });
  it('als Jonas für L-002 → kurz.uebernahme von_mir; P-003 → von_anderen ohne Namen', async () => {
    expect((await holeTokenSeite(await jonas(), repo, ZEIT, 'demoL002xxxxxxxxxxxxxx'))?.kurz?.uebernahme).toBe('von_mir');
    const p003 = (await holeTokenSeite(await jonas(), repo, ZEIT, 'demoP003xxxxxxxxxxxxxx'))!;
    expect(p003.kurz).toMatchObject({ uebernahme: 'von_anderen', uebernahmeHinweis: null });
    expect(JSON.stringify(p003)).not.toContain('Aylin');
  });
  it('als VER Lager: L-003 → akteUrl, P-001 → null; Gerät anderer Organisation → nur öffentliche Ansicht', async () => {
    const ver = await sitzung('verantwortlicher');
    expect((await holeTokenSeite(ver, repo, ZEIT, 'demoL003xxxxxxxxxxxxxx'))?.akteUrl).toBe(`/geraete/${await idVon('L-003')}`);
    expect((await holeTokenSeite(ver, repo, ZEIT, 'demoP001xxxxxxxxxxxxxx'))?.akteUrl).toBeNull();
    const fremd = (await holeTokenSeite(await jonas(), repo, ZEIT, 'demoM001xxxxxxxxxxxxxx'))!;
    expect(fremd).toMatchObject({ andereOrganisation: true, kurz: null, akteUrl: null });
  });
});

describe('holeGeraetDetail().nutzung (F-22, F-27)', () => {
  it('L-006 als ADM → verlauf 1 Eintrag (−20); als VER und SIF → []', async () => {
    const id = await idVon('L-006');
    const adm = (await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, id))!.nutzung!;
    expect(adm.verlauf).toHaveLength(1);
    expect(adm.verlauf[0]).toMatchObject({ benutzerName: 'Aylin Demir', endeArt: 'rueckgabe' });
    expect(adm.verlauf[0].von.slice(0, 10)).toBe(addTage(HEUTE, -20));
    expect((await holeGeraetDetail(await sitzung('verantwortlicher'), repo, HEUTE, id))!.nutzung!.verlauf).toEqual([]);
    expect((await holeGeraetDetail(await sitzung('sifa'), repo, HEUTE, id))!.nutzung!.verlauf).toEqual([]);
  });
  it('Verlauf nur über listeUebernahmeVerlauf und nur für ADM (F-27/US-32)', async () => {
    const id = await idVon('L-006');
    const spion = vi.spyOn(repo, 'listeUebernahmeVerlauf');
    await holeGeraetDetail(await sitzung('verantwortlicher'), repo, HEUTE, id);
    await holeGeraetDetail(await sitzung('sifa'), repo, HEUTE, id);
    expect(spion).not.toHaveBeenCalled();
    await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, id);
    expect(spion).toHaveBeenCalledTimes(1);
    expect(spion.mock.calls[0][0]).toBe(id);
  });
  it('P-004 (pseudonymisiert, vor 120 Tagen) erscheint nirgends', async () => {
    const n = (await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon('P-004')))!.nutzung!;
    expect(n.verlauf).toEqual([]);
    expect(n.uebernahme).toBeNull();
  });
  it('L-002 als VER → Halter Jonas Richter; als PRF (zugewiesen) → nutzung null', async () => {
    const id = await idVon('L-002');
    const ver = (await holeGeraetDetail(await sitzung('verantwortlicher'), repo, HEUTE, id))!.nutzung!;
    expect(ver.uebernahme?.benutzerName).toBe('Jonas Richter');
    expect(ver).toMatchObject({ darfZuordnen: true, etikett: { token: 'demoL002xxxxxxxxxxxxxx' } });
    expect(ver.etikett?.url).toMatch(/\/g\/demoL002xxxxxxxxxxxxxx$/);
    const prf = await holeGeraetDetail(await sitzung('pruefer'), repo, HEUTE, id);
    expect(prf).not.toBeNull();
    expect(prf!.nutzung).toBeNull();
  });
  it('P-008 als SIF → Zuordnung sichtbar, kein Zuordnen, kein Etikett', async () => {
    const n = (await holeGeraetDetail(await sitzung('sifa'), repo, HEUTE, await idVon('P-008')))!.nutzung!;
    expect(n).toMatchObject({ zugeordnet: { benutzerId: DEMO_BENUTZER_IDS.jonas, name: 'Jonas Richter' }, darfZuordnen: false, etikett: null });
  });
});

/** Alle Geräte des VER (Bereich Lager) über alle Kategorien; Erwartung aus dem Demo-Bestand. */
const ALLE_VER = ['L-001', 'L-002', 'L-003', 'L-004', 'L-005', 'L-006', 'L-007', 'L-008'];
const legeGeraetAn = async (s: Sitzung, i: number) => {
  const r = await geraetAnlegen(
    s,
    repo,
    geraetAnlegenSchema.parse({
      bezeichnung: `Testgerät ${i}`,
      inventarnummer: `T-${String(i).padStart(3, '0')}`,
      bereichId: DEMO_BEREICH_IDS.lager,
      geraetegruppe: 'flurfoerderzeug',
      kategorie: 'wechselnd',
      hersteller: '',
      typ: '',
      seriennummer: '',
      baujahr: '',
      einsatzort: '',
      pruefartenJson: JSON.stringify([
        { katalogSchluessel: 'flurfoerderzeug.wiederkehrend', bezeichnung: 'Wiederkehrende Prüfung', herstellerfristMonate: null, herstellerfristQuelle: null, letztePruefung: null, letztePruefungHerkunft: 'unbekannt' },
      ]),
    }),
    ZEIT,
  );
  expect(r.ok).toBe(true);
};

describe('Etiketten (F-25)', () => {
  it('VER Lager, Bereich Lager, wechselnd → 4 Etiketten mit aktivem Token', async () => {
    const { etiketten: e, gekappt } = await holeEtiketten(await sitzung('verantwortlicher'), repo, ZEIT, { bereichId: DEMO_BEREICH_IDS.lager, kategorie: 'wechselnd' });
    expect(gekappt).toBe(false);
    expect(e.map((x) => x.inventarnummer)).toEqual(['L-001', 'L-002', 'L-006', 'L-008']);
    expect(e[0].url).toMatch(/\/g\/demoL001xxxxxxxxxxxxxx$/);
    expect(e[0]).toMatchObject({ status: 'ueberfaellig', stand: HEUTE, organisationName: 'Elbtal Fördertechnik GmbH' });
    expect(e[0].kurzUrl).not.toMatch(/^https?:/);
    expect(e[0].qr.module).toHaveLength(e[0].qr.groesse ** 2);
  });
  it('Ohne Kategorie: alle Geräte im Geltungsbereich; geraetIds außerhalb → []', async () => {
    const ver = await sitzung('verantwortlicher');
    const alle = await holeEtiketten(ver, repo, ZEIT, {});
    expect(alle.etiketten.map((x) => x.inventarnummer)).toEqual(ALLE_VER);
    expect(alle).toMatchObject({ gesamt: ALLE_VER.length, gekappt: false });
    expect((await holeEtiketten(ver, repo, ZEIT, { geraetIds: [await idVon('P-001')] })).etiketten).toEqual([]);
    expect((await holeEtiketten(ver, repo, ZEIT, { geraetIds: [await idVon('L-003')] })).etiketten.map((x) => x.inventarnummer)).toEqual(['L-003']);
  });
  it('Kappung bei ETIKETTEN_MAX: gesamt vor Kappung, gekappt = true', async () => {
    const adm = await sitzung('admin');
    const vorher = (await holeEtiketten(adm, repo, ZEIT, {})).gesamt;
    for (let i = 0; i < ETIKETTEN_MAX + 5 - vorher; i++) await legeGeraetAn(adm, i);
    const e = await holeEtiketten(adm, repo, ZEIT, {});
    expect(e).toMatchObject({ gesamt: ETIKETTEN_MAX + 5, gekappt: true });
    expect(e.etiketten).toHaveLength(ETIKETTEN_MAX);
  });
  it('SIF, PRF, MA → leer', async () => {
    for (const r of ['sifa', 'pruefer', 'mitarbeiter'] as const)
      expect(await holeEtiketten(await sitzung(r), repo, ZEIT, {})).toEqual({ etiketten: [], gesamt: 0, gekappt: false });
  });
  it('etikettErneuern(L-002): alter Token ungültig, neuer funktioniert, Ereignis etikett_erneuert', async () => {
    const r = await etikettErneuern(await sitzung('verantwortlicher'), repo, { geraetId: await idVon('L-002'), bestaetigung: 'on' }, JETZT);
    if (!r.ok) throw new Error(r.fehler);
    expect(await holeTokenSeite(null, repo, ZEIT, 'demoL002xxxxxxxxxxxxxx')).toBeNull();
    expect((await holeTokenSeite(null, repo, ZEIT, r.token))?.ansicht.inventarnummer).toBe('L-002');
    const e = (await repo.listeEreignisse(DEMO_ORG_ID, await idVon('L-002'))).filter((x) => x.typ === 'etikett_erneuert');
    expect(e).toHaveLength(1);
    expect(e[0].daten).toEqual({});
  });
  it('etikettErneuern außerhalb des Bereichs oder als SIF → Fehler', async () => {
    expect((await etikettErneuern(await sitzung('verantwortlicher'), repo, { geraetId: await idVon('P-001'), bestaetigung: 'on' }, JETZT)).ok).toBe(false);
    expect((await etikettErneuern(await sitzung('sifa'), repo, { geraetId: await idVon('L-002'), bestaetigung: 'on' }, JETZT)).ok).toBe(false);
  });
});

describe('Mitarbeiter einladen und Austritt (F-20)', () => {
  it('VER lädt ein → Mitgliedschaft mitarbeiter ohne Bereiche', async () => {
    const r = await mitarbeiterEinladen(await sitzung('verantwortlicher'), repo, { email: 'neu@elbtal-foerdertechnik.example', name: 'Neue Kollegin' }, JETZT);
    if (!r.ok) throw new Error(r.fehler);
    expect(r.meldung).toBe('Einladung an neu@elbtal-foerdertechnik.example versendet.');
    const m = (await repo.listeMitgliedschaften(DEMO_ORG_ID)).find((x) => x.id === r.id)!;
    expect(m).toMatchObject({ rolle: 'mitarbeiter', bereichIds: [], aktiv: true });
    expect((await listeMitarbeiter(await sitzung('verantwortlicher'), repo)).map((x) => x.benutzer.name)).toEqual(['Aylin Demir', 'Jonas Richter', 'Neue Kollegin']);
  });
  it('VER darf nicht über mitgliedEinladen einladen; SIF/MA nicht über mitarbeiterEinladen; doppelte E-Mail → Feld email', async () => {
    const ver = await sitzung('verantwortlicher');
    expect((await mitgliedEinladen(ver, repo, { email: 'x@example.org', name: 'Chef', rolle: 'verantwortlicher', bereichIds: [DEMO_BEREICH_IDS.lager], prueferTypen: [] }, JETZT)).ok).toBe(false);
    expect((await mitarbeiterEinladen(await sitzung('sifa'), repo, { email: 'x@example.org', name: 'Xaver' }, JETZT)).ok).toBe(false);
    expect((await mitarbeiterEinladen(await jonas(), repo, { email: 'x@example.org', name: 'Xaver' }, JETZT)).ok).toBe(false);
    expect(await mitarbeiterEinladen(ver, repo, { email: 'j.richter@elbtal-foerdertechnik.example', name: 'Jonas' }, JETZT)).toMatchObject({ ok: false, feld: 'email' });
  });
  it('ADM kann Mitarbeiter über mitgliedEinladen einladen', async () => {
    const r = await mitgliedEinladen(await sitzung('admin'), repo, { email: 'ma@example.org', name: 'Max Muster', rolle: 'mitarbeiter', bereichIds: [DEMO_BEREICH_IDS.lager], prueferTypen: [] }, JETZT);
    if (!r.ok) throw new Error(r.fehler);
    expect((await repo.listeMitgliedschaften(DEMO_ORG_ID)).find((x) => x.id === r.id)).toMatchObject({ rolle: 'mitarbeiter', bereichIds: [] });
  });
  it('ADM deaktiviert Jonas → P-008 ohne Zuordnung, L-002 und L-008 austritt; Mängel bleiben', async () => {
    await mangelMelden(await jonas(), repo, { geraetId: await idVon('L-008'), schwere: 'erheblich', beschreibung: 'Holm eingerissen' }, ZEIT);
    const r = await mitgliedAendern(await sitzung('admin'), repo, { mitgliedschaftId: '50000000-0000-4000-8000-000000000009', name: 'Jonas Richter', rolle: 'mitarbeiter', bereichIds: [], prueferTypen: [], aktiv: false }, JETZT);
    expect(r.ok).toBe(true);
    expect((await repo.holeGeraet(await idVon('P-008')))?.zugeordnetAn).toBeNull();
    for (const inv of ['L-002', 'L-008']) {
      const u = (await alleUebernahmen(repo, DEMO_ORG_ID, await idVon(inv))).find((x) => x.benutzerId === DEMO_BENUTZER_IDS.jonas)!;
      expect(u.endeArt, inv).toBe('austritt');
    }
    expect((await repo.listeMaengel(DEMO_ORG_ID)).some((m) => m.beschreibung === 'Holm eingerissen')).toBe(true);
    expect(await sitzungFuerDemoRolle(repo, 'mitarbeiter')).toBeNull();
  });
  it('Rollenwechsel weg von mitarbeiter löst ebenfalls', async () => {
    await mitgliedAendern(await sitzung('admin'), repo, { mitgliedschaftId: '50000000-0000-4000-8000-000000000010', name: 'Aylin Demir', rolle: 'sifa', bereichIds: [], prueferTypen: [], aktiv: true }, JETZT);
    expect((await alleUebernahmen(repo, DEMO_ORG_ID, await idVon('P-003'))).find((x) => x.bis !== null)?.endeArt).toBe('austritt');
  });
});

describe('sucheGeraete', () => {
  it("'leiter' als Jonas → L-008 von_mir; als Aylin → von_anderen; 'a' → []", async () => {
    expect((await sucheGeraete(await jonas(), repo, HEUTE, 'leiter')).find((g) => g.inventarnummer === 'L-008')?.uebernahme).toBe('von_mir');
    expect((await sucheGeraete(await aylin(), repo, HEUTE, 'leiter')).find((g) => g.inventarnummer === 'L-008')?.uebernahme).toBe('von_anderen');
    expect(await sucheGeraete(await jonas(), repo, HEUTE, 'a')).toEqual([]);
    expect(await sucheGeraete(await jonas(), repo, HEUTE, ' a ')).toEqual([]);
  });
  it('findet nur Geräte der eigenen Organisation; andere Rollen → []', async () => {
    expect(await sucheGeraete(await jonas(), repo, HEUTE, 'Säulenbohr')).toEqual([]);
    expect(await sucheGeraete(await sitzung('admin'), repo, HEUTE, 'leiter')).toEqual([]);
  });
});
