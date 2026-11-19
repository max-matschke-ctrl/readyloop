import { describe, expect, it } from 'vitest';
import { addMonate, addTage, formatDatum, heuteBerlin, istIsoDate, tageZwischen } from './datum';

describe('addMonate', () => {
  it('klemmt auf Monatsende (kein Schaltjahr)', () => expect(addMonate('2026-01-31', 1)).toBe('2026-02-28'));
  it('klemmt auf Monatsende (Schaltjahr)', () => expect(addMonate('2028-01-31', 1)).toBe('2028-02-29'));
  it('addiert 48 Monate', () => expect(addMonate('2026-03-15', 48)).toBe('2030-03-15'));
  it('über Jahresgrenze', () => expect(addMonate('2026-11-30', 3)).toBe('2027-02-28'));
  it('negativ', () => expect(addMonate('2026-03-31', -1)).toBe('2026-02-28'));
  it('lehnt ungültiges Datum ab', () => expect(() => addMonate('2026-02-30', 1)).toThrow());
});

describe('tageZwischen / addTage', () => {
  it('zählt Kalendertage', () => expect(tageZwischen('2026-11-19', '2026-12-19')).toBe(30));
  it('negativ, wenn bis vor von', () => expect(tageZwischen('2026-11-19', '2026-11-18')).toBe(-1));
  it('über Sommerzeitwechsel exakt', () => expect(tageZwischen('2026-03-28', '2026-03-30')).toBe(2));
  it('Schalttag', () => expect(tageZwischen('2028-02-28', '2028-03-01')).toBe(2));
  it('addTage rückwärts über Jahresgrenze', () => expect(addTage('2026-01-01', -1)).toBe('2025-12-31'));
});

describe('istIsoDate / formatDatum / heuteBerlin', () => {
  it('erkennt gültige und ungültige Daten', () => {
    expect(istIsoDate('2028-02-29')).toBe(true);
    expect(istIsoDate('2026-02-29')).toBe(false);
    expect(istIsoDate('2026-13-01')).toBe(false);
    expect(istIsoDate('26-01-01')).toBe(false);
  });
  it('formatiert TT.MM.JJJJ', () => expect(formatDatum('2027-03-05')).toBe('05.03.2027'));
  it('heuteBerlin nutzt Europe/Berlin (UTC 23:30 = nächster Tag)', () => {
    expect(heuteBerlin(new Date('2026-11-18T23:30:00Z'))).toBe('2026-11-19');
    expect(heuteBerlin(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01');
    expect(heuteBerlin(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02');
  });
});
