import { describe, expect, it } from 'vitest';
import { berechneStatus, gesamtStatus, naechsteFaelligkeit, prueferGruppe, statusRang } from './status';
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
    for (const s of ['ueberfaellig', 'unbekannt', 'gbu', 'bald_faellig'] as const) expect(prueferGruppe(s)).toBe('faellig');
  });
});

describe('statusRang', () => {
  it('ordnet nach Schwere: überfällig zuerst, ok zuletzt', () => {
    expect(statusRang('ueberfaellig')).toBe(0);
    expect(statusRang('unbekannt')).toBe(1);
    expect(statusRang('gbu')).toBe(2);
    expect(statusRang('bald_faellig')).toBe(3);
    expect(statusRang('ok')).toBe(4);
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
