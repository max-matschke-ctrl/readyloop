// BE-15: Nutzbarkeit (F-21), Übernahme-Hinweis (F-23), Token-Format (F-24), Übernahme-Verlauf (F-27).
import { describe, expect, it } from 'vitest';
import { imUebernahmeVerlauf, istTokenFormat, nutzungAus, TOKEN_MUSTER, uebernahmeHinweis } from '@/domain/nutzung';
import { berechneStatusImKontext } from '@/domain/status';
import { BETRIEBSSTATUS, FRIST_STATUS, type Betriebsstatus, type FristStatus, type Nutzung } from '@/domain/types';

const ERWARTET_IN_BETRIEB: Record<FristStatus, Nutzung> = {
  ueberfaellig: 'nicht_verwenden',
  vor_nutzung_pruefen: 'nicht_verwenden',
  unbekannt: 'unklar',
  gbu: 'unklar',
  bald_faellig: 'verwendbar',
  ok: 'verwendbar',
};

describe('nutzungAus (F-21)', () => {
  for (const status of FRIST_STATUS) {
    for (const betrieb of BETRIEBSSTATUS) {
      const erwartet: Nutzung = betrieb === 'in_betrieb' ? ERWARTET_IN_BETRIEB[status] : 'nicht_verwenden';
      it(`${status} × ${betrieb} → ${erwartet}`, () => {
        expect(nutzungAus(status, betrieb as Betriebsstatus)).toBe(erwartet);
      });
    }
  }
});

describe('uebernahmeHinweis (F-23)', () => {
  it('Reihenfolge nicht_wechselnd > ausser_betrieb > nicht_verwenden', () => {
    expect(uebernahmeHinweis({ kategorie: 'ortsgebunden', betriebsstatus: 'ausser_betrieb' }, 'nicht_verwenden')).toBe('nicht_wechselnd');
    expect(uebernahmeHinweis({ kategorie: 'personenbezogen', betriebsstatus: 'in_betrieb' }, 'verwendbar')).toBe('nicht_wechselnd');
    expect(uebernahmeHinweis({ kategorie: 'wechselnd', betriebsstatus: 'ausser_betrieb' }, 'nicht_verwenden')).toBe('ausser_betrieb');
    expect(uebernahmeHinweis({ kategorie: 'wechselnd', betriebsstatus: 'in_betrieb' }, 'nicht_verwenden')).toBe('nicht_verwenden');
  });
  it('unklar und verwendbar blockieren nicht', () => {
    expect(uebernahmeHinweis({ kategorie: 'wechselnd', betriebsstatus: 'in_betrieb' }, 'unklar')).toBeNull();
    expect(uebernahmeHinweis({ kategorie: 'wechselnd', betriebsstatus: 'in_betrieb' }, 'verwendbar')).toBeNull();
  });
});

describe('istTokenFormat (F-24)', () => {
  it('22 Zeichen base64url → true', () => {
    expect(istTokenFormat('demoL001xxxxxxxxxxxxxx')).toBe(true);
    expect(istTokenFormat('AbC-_09zZyY8xX7wW6vV5u')).toBe(true);
  });
  it('21/23 Zeichen, +, /, = und leer → false', () => {
    expect(istTokenFormat('a'.repeat(21))).toBe(false);
    expect(istTokenFormat('a'.repeat(23))).toBe(false);
    expect(istTokenFormat('a'.repeat(21) + '+')).toBe(false);
    expect(istTokenFormat('a'.repeat(21) + '/')).toBe(false);
    expect(istTokenFormat('a'.repeat(21) + '=')).toBe(false);
    expect(istTokenFormat('')).toBe(false);
    expect(istTokenFormat('a'.repeat(22) + '\n')).toBe(false);
  });
  it('Muster entspricht dem DB-Check', () => {
    expect(TOKEN_MUSTER.source).toBe('^[A-Za-z0-9_-]{22}$');
  });
});

describe('imUebernahmeVerlauf (F-27)', () => {
  const jetzt = new Date('2026-11-19T12:00:00Z');
  const vorTagen = (t: number) => new Date(jetzt.getTime() - t * 86_400_000).toISOString();
  it('offen → false', () => {
    expect(imUebernahmeVerlauf({ bis: null, benutzerId: 'u1' }, jetzt)).toBe(false);
  });
  it('bis vor 89 Tagen → true', () => {
    expect(imUebernahmeVerlauf({ bis: vorTagen(89), benutzerId: 'u1' }, jetzt)).toBe(true);
  });
  it('bis vor 91 Tagen → false', () => {
    expect(imUebernahmeVerlauf({ bis: vorTagen(91), benutzerId: 'u1' }, jetzt)).toBe(false);
  });
  it('benutzerId null (pseudonymisiert) → false', () => {
    expect(imUebernahmeVerlauf({ bis: vorTagen(1), benutzerId: null }, jetzt)).toBe(false);
  });
  it('eigene Frist', () => {
    expect(imUebernahmeVerlauf({ bis: vorTagen(10), benutzerId: 'u1' }, jetzt, 7)).toBe(false);
  });
});

// Gegenstück zu tests/sql/rls-szenario-i3m.sql, Abschnitt „Übernahme-Sperre“ (app.geraet_nicht_verwenden): gleiche Fälle,
// gleiche Erwartung in Domäne (src/domain/status.ts) und Datenbank.
describe('Übernahme-Sperre wie SQL-Szenario (nicht bestanden, Monatsende)', () => {
  const frist = { monate: 13 };
  const kontext = { betriebsstatus: 'in_betrieb' as const, anlassOffen: false, nichtBestanden: false };
  const sperre = (status: FristStatus) =>
    uebernahmeHinweis({ kategorie: 'wechselnd', betriebsstatus: 'in_betrieb' }, nutzungAus(status, 'in_betrieb'));

  it('31.01.2026 + 13 Monate = 28.02.2027: am Fälligkeitstag übernehmbar, am 01.03. gesperrt', () => {
    const amTag = berechneStatusImKontext({ frist, letztePruefung: '2026-01-31' }, '2027-02-28', kontext);
    expect(amTag).toMatchObject({ faelligAm: '2027-02-28', restTage: 0 });
    expect(sperre(amTag.status)).toBeNull();
    const danach = berechneStatusImKontext({ frist, letztePruefung: '2026-01-31' }, '2027-03-01', kontext);
    expect(danach.status).toBe('ueberfaellig');
    expect(sperre(danach.status)).toBe('nicht_verwenden');
  });

  it('letzter Nachweis nicht bestanden sperrt trotz gültiger Frist', () => {
    const s = berechneStatusImKontext({ frist: { monate: 12 }, letztePruefung: '2026-10-21' }, '2026-11-20', { ...kontext, nichtBestanden: true });
    expect(s).toMatchObject({ status: 'vor_nutzung_pruefen', grund: 'nicht_bestanden' });
    expect(sperre(s.status)).toBe('nicht_verwenden');
  });
});
