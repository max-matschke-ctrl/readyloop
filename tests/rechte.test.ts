import { describe, expect, it } from 'vitest';
import { can, imGeltungsbereich } from '@/domain/rechte';
import { AKTIONEN, ROLLEN, type Aktion, type Rolle } from '@/domain/types';

// requirements.md §6 (Rollenebene, I1-Aktionen)
const MATRIX: Record<Aktion, Record<Rolle, boolean>> = {
  'geraet.lesen':        { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'geraet.anlegen':      { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'frist.freigeben':     { admin: false, sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'nachweis.lesen':      { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'nachweis.erfassen':   { admin: false, sifa: false, verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'pruefaufgaben.lesen': { admin: false, sifa: false, verantwortlicher: false, pruefer: true,  mitarbeiter: false },
  'verlauf.lesen':       { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'katalog.lesen':       { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: true },
  'katalog.freigeben':   { admin: false, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
};

describe('can', () => {
  for (const aktion of AKTIONEN) {
    for (const rolle of ROLLEN) {
      it(`${rolle} × ${aktion} = ${MATRIX[aktion][rolle]}`, () => {
        expect(can(rolle, aktion)).toBe(MATRIX[aktion][rolle]);
      });
    }
  }
});

describe('imGeltungsbereich', () => {
  const benutzer = { id: 'u1', name: 'Test', email: 't@example.org' };
  const sitzung = (rolle: Rolle, bereichIds: string[] = []) => ({ rolle, bereichIds, benutzer });
  const ziel = { bereichId: 'b1', zugewiesenePrueferIds: ['u1'] };
  const fremd = { bereichId: 'b2', zugewiesenePrueferIds: ['u2'] };

  it('admin und sifa: alles', () => {
    for (const r of ['admin', 'sifa'] as const) {
      expect(imGeltungsbereich(sitzung(r), ziel)).toBe(true);
      expect(imGeltungsbereich(sitzung(r), fremd)).toBe(true);
    }
  });
  it('verantwortlicher: nur eigene Bereiche', () => {
    expect(imGeltungsbereich(sitzung('verantwortlicher', ['b1']), ziel)).toBe(true);
    expect(imGeltungsbereich(sitzung('verantwortlicher', ['b1']), fremd)).toBe(false);
    expect(imGeltungsbereich(sitzung('verantwortlicher', []), ziel)).toBe(false);
  });
  it('pruefer: nur zugewiesen', () => {
    expect(imGeltungsbereich(sitzung('pruefer', ['b2']), ziel)).toBe(true);
    expect(imGeltungsbereich(sitzung('pruefer', ['b1']), fremd)).toBe(false);
  });
  it('mitarbeiter: nichts', () => {
    expect(imGeltungsbereich(sitzung('mitarbeiter', ['b1']), ziel)).toBe(false);
  });
});
