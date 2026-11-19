import { describe, expect, it } from 'vitest';
import { qualifikationsWarnung } from './qualifikation';

describe('qualifikationsWarnung (F-15)', () => {
  it("Prüfer ['efk'], gefordert ['zbp'] → Warnung mit beiden Labels", () => {
    const w = qualifikationsWarnung(['efk'], ['zbp']);
    expect(w).toContain('Zur Prüfung befähigte Person');
    expect(w).toContain('Elektrofachkraft');
  });
  it('US-21: Text nennt gefordert und hinterlegt', () => {
    expect(qualifikationsWarnung(['efk', 'sachkundiger'], ['zbp'])).toContain(
      'gefordert: Zur Prüfung befähigte Person; hinterlegt: Elektrofachkraft, Sachkundiger',
    );
  });
  it('gefordert leer → null', () => expect(qualifikationsWarnung(['efk'], [])).toBeNull());
  it('kein Eintrag (null) → null', () => expect(qualifikationsWarnung([], null)).toBeNull());
  it('passender Typ → null', () => expect(qualifikationsWarnung(['efk', 'zbp'], ['zbp', 'sachkundiger'])).toBeNull());
  it('Prüfer ohne Typen bei gefordertem Typ → „keine Qualifikation hinterlegt“', () => {
    expect(qualifikationsWarnung([], ['zbp'])).toContain('keine Qualifikation hinterlegt');
  });
});
