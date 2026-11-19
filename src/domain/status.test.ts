import { describe, expect, it } from 'vitest';
import { berechneStatus, berechneStatusImKontext, gesamtStatus, naechsteFaelligkeit, prueferGruppe, statusRang } from './status';
import type { FestgelegteFrist } from './types';

const frist = (monate: number): FestgelegteFrist => ({
  monate,
  quelle: 'gbu',
  stufe: 'C',
  fundstelle: 'GBU Lager 2025',
  quelleUrl: null,
  katalogEintragId: null,
  katalogVersion: null,
  begruendung: 'Begründung für Test',
  freigegebenVon: 'u1',
  freigegebenVonName: 'Test',
  freigegebenAm: '2026-01-01T00:00:00.000Z',
});

const HEUTE = '2026-11-19';

describe('berechneStatus (F-5)', () => {
  it('ohne Frist → gbu', () => {
    expect(berechneStatus({ frist: null, letztePruefung: '2026-01-01' }, HEUTE)).toEqual({
      status: 'gbu',
      faelligAm: null,
      restTage: null,
    });
  });
  it('Frist ohne Datum → unbekannt', () => {
    expect(berechneStatus({ frist: frist(12), letztePruefung: null }, HEUTE).status).toBe('unbekannt');
  });
  it('Fälligkeit ab Prüfdatum mit Monatsende-Klemme', () => {
    const r = berechneStatus({ frist: frist(1), letztePruefung: '2027-01-31' }, HEUTE);
    expect(r.faelligAm).toBe('2027-02-28');
  });
  // faelligAm = 2026-12-20 → 31 Tage
  it('Resttage 31 → ok', () => {
    const r = berechneStatus({ frist: frist(12), letztePruefung: '2025-12-20' }, HEUTE);
    expect(r).toEqual({ status: 'ok', faelligAm: '2026-12-20', restTage: 31 });
  });
  it('Resttage 30 → bald_faellig', () => {
    const r = berechneStatus({ frist: frist(12), letztePruefung: '2025-12-19' }, HEUTE);
    expect(r).toEqual({ status: 'bald_faellig', faelligAm: '2026-12-19', restTage: 30 });
  });
  it('Resttage 0 (heute fällig) → bald_faellig', () => {
    const r = berechneStatus({ frist: frist(12), letztePruefung: '2025-11-19' }, HEUTE);
    expect(r).toEqual({ status: 'bald_faellig', faelligAm: HEUTE, restTage: 0 });
  });
  it('Resttage −1 → ueberfaellig', () => {
    const r = berechneStatus({ frist: frist(12), letztePruefung: '2025-11-18' }, HEUTE);
    expect(r).toEqual({ status: 'ueberfaellig', faelligAm: '2026-11-18', restTage: -1 });
  });
  it('Vorlauf ist parametrierbar', () => {
    const r = berechneStatus({ frist: frist(12), letztePruefung: '2025-12-19' }, HEUTE, 10);
    expect(r.status).toBe('ok');
  });
});

describe('gesamtStatus (F-6)', () => {
  it('Reihenfolge ueberfaellig > unbekannt > gbu > bald_faellig > ok', () => {
    expect(gesamtStatus(['ok', 'bald_faellig', 'gbu', 'unbekannt', 'ueberfaellig'])).toBe('ueberfaellig');
    expect(gesamtStatus(['ok', 'bald_faellig', 'gbu', 'unbekannt'])).toBe('unbekannt');
    expect(gesamtStatus(['ok', 'bald_faellig', 'gbu'])).toBe('gbu');
    expect(gesamtStatus(['ok', 'bald_faellig'])).toBe('bald_faellig');
    expect(gesamtStatus(['ok', 'ok'])).toBe('ok');
  });
  it('leere Liste → gbu', () => expect(gesamtStatus([])).toBe('gbu'));
});

describe('naechsteFaelligkeit / prueferGruppe', () => {
  it('frühestes Datum, null ignoriert', () => {
    expect(
      naechsteFaelligkeit([
        { status: 'ok', faelligAm: '2027-05-01', restTage: 1 },
        { status: 'unbekannt', faelligAm: null, restTage: null },
        { status: 'ok', faelligAm: '2027-02-01', restTage: 1 },
      ]),
    ).toBe('2027-02-01');
    expect(naechsteFaelligkeit([])).toBeNull();
  });
  it('nur ok ist später', () => {
    expect(prueferGruppe('ok')).toBe('spaeter');
    for (const s of ['ueberfaellig', 'vor_nutzung_pruefen', 'unbekannt', 'gbu', 'bald_faellig'] as const) expect(prueferGruppe(s)).toBe('faellig');
  });
});

describe('statusRang', () => {
  it('ordnet nach Schwere: überfällig zuerst, ok zuletzt', () => {
    expect(statusRang('ueberfaellig')).toBe(0);
    expect(statusRang('vor_nutzung_pruefen')).toBe(1); // F-9
    expect(statusRang('unbekannt')).toBe(2);
    expect(statusRang('gbu')).toBe(3);
    expect(statusRang('bald_faellig')).toBe(4);
    expect(statusRang('ok')).toBe(5);
  });

  it('sortiert eine Liste vom schlechtesten zum besten Status', () => {
    const liste = ['ok', 'gbu', 'bald_faellig', 'ueberfaellig', 'unbekannt'] as const;
    expect([...liste].sort((a, b) => statusRang(a) - statusRang(b))).toEqual([
      'ueberfaellig',
      'unbekannt',
      'gbu',
      'bald_faellig',
      'ok',
    ]);
  });

  it('passt zu gesamtStatus: kleinster Rang gewinnt', () => {
    const liste = ['ok', 'bald_faellig', 'gbu'] as const;
    const min = [...liste].sort((a, b) => statusRang(a) - statusRang(b))[0];
    expect(gesamtStatus(liste)).toBe(min);
  });
});

describe('berechneStatusImKontext (F-9)', () => {
  const normal = { betriebsstatus: 'in_betrieb', anlassOffen: false, nichtBestanden: false } as const;
  const okPruefart = { frist: frist(12), letztePruefung: '2026-06-01' }; // fällig 2027-06-01 → ok

  it('offener Anlass + ok → vor_nutzung_pruefen/anlass, faelligAm bleibt', () => {
    const r = berechneStatusImKontext(okPruefart, HEUTE, { ...normal, anlassOffen: true });
    expect(r).toMatchObject({ status: 'vor_nutzung_pruefen', grund: 'anlass', faelligAm: '2027-06-01' });
    expect(r.restTage).toBe(194);
  });
  it('letzter Nachweis nicht bestanden → vor_nutzung_pruefen/nicht_bestanden', () => {
    expect(berechneStatusImKontext(okPruefart, HEUTE, { ...normal, nichtBestanden: true })).toMatchObject({
      status: 'vor_nutzung_pruefen',
      grund: 'nicht_bestanden',
    });
  });
  it('Anlass ohne Frist → vor_nutzung_pruefen (nicht gbu)', () => {
    expect(berechneStatusImKontext({ frist: null, letztePruefung: null }, HEUTE, { ...normal, anlassOffen: true })).toEqual({
      status: 'vor_nutzung_pruefen',
      faelligAm: null,
      restTage: null,
      grund: 'anlass',
    });
  });
  it('außer Betrieb + Resttage −1 → vor_nutzung_pruefen/ausser_betrieb', () => {
    const r = berechneStatusImKontext({ frist: frist(12), letztePruefung: '2025-11-18' }, HEUTE, {
      ...normal,
      betriebsstatus: 'ausser_betrieb',
    });
    expect(r).toEqual({ status: 'vor_nutzung_pruefen', faelligAm: '2026-11-18', restTage: -1, grund: 'ausser_betrieb' });
  });
  it('außer Betrieb + Resttage 10 → bald_faellig', () => {
    const r = berechneStatusImKontext({ frist: frist(12), letztePruefung: '2025-11-29' }, HEUTE, {
      ...normal,
      betriebsstatus: 'ausser_betrieb',
    });
    expect(r).toMatchObject({ status: 'bald_faellig', restTage: 10 });
    expect(r.grund).toBeUndefined();
  });
  it('außer Betrieb + unbekannt → unbekannt', () => {
    expect(
      berechneStatusImKontext({ frist: frist(12), letztePruefung: null }, HEUTE, { ...normal, betriebsstatus: 'ausser_betrieb' }).status,
    ).toBe('unbekannt');
  });
  it('ohne Kontext-Abweichung identisch zu berechneStatus', () => {
    const faelle = [
      { frist: null, letztePruefung: null },
      { frist: frist(12), letztePruefung: null },
      { frist: frist(12), letztePruefung: '2025-11-18' },
      { frist: frist(12), letztePruefung: '2025-11-29' },
      okPruefart,
    ];
    for (const f of faelle) expect(berechneStatusImKontext(f, HEUTE, normal)).toEqual(berechneStatus(f, HEUTE));
  });
});

describe('gesamtStatus mit gefährlichem Mangel (F-9)', () => {
  it("['vor_nutzung_pruefen','ueberfaellig'] → ueberfaellig", () => {
    expect(gesamtStatus(['vor_nutzung_pruefen', 'ueberfaellig'])).toBe('ueberfaellig');
  });
  it("['ok'] + gefährlicher Mangel → vor_nutzung_pruefen", () => {
    expect(gesamtStatus(['ok'], true)).toBe('vor_nutzung_pruefen');
  });
  it('[] + gefährlicher Mangel → vor_nutzung_pruefen', () => {
    expect(gesamtStatus([], true)).toBe('vor_nutzung_pruefen');
  });
  it('überfällig bleibt überfällig trotz Mangel', () => {
    expect(gesamtStatus(['ueberfaellig'], true)).toBe('ueberfaellig');
  });
});
