import { describe, expect, it } from 'vitest';
import { istMangelOffen, mangelUebergangErlaubt, terminUeberschritten, terminVorschlag } from './maengel';
import { MANGEL_STATUS } from './types';

describe('mangelUebergangErlaubt (F-14)', () => {
  it('offen → in_bearbeitung ok', () => expect(mangelUebergangErlaubt('offen', 'in_bearbeitung')).toBe(true));
  it('offen → behoben ok', () => expect(mangelUebergangErlaubt('offen', 'behoben')).toBe(true));
  it('in_bearbeitung → behoben ok', () => expect(mangelUebergangErlaubt('in_bearbeitung', 'behoben')).toBe(true));
  it('behoben → * Fehler', () => {
    for (const s of MANGEL_STATUS) expect(mangelUebergangErlaubt('behoben', s)).toBe(false);
  });
  it('in_bearbeitung → offen Fehler', () => expect(mangelUebergangErlaubt('in_bearbeitung', 'offen')).toBe(false));
  it('kein Übergang auf sich selbst', () => {
    for (const s of MANGEL_STATUS) expect(mangelUebergangErlaubt(s, s)).toBe(false);
  });
});

describe('terminVorschlag (Q-16)', () => {
  it('gefährlich = heute', () => expect(terminVorschlag('gefaehrlich', '2026-11-19')).toBe('2026-11-19'));
  it('erheblich = +30', () => expect(terminVorschlag('erheblich', '2026-11-19')).toBe('2026-12-19'));
  it('gering = +90', () => expect(terminVorschlag('gering', '2026-11-19')).toBe('2027-02-17'));
});

describe('istMangelOffen / terminUeberschritten', () => {
  it('offen und in_bearbeitung sind offen', () => {
    expect(istMangelOffen({ status: 'offen' })).toBe(true);
    expect(istMangelOffen({ status: 'in_bearbeitung' })).toBe(true);
    expect(istMangelOffen({ status: 'behoben' })).toBe(false);
  });
  it('Termin gestern und offen → überschritten; behoben nie', () => {
    expect(terminUeberschritten({ status: 'offen', termin: '2026-11-18' }, '2026-11-19')).toBe(true);
    expect(terminUeberschritten({ status: 'offen', termin: '2026-11-19' }, '2026-11-19')).toBe(false);
    expect(terminUeberschritten({ status: 'behoben', termin: '2026-01-01' }, '2026-11-19')).toBe(false);
  });
});
