// BE-25: Dienste I3 gegen das Demo-Repository – Einstellungen (F-39), Benachrichtigungen/Abmeldung (F-40),
// Versandprotokoll mit Maskierung (F-41), Abmeldung per Token (F-40/F-43), Vorschau (F-37).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { erinnerungEinstellungSchema } from '@/domain/schemas';
import { PFLICHTMAIL_BEGRUENDUNG, type DemoRolle, type Sitzung } from '@/domain/types';
import { sitzungFuerDemoRolle } from '@/server/dienste';
import {
  abmeldenPerToken,
  holeAbmeldeSeite,
  holeEigeneBenachrichtigungen,
  holeErinnerungEinstellung,
  listeErinnerungEinstellungen,
  listeMailProtokoll,
  mailVorschauSeite,
  setzeBenachrichtigung,
  speichereErinnerungEinstellung,
  WARNUNG_OHNE_VER,
} from '@/server/dienste-erinnerungen';
import { fuehreErinnerungslaufAus } from '@/server/erinnerungen/lauf';
import { abmeldeToken } from '@/server/mail/abmelden';
import { leereVorschau, vorschauAdapter } from '@/server/mail/vorschau';
import { DEMO_BENUTZER_IDS, DEMO_BEREICH_IDS, DEMO_ORG2_ID, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { demoStandVon, erzeugeDemoRepository, type DemoRepository } from '@/server/repo/demo/repository';
import { DemoSystemRepository } from '@/server/repo/demo/system-repository';

const HEUTE = '2026-11-30';
const JETZT = new Date('2026-11-30T09:00:00Z');
const B = DEMO_BENUTZER_IDS;
let repo: DemoRepository;
let system: DemoSystemRepository;

beforeEach(() => {
  repo = erzeugeDemoRepository(HEUTE);
  system = new DemoSystemRepository(demoStandVon(repo));
  leereVorschau();
  vi.stubEnv('MAIL_ABMELDE_SECRET', 'x'.repeat(40));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const sitzung = async (rolle: DemoRolle): Promise<Sitzung> => (await sitzungFuerDemoRolle(repo, rolle))!;
const formular = (werte: Record<string, unknown>) =>
  erinnerungEinstellungSchema.parse({
    bereichId: DEMO_BEREICH_IDS.produktion,
    staffel: ['60', '30', '14'],
    eskalationVerantwortlicher: '0',
    eskalationSifa: '3',
    eskalationAdmin: '10',
    sifaInKopie: undefined,
    sifaAuswahl: 'alle',
    sifaEmpfaenger: [],
    adminAuswahl: 'alle',
    adminEmpfaenger: [],
    ...werte,
  });

describe('Einstellungen je Bereich (F-39)', () => {
  it('Übersicht: je Bereich der Organisation, alphabetisch; Produktion angepasst, Lager Standard', async () => {
    const liste = await listeErinnerungEinstellungen(await sitzung('admin'), repo);
    expect(liste.map((a) => a.bereich.name)).toEqual(['Lager', 'Produktion', 'Verwaltung']);
    const prod = liste.find((a) => a.bereich.id === DEMO_BEREICH_IDS.produktion)!;
    expect(prod.einstellung).toMatchObject({
      staffelTage: [60, 30, 14],
      eskalationTage: { verantwortlicher: 0, sifa: 3, admin: 10 },
      sifaInKopie: false,
      adminEmpfaengerIds: [B.katrin],
      standard: false,
      geaendertVonName: 'Katrin Vogel',
    });
    expect(prod.verantwortliche.map((p) => p.name)).toEqual(['Sabine Krüger']);
    const lager = liste.find((a) => a.bereich.id === DEMO_BEREICH_IDS.lager)!;
    expect(lager.einstellung.standard).toBe(true);
    expect(lager.einstellung.staffelTage).toEqual([90, 60, 30]);
    const verwaltung = liste.find((a) => a.bereich.name === 'Verwaltung')!;
    expect(verwaltung.warnungen).toContain(WARNUNG_OHNE_VER);
    expect(lager.sifaOptionen.map((p) => p.name)).toEqual(['Dr. Jens Hartmann']);
    expect(lager.adminOptionen.map((p) => p.name)).toEqual(['Katrin Vogel']);
  });

  it('nur ADM; fremder Bereich → null', async () => {
    expect(await listeErinnerungEinstellungen(await sitzung('sifa'), repo)).toEqual([]);
    expect(await holeErinnerungEinstellung(await sitzung('admin'), repo, DEMO_BEREICH_IDS.werkstatt)).toBeNull();
  });

  it('speichern Produktion → Ereignis erinnerung_einstellung_gespeichert mit alt/neu', async () => {
    const adm = await sitzung('admin');
    const r = await speichereErinnerungEinstellung(adm, repo, formular({ staffel: ['30', '90'], sifaInKopie: 'on' }), DEMO_BEREICH_IDS.produktion, JETZT);
    expect(r).toEqual({ status: 'ok', meldung: 'Erinnerungen gespeichert', id: DEMO_BEREICH_IDS.produktion });
    const [e] = (await repo.listeEreignisse(DEMO_ORG_ID)).filter((x) => x.typ === 'erinnerung_einstellung_gespeichert').sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
    expect(e).toMatchObject({ geraetId: null, akteurId: B.katrin, zeitpunkt: JETZT.toISOString() });
    expect(e.daten).toMatchObject({
      bereichId: DEMO_BEREICH_IDS.produktion,
      bereich: 'Produktion',
      alt: { staffelTage: [60, 30, 14], sifaInKopie: false },
      neu: { staffelTage: [90, 30], sifaInKopie: true, adminEmpfaengerIds: null, standard: false },
    });
  });

  it('zurücksetzen speichert Standard (standard = true) mit Ereignis', async () => {
    const r = await speichereErinnerungEinstellung(await sitzung('admin'), repo, 'standard', DEMO_BEREICH_IDS.produktion, JETZT);
    expect(r.meldung).toBe('Auf Standard zurückgesetzt');
    const e = (await repo.listeErinnerungEinstellungen(DEMO_ORG_ID)).find((x) => x.bereichId === DEMO_BEREICH_IDS.produktion)!;
    expect(e).toMatchObject({ standard: true, staffelTage: [90, 60, 30], sifaEmpfaengerIds: null, adminEmpfaengerIds: null });
  });

  it('SIF-Auswahl mit VER-ID → Feldfehler; ADM-Auswahl mit Admin anderer Organisation → Feldfehler', async () => {
    const adm = await sitzung('admin');
    const r = await speichereErinnerungEinstellung(adm, repo, formular({ sifaAuswahl: 'auswahl', sifaEmpfaenger: [B.marco] }), DEMO_BEREICH_IDS.produktion, JETZT);
    expect(r.status).toBe('fehler');
    expect(r.feldfehler?.sifaEmpfaenger?.[0]).toMatch(/aktive Sifa/);
    const r2 = await speichereErinnerungEinstellung(adm, repo, formular({ adminAuswahl: 'auswahl', adminEmpfaenger: ['40000000-0000-4000-8000-000000000007'] }), DEMO_BEREICH_IDS.produktion, JETZT);
    expect(r2.feldfehler?.adminEmpfaenger).toBeDefined();
  });

  it('VER/SIF → abgelehnt, nichts gespeichert', async () => {
    const vorher = await repo.listeErinnerungEinstellungen(DEMO_ORG_ID);
    for (const rolle of ['verantwortlicher', 'sifa'] as const) {
      const r = await speichereErinnerungEinstellung(await sitzung(rolle), repo, formular({}), DEMO_BEREICH_IDS.produktion, JETZT);
      expect(r.status).toBe('fehler');
    }
    expect(await repo.listeErinnerungEinstellungen(DEMO_ORG_ID)).toEqual(vorher);
  });
});

describe('Eigene Benachrichtigungen und Abmeldung (F-40)', () => {
  it('VER: Pflichtmail mit Begründung, Regeln nur eigener Bereich', async () => {
    const b = await holeEigeneBenachrichtigungen(await sitzung('verantwortlicher'), repo, 'vorschau');
    expect(b.benachrichtigung).toMatchObject({ art: 'frist_digest', abbestellbar: false, abgemeldet: false, pflichtBegruendung: PFLICHTMAIL_BEGRUENDUNG });
    expect(b.bereichsRegeln.map((r) => r.bereichName)).toEqual(['Lager']);
    expect(b.mailModus).toBe('vorschau');
  });
  it('SIF/ADM: Regeln aller Bereiche; PRF/MA: keine Regeln', async () => {
    expect((await holeEigeneBenachrichtigungen(await sitzung('sifa'), repo, 'resend')).bereichsRegeln).toHaveLength(3);
    const prf = await holeEigeneBenachrichtigungen(await sitzung('pruefer'), repo, 'resend');
    expect(prf.bereichsRegeln).toEqual([]);
    expect(prf.benachrichtigung).toMatchObject({ art: 'pruefer_woche', abbestellbar: true, pflichtBegruendung: null });
  });
  it('PRF bestellt pruefer_woche ab und wieder an; ma_hinweis → abgelehnt; VER frist_digest → abgelehnt', async () => {
    const prf = await sitzung('pruefer');
    expect(await setzeBenachrichtigung(prf, repo, 'pruefer_woche', true, JETZT)).toEqual({ status: 'ok', meldung: 'Abbestellt' });
    expect((await holeEigeneBenachrichtigungen(prf, repo, 'resend')).benachrichtigung.abgemeldet).toBe(true);
    expect(await setzeBenachrichtigung(prf, repo, 'pruefer_woche', false, JETZT)).toEqual({ status: 'ok', meldung: 'Wieder bestellt' });
    expect((await setzeBenachrichtigung(prf, repo, 'ma_hinweis', true, JETZT)).meldung).toBe('Diese Mail kann nicht abbestellt werden.');
    const ver = await sitzung('verantwortlicher');
    // frist_digest ist kein AbbestellbareMailArt – auch ein manipulierter Aufruf wird abgelehnt
    expect((await setzeBenachrichtigung(ver, repo, 'frist_digest' as never, true, JETZT)).status).toBe('fehler');
  });
  it('PRF abgemeldet → im nächsten Montagslauf keine Wochenübersicht für diesen Betrieb', async () => {
    await setzeBenachrichtigung(await sitzung('pruefer'), repo, 'pruefer_woche', true, JETZT);
    await fuehreErinnerungslaufAus(system, vorschauAdapter(), { heute: HEUTE, jetzt: JETZT, ausloeser: 'manuell', warte: async () => {} });
    const stand = demoStandVon(repo);
    expect(stand.mailVersand.filter((v) => v.laufDatum === HEUTE && v.empfaengerBenutzerId === B.tobias && v.organisationId === DEMO_ORG_ID)).toEqual([]);
  });
});

describe('Abmeldung per Token ohne Sitzung', () => {
  it('Seite zeigt Betrieb und Art; Abbestellen und wieder Anbestellen', async () => {
    const t = abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: B.jonas, art: 'ma_hinweis' });
    expect(await holeAbmeldeSeite(system, t)).toEqual({
      token: t,
      organisationName: 'Elbtal Fördertechnik GmbH',
      art: 'ma_hinweis',
      artLabel: 'Hinweis „Nicht verwenden“',
      abgemeldet: false,
    });
    expect(await abmeldenPerToken(system, t, true, JETZT)).toEqual({ status: 'ok', meldung: 'Sie erhalten diese Mails nicht mehr.' });
    expect((await holeAbmeldeSeite(system, t))!.abgemeldet).toBe(true);
    expect((await abmeldenPerToken(system, t, false, JETZT)).meldung).toBe('Sie erhalten diese Mails wieder.');
  });
  it('ungültiger Token, falsche Rolle oder fremde Organisation → „Dieser Link ist nicht gültig.“', async () => {
    expect(await holeAbmeldeSeite(system, 'kaputt.kaputt')).toBeNull();
    expect((await abmeldenPerToken(system, 'kaputt.kaputt', true, JETZT)).meldung).toBe('Dieser Link ist nicht gültig.');
    const falscheRolle = abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: B.marco, art: 'pruefer_woche' });
    expect(await holeAbmeldeSeite(system, falscheRolle)).toBeNull();
    expect((await abmeldenPerToken(system, falscheRolle, true, JETZT)).status).toBe('fehler');
    const fremd = abmeldeToken({ organisationId: DEMO_ORG2_ID, benutzerId: B.jonas, art: 'ma_hinweis' });
    expect(await holeAbmeldeSeite(system, fremd)).toBeNull();
  });
});

describe('Versandprotokoll (F-41)', () => {
  it('als SIF: MA-Hinweis maskiert (empfaenger null, posten []), Bounce-Zeile des Prüfers mit Name', async () => {
    const seite = await listeMailProtokoll(await sitzung('sifa'), repo, HEUTE, {}, 'vorschau');
    expect(seite.filter).toMatchObject({ von: '2026-10-31', bis: HEUTE, seite: 1 });
    expect(seite.gesamt).toBe(3);
    expect(seite.eintraege.map((e) => e.laufDatum)).toEqual([...seite.eintraege.map((e) => e.laufDatum)].sort().reverse());
    const ma = seite.eintraege.find((e) => e.art === 'ma_hinweis')!;
    expect(ma).toMatchObject({ empfaenger: null, posten: [], status: 'versendet', postenAnzahl: 1 });
    const bounce = seite.eintraege.find((e) => e.status === 'bounce')!;
    expect(bounce.empfaenger).toEqual({ name: 'Tobias Berger', rolle: 'pruefer' });
    const frist = seite.eintraege.find((e) => e.art === 'frist_digest')!;
    expect(frist.empfaenger).toEqual({ name: 'Marco Lindner', rolle: 'verantwortlicher' });
    expect(frist.posten).toHaveLength(2);
    expect(frist.posten[0]).toMatchObject({ bereichName: 'Lager', stufe: 'v90', stufeLabel: 'Vorlauf 90 Tage', rolle: 'zustaendig' });
    expect(frist.posten[0].faelligAm).not.toBeNull();
    expect(seite.letzterLauf?.status).toBe('fertig');
    expect(JSON.stringify(seite)).not.toContain('Aylin');
  });
  it('MA-Hinweis mit Problem-Status zeigt den Namen', async () => {
    const stand = demoStandVon(repo);
    stand.mailVersand.find((v) => v.art === 'ma_hinweis')!.status = 'fehler';
    const seite = await listeMailProtokoll(await sitzung('admin'), repo, HEUTE, {}, 'resend');
    expect(seite.eintraege.find((e) => e.art === 'ma_hinweis')!.empfaenger).toEqual({ name: 'Aylin Demir', rolle: 'mitarbeiter' });
    expect(seite.eintraege.find((e) => e.art === 'ma_hinweis')!.posten).toEqual([]);
  });
  it('Filter „probleme“ nur Bounce; Filter Bereich Lager nur Mails mit Lager-Posten; Art-Filter', async () => {
    const sif = await sitzung('sifa');
    expect((await listeMailProtokoll(sif, repo, HEUTE, { status: 'probleme' }, 'resend')).eintraege.map((e) => e.status)).toEqual(['bounce']);
    const lager = await listeMailProtokoll(sif, repo, HEUTE, { bereichId: DEMO_BEREICH_IDS.lager }, 'resend');
    expect(lager.eintraege.map((e) => e.art)).toEqual(['frist_digest']);
    expect((await listeMailProtokoll(sif, repo, HEUTE, { art: 'pruefer_woche' }, 'resend')).gesamt).toBe(1);
    expect((await listeMailProtokoll(sif, repo, HEUTE, { von: '2026-11-29', bis: HEUTE }, 'resend')).gesamt).toBe(1);
  });
  it('VER, PRF, MA → kein Recht', async () => {
    for (const rolle of ['verantwortlicher', 'pruefer', 'mitarbeiter'] as const) {
      await expect(listeMailProtokoll(await sitzung(rolle), repo, HEUTE, {}, 'resend')).rejects.toThrow();
    }
  });
});

describe('Mail-Vorschau (F-37)', () => {
  it('nur ADM; nur Mails der aktuellen Organisation', async () => {
    await fuehreErinnerungslaufAus(system, vorschauAdapter(), { heute: HEUTE, jetzt: JETZT, ausloeser: 'manuell', warte: async () => {} });
    const seite = mailVorschauSeite(await sitzung('admin'), HEUTE, true);
    expect(seite.mails.length).toBeGreaterThan(0);
    expect(seite.mails.every((m) => m.organisationName === 'Elbtal Fördertechnik GmbH')).toBe(true);
    expect(seite.datumWaehlbar).toBe(true);
    const sif = await sitzung('sifa');
    expect(() => mailVorschauSeite(sif, HEUTE, true)).toThrow();
  });
});
