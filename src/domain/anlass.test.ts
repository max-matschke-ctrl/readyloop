import { describe, expect, it } from 'vitest';
import { anlassErledigtDurch, nachweisErledigtAnlass } from './anlass';
import type { Nachweis } from './types';

const ANLASS_ERFASST = '2026-11-10T09:00:00.000Z';
const anlass = { geraetPruefartId: 'p1', datum: '2026-11-10', erfasstAm: ANLASS_ERFASST, aufgehobenAm: null };
const n = (
  id: string,
  pruefdatum: string,
  ergebnis: Nachweis['ergebnis'],
  geraetPruefartId = 'p1',
  erfasstAm = '2026-11-20T08:00:00.000Z',
) => ({ id, geraetPruefartId, pruefdatum, ergebnis, erfasstAm });

describe('anlassErledigtDurch (F-10)', () => {
  it('Nachweis ohne_maengel am Anlasstag, nach dem Anlass erfasst → erledigt', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-10', 'ohne_maengel', 'p1', '2026-11-10T10:00:00.000Z')])).toEqual({
      offen: false,
      nachweisId: 'n1',
    });
  });
  it('Befund I2-1: Nachweis am Anlasstag, vor dem Anlass erfasst → offen', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-10', 'ohne_maengel', 'p1', '2026-11-10T08:00:00.000Z')])).toEqual({
      offen: true,
      nachweisId: null,
    });
  });
  it('Befund I2-1: Nachweis am Anlasstag, gleicher Erfassungszeitpunkt → offen (strikt später verlangt)', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-10', 'ohne_maengel', 'p1', ANLASS_ERFASST)]).offen).toBe(true);
  });
  it('Nachweis mit späterem Prüfdatum erledigt unabhängig vom Erfassungszeitpunkt', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-11', 'ohne_maengel', 'p1', '2026-11-09T08:00:00.000Z')]).offen).toBe(false);
  });
  it('Nachweis am Vortag → offen', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-09', 'ohne_maengel')])).toEqual({ offen: true, nachweisId: null });
  });
  it('nicht_bestanden danach → offen', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-12', 'nicht_bestanden')]).offen).toBe(true);
  });
  it('maengel_weiterbetrieb danach → erledigt', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-12', 'maengel_weiterbetrieb')]).offen).toBe(false);
  });
  it('aufgehoben → nicht offen', () => {
    expect(anlassErledigtDurch({ ...anlass, aufgehobenAm: '2026-11-11T10:00:00.000Z' }, []).offen).toBe(false);
  });
  it('Nachweis anderer Prüfart → offen', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-12', 'ohne_maengel', 'p2')]).offen).toBe(true);
  });
  it('frühester erledigender Nachweis wird genannt', () => {
    expect(
      anlassErledigtDurch(anlass, [n('n2', '2026-11-15', 'ohne_maengel'), n('n1', '2026-11-11', 'ohne_maengel')]).nachweisId,
    ).toBe('n1');
  });
  it('gleiches Prüfdatum: früher erfasster erledigender Nachweis wird genannt', () => {
    const spaet = n('a-spaet', '2026-11-12', 'ohne_maengel', 'p1', '2026-11-13T08:00:00.000Z');
    const frueh = n('z-frueh', '2026-11-12', 'ohne_maengel', 'p1', '2026-11-12T08:00:00.000Z');
    expect(anlassErledigtDurch(anlass, [spaet, frueh]).nachweisId).toBe('z-frueh');
  });
});

describe('nachweisErledigtAnlass (F-10)', () => {
  it('Regel je Nachweis', () => {
    expect(nachweisErledigtAnlass(anlass, n('n', '2026-11-10', 'maengel_weiterbetrieb', 'p1', '2026-11-10T09:00:00.001Z'))).toBe(true);
    expect(nachweisErledigtAnlass(anlass, n('n', '2026-11-10', 'nicht_bestanden', 'p1', '2026-11-10T12:00:00.000Z'))).toBe(false);
  });
});
