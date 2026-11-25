import { describe, expect, it } from 'vitest';
import { can, darfAbbestellen, darfEinladen, darfVerschieben, imGeltungsbereich, istMeinGeraet } from '@/domain/rechte';
import {
  ABBESTELLBARE_MAIL_ARTEN,
  AKTIONEN,
  EINLADBARE_ROLLEN,
  MAIL_ART_FUER_ROLLE,
  MAIL_ARTEN,
  ROLLEN,
  type Aktion,
  type MailArt,
  type Rolle,
} from '@/domain/types';

// requirements.md §6 (Rollenebene, Stand I3) – vollständige Matrix Aktion × Rolle
const MATRIX: Record<Aktion, Record<Rolle, boolean>> = {
  'geraet.lesen':        { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'geraet.anlegen':      { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'geraet.bearbeiten':   { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'frist.freigeben':     { admin: false, sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'nachweis.lesen':      { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'nachweis.erfassen':   { admin: false, sifa: false, verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'pruefaufgaben.lesen': { admin: false, sifa: false, verantwortlicher: false, pruefer: true,  mitarbeiter: false },
  'pruefer.zuweisen':    { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'anlass.erfassen':     { admin: false, sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'mangel.lesen':        { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: false },
  'mangel.erfassen':     { admin: false, sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: true },
  'mangel.bearbeiten':   { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'verlauf.lesen':       { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'katalog.lesen':       { admin: true,  sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: true },
  'katalog.freigeben':   { admin: false, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'bereich.verwalten':   { admin: true,  sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'mitglied.verwalten':  { admin: true,  sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'meine_geraete.lesen': { admin: false, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: true },
  'geraet.suchen':       { admin: false, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: true },
  'geraet.uebernehmen':  { admin: false, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: true },
  'geraet.zuordnen':     { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'uebernahmen.lesen':   { admin: true,  sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'etikett.verwalten':   { admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'mitarbeiter.einladen':{ admin: true,  sifa: false, verantwortlicher: true,  pruefer: false, mitarbeiter: false },
  'erinnerung.einstellen':  { admin: true, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'erinnerung.protokoll':   { admin: true, sifa: true,  verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'mail.vorschau':          { admin: true, sifa: false, verantwortlicher: false, pruefer: false, mitarbeiter: false },
  'benachrichtigung.eigene':{ admin: true, sifa: true,  verantwortlicher: true,  pruefer: true,  mitarbeiter: true },
};

describe('can', () => {
  it('Matrix deckt alle Aktionen ab', () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...AKTIONEN].sort());
  });
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

describe('darfVerschieben (F-16)', () => {
  const s = (rolle: Rolle, bereichIds: string[] = []) => ({ rolle, bereichIds });

  it('admin: jeder Bereich', () => {
    expect(darfVerschieben(s('admin'), 'lager', 'produktion')).toBe(true);
  });
  it('verantwortlicher: nur eigener → eigener Bereich', () => {
    const ver = s('verantwortlicher', ['lager', 'versand']);
    expect(darfVerschieben(ver, 'lager', 'versand')).toBe(true);
    expect(darfVerschieben(ver, 'lager', 'produktion')).toBe(false);
    expect(darfVerschieben(ver, 'produktion', 'lager')).toBe(false);
    expect(darfVerschieben(s('verantwortlicher', ['lager']), 'lager', 'produktion')).toBe(false);
  });
  it('sifa, pruefer, mitarbeiter: nie', () => {
    for (const r of ['sifa', 'pruefer', 'mitarbeiter'] as const) {
      expect(darfVerschieben(s(r, ['lager', 'produktion']), 'lager', 'produktion')).toBe(false);
    }
  });
});

describe('darfEinladen (F-20)', () => {
  it('admin: jede einladbare Rolle', () => {
    for (const r of EINLADBARE_ROLLEN) expect(darfEinladen('admin', r)).toBe(true);
  });
  it('verantwortlicher: nur mitarbeiter', () => {
    for (const r of ROLLEN) expect(darfEinladen('verantwortlicher', r)).toBe(r === 'mitarbeiter');
  });
  it('sifa, pruefer, mitarbeiter: nie', () => {
    for (const r of ['sifa', 'pruefer', 'mitarbeiter'] as const) {
      for (const ziel of ROLLEN) expect(darfEinladen(r, ziel)).toBe(false);
    }
  });
});

describe('istMeinGeraet (F-22/F-23)', () => {
  it('zugeordnet → true', () => {
    expect(istMeinGeraet('u1', { zugeordnetAn: 'u1' }, null)).toBe(true);
  });
  it('offene eigene Übernahme → true', () => {
    expect(istMeinGeraet('u1', { zugeordnetAn: null }, { benutzerId: 'u1' })).toBe(true);
  });
  it('fremde Zuordnung oder fremde Übernahme → false', () => {
    expect(istMeinGeraet('u1', { zugeordnetAn: 'u2' }, null)).toBe(false);
    expect(istMeinGeraet('u1', { zugeordnetAn: null }, { benutzerId: 'u2' })).toBe(false);
    expect(istMeinGeraet('u1', { zugeordnetAn: null }, null)).toBe(false);
    expect(istMeinGeraet('u1', { zugeordnetAn: null }, { benutzerId: null })).toBe(false);
  });
});

describe('darfAbbestellen (F-40)', () => {
  const erlaubt: Partial<Record<Rolle, MailArt>> = { pruefer: 'pruefer_woche', mitarbeiter: 'ma_hinweis' };
  for (const rolle of ROLLEN) {
    for (const art of MAIL_ARTEN) {
      const erwartet = erlaubt[rolle] === art;
      it(`${rolle} × ${art} = ${erwartet}`, () => {
        expect(darfAbbestellen(rolle, art)).toBe(erwartet);
      });
    }
  }
  it('frist_digest ist für niemanden abbestellbar', () => {
    for (const rolle of ROLLEN) expect(darfAbbestellen(rolle, 'frist_digest')).toBe(false);
    expect(ABBESTELLBARE_MAIL_ARTEN).not.toContain('frist_digest');
  });
});

describe('MAIL_ART_FUER_ROLLE (F-30)', () => {
  it('deckt alle Rollen ab, genau eine Art je Rolle', () => {
    expect(Object.keys(MAIL_ART_FUER_ROLLE).sort()).toEqual([...ROLLEN].sort());
    for (const rolle of ROLLEN) expect(MAIL_ARTEN).toContain(MAIL_ART_FUER_ROLLE[rolle]);
  });
  it('ADM, SIF, VER erhalten die Pflichtmail', () => {
    for (const r of ['admin', 'sifa', 'verantwortlicher'] as const) expect(MAIL_ART_FUER_ROLLE[r]).toBe('frist_digest');
  });
});
