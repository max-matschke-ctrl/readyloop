import { describe, expect, it } from 'vitest';
import { jahresringFenster } from './jahresring-fenster';

describe('jahresringFenster (Designsystem §10 E-3)', () => {
  it('umfasst genau 12 Kalendermonate ab dem aktuellen Monat', () => {
    const f = jahresringFenster([], '2026-11-20');
    expect(f.monate).toHaveLength(12);
    expect(f.monate[0]).toMatchObject({ jahr: 2026, monat: 11 });
    expect(f.monate[11]).toMatchObject({ jahr: 2027, monat: 10 });
    expect(new Set(f.monate.map((m) => m.monat)).size).toBe(12);
  });

  it('zählt den 31.10.2027, aber nicht den 20.11.2027 und nichts vor heute', () => {
    const f = jahresringFenster(['2027-10-31', '2027-11-20', '2026-11-19', '2026-11-20', null], '2026-11-20');
    expect(f.summe).toBe(2);
    expect(f.monate[0]!.anzahl).toBe(1);
    expect(f.monate[11]!.anzahl).toBe(1);
  });

  it('Monatsanfang: heute am 1. zählt den ganzen Monat und endet am Ende des 11. Folgemonats', () => {
    const f = jahresringFenster(['2026-01-01', '2026-12-31', '2027-01-01'], '2026-01-01');
    expect(f.bis).toBe('2026-12-31');
    expect(f.summe).toBe(2);
  });

  it('Monatsende und Jahreswechsel', () => {
    const f = jahresringFenster(['2026-12-31', '2027-01-01', '2027-11-30', '2027-12-01'], '2026-12-31');
    expect(f.monate[0]).toMatchObject({ jahr: 2026, monat: 12, anzahl: 1 });
    expect(f.monate[1]).toMatchObject({ jahr: 2027, monat: 1, anzahl: 1 });
    expect(f.monate[11]).toMatchObject({ jahr: 2027, monat: 11, anzahl: 1 });
    expect(f.summe).toBe(3);
  });

  it('29.02. im Schaltjahr liegt im Februar-Segment', () => {
    const f = jahresringFenster(['2028-02-29', '2028-03-01'], '2027-03-15');
    const feb = f.monate.find((m) => m.jahr === 2028 && m.monat === 2);
    expect(feb?.anzahl).toBe(1);
    expect(f.summe).toBe(1);
  });

  it('Summe entspricht der Summe der 12 Einträge', () => {
    const f = jahresringFenster(['2026-12-01', '2027-03-05', '2027-03-06', '2027-09-30'], '2026-11-20');
    expect(f.summe).toBe(f.monate.reduce((s, m) => s + m.anzahl, 0));
    expect(f.summe).toBe(4);
  });

  it('zählt Fälligkeiten vor heute getrennt als überfällig', () => {
    const f = jahresringFenster(['2026-11-19', '2025-01-01', '2026-11-20', '2028-01-01', null], '2026-11-20');
    expect(f.ueberfaellig).toBe(2);
    expect(f.summe).toBe(1);
  });
});
