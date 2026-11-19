import { describe, expect, it } from 'vitest';
import { anlassErledigtDurch } from './anlass';
import type { Nachweis } from './types';

const anlass = { geraetPruefartId: 'p1', datum: '2026-11-10', aufgehobenAm: null };
const n = (id: string, pruefdatum: string, ergebnis: Nachweis['ergebnis'], geraetPruefartId = 'p1') => ({
  id,
  geraetPruefartId,
  pruefdatum,
  ergebnis,
});

describe('anlassErledigtDurch (F-10)', () => {
  it('Nachweis ohne_maengel am Anlasstag → erledigt', () => {
    expect(anlassErledigtDurch(anlass, [n('n1', '2026-11-10', 'ohne_maengel')])).toEqual({ offen: false, nachweisId: 'n1' });
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
});
