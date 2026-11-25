// BE-26: Datenzugriff und Actions I3 im Demo-Modus (Recht, Validierung mit Formularfeldnamen, Vorschau-Lauf, Token).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieJar = new Map<string, { value: string }>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined),
    getAll: () => [...cookieJar.entries()].map(([name, v]) => ({ name, value: v.value })),
    set: (name: string, value: string) => cookieJar.set(name, { value }),
    delete: (arg: string | { name: string }) => cookieJar.delete(typeof arg === 'string' ? arg : arg.name),
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
const revalidiert: string[] = [];
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidiert.push(p) }));

import { INITIAL_ACTION_STATE, type DemoRolle } from '@/domain/types';
import {
  benachrichtigungSetzen,
  erinnerungEinstellungSpeichern,
  erinnerungEinstellungZuruecksetzen,
  erinnerungslaufStarten,
  mailAbmeldenPerToken,
} from '@/server/actions';
import {
  holeAbmeldeSeite,
  holeEigeneBenachrichtigungen,
  holeErinnerungEinstellung,
  holeMailVorschau,
  listeErinnerungEinstellungen,
  listeMailProtokoll,
  mailModus,
} from '@/server/data';
import { abmeldeToken } from '@/server/mail/abmelden';
import { leereVorschau } from '@/server/mail/vorschau';
import { DEMO_BENUTZER_IDS, DEMO_BEREICH_IDS, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { demoRepository, demoStandVon } from '@/server/repo/demo/repository';
import { DEMO_COOKIE } from '@/server/sitzung';

const SPEICHER = globalThis as { __readyloopDemoRepository?: unknown };
const als = (rolle: DemoRolle) => cookieJar.set(DEMO_COOKIE, { value: rolle });
const form = (werte: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(werte)) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  return fd;
};
async function fehlerVon(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return (e as Error).message;
  }
  return 'kein Fehler';
}
const einstellung = (extra: Record<string, string | string[]> = {}) =>
  form({
    bereichId: DEMO_BEREICH_IDS.lager,
    staffel: ['60', '', '30'],
    eskalationVerantwortlicher: '0',
    eskalationSifa: '5',
    eskalationAdmin: '10',
    sifaInKopie: 'on',
    sifaAuswahl: 'alle',
    adminAuswahl: 'alle',
    ...extra,
  });

beforeEach(() => {
  cookieJar.clear();
  revalidiert.length = 0;
  SPEICHER.__readyloopDemoRepository = undefined;
  leereVorschau();
  for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'RESEND_API_KEY', 'MAIL_ABSENDER']) vi.stubEnv(k, '');
  vi.stubEnv('MAIL_ABMELDE_SECRET', 'm'.repeat(40));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('data.ts I3', () => {
  it('mailModus im Demo-Modus = vorschau', () => {
    expect(mailModus()).toBe('vorschau');
  });
  it('Einstellungen nur ADM (sonst notFound); fremder Bereich → null', async () => {
    als('admin');
    expect((await listeErinnerungEinstellungen()).map((a) => a.bereich.name)).toEqual(['Lager', 'Produktion', 'Verwaltung']);
    expect(await holeErinnerungEinstellung(DEMO_BEREICH_IDS.werkstatt)).toBeNull();
    als('sifa');
    expect(await fehlerVon(listeErinnerungEinstellungen())).toBe('NOT_FOUND');
  });
  it('ohne Sitzung → Login', async () => {
    expect(await fehlerVon(holeEigeneBenachrichtigungen())).toBe('REDIRECT:/login');
  });
  it('Protokoll nur ADM/SIF (VER → notFound)', async () => {
    als('sifa');
    expect((await listeMailProtokoll({})).gesamt).toBe(3);
    als('verantwortlicher');
    expect(await fehlerVon(listeMailProtokoll({}))).toBe('NOT_FOUND');
  });
  it('Vorschau nur ADM im Modus vorschau; Datum wählbar im Demo-Modus', async () => {
    als('admin');
    expect((await holeMailVorschau()).datumWaehlbar).toBe(true);
    als('sifa');
    expect(await fehlerVon(holeMailVorschau())).toBe('NOT_FOUND');
  });
  it('Abmeldeseite ohne Sitzung; ungültig → null, nie Redirect', async () => {
    const t = abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: DEMO_BENUTZER_IDS.jonas, art: 'ma_hinweis' });
    expect((await holeAbmeldeSeite(t))?.organisationName).toBe('Elbtal Fördertechnik GmbH');
    expect(await holeAbmeldeSeite('kurz')).toBeNull();
    expect(await holeAbmeldeSeite(`${t}x`)).toBeNull();
  });
});

describe('erinnerungEinstellungSpeichern / Zuruecksetzen', () => {
  it('ADM speichert (leere Staffelfelder ignoriert) und revalidiert', async () => {
    als('admin');
    const r = await erinnerungEinstellungSpeichern(INITIAL_ACTION_STATE, einstellung());
    expect(r).toEqual({ status: 'ok', meldung: 'Erinnerungen gespeichert', id: DEMO_BEREICH_IDS.lager });
    expect(revalidiert).toEqual(['/admin/erinnerungen', `/admin/erinnerungen/${DEMO_BEREICH_IDS.lager}`]);
    expect((await holeErinnerungEinstellung(DEMO_BEREICH_IDS.lager))!.einstellung).toMatchObject({
      staffelTage: [60, 30],
      eskalationTage: { verantwortlicher: 0, sifa: 5, admin: 10 },
      sifaInKopie: true,
      standard: false,
    });
  });
  it('Feldfehler mit Formularfeldnamen', async () => {
    als('admin');
    const r = await erinnerungEinstellungSpeichern(
      INITIAL_ACTION_STATE,
      einstellung({ staffel: ['30', '30'], eskalationSifa: '20', eskalationAdmin: '10', sifaAuswahl: 'auswahl' }),
    );
    expect(r.status).toBe('fehler');
    expect(Object.keys(r.feldfehler ?? {}).sort()).toEqual(['eskalationAdmin', 'sifaEmpfaenger', 'staffel']);
    const r2 = await erinnerungEinstellungSpeichern(INITIAL_ACTION_STATE, einstellung({ adminAuswahl: 'auswahl', adminEmpfaenger: DEMO_BENUTZER_IDS.marco }));
    expect(r2.feldfehler?.adminEmpfaenger).toBeDefined();
    const r3 = await erinnerungEinstellungSpeichern(INITIAL_ACTION_STATE, einstellung({ eskalationAdmin: '91' }));
    expect(r3.feldfehler?.eskalationAdmin).toBeDefined();
    expect(revalidiert).toEqual([]);
  });
  it('kein Recht für SIF/VER; Zurücksetzen durch ADM', async () => {
    als('sifa');
    expect((await erinnerungEinstellungSpeichern(INITIAL_ACTION_STATE, einstellung())).status).toBe('fehler');
    als('verantwortlicher');
    expect((await erinnerungEinstellungZuruecksetzen(INITIAL_ACTION_STATE, form({ bereichId: DEMO_BEREICH_IDS.produktion }))).status).toBe('fehler');
    als('admin');
    expect(await erinnerungEinstellungZuruecksetzen(INITIAL_ACTION_STATE, form({ bereichId: DEMO_BEREICH_IDS.produktion }))).toEqual({
      status: 'ok',
      meldung: 'Auf Standard zurückgesetzt',
      id: DEMO_BEREICH_IDS.produktion,
    });
  });
});

describe('benachrichtigungSetzen / mailAbmeldenPerToken', () => {
  it('PRF: ab- und anbestellen; ungültige Art → nicht abbestellbar', async () => {
    als('pruefer');
    expect(await benachrichtigungSetzen(INITIAL_ACTION_STATE, form({ art: 'pruefer_woche', abgemeldet: 'ja' }))).toEqual({ status: 'ok', meldung: 'Abbestellt' });
    expect((await holeEigeneBenachrichtigungen()).benachrichtigung.abgemeldet).toBe(true);
    expect(revalidiert).toContain('/einstellungen/benachrichtigungen');
    expect(await benachrichtigungSetzen(INITIAL_ACTION_STATE, form({ art: 'pruefer_woche', abgemeldet: 'nein' }))).toEqual({ status: 'ok', meldung: 'Wieder bestellt' });
    expect((await benachrichtigungSetzen(INITIAL_ACTION_STATE, form({ art: 'frist_digest', abgemeldet: 'ja' }))).meldung).toBe('Diese Mail kann nicht abbestellt werden.');
    expect((await benachrichtigungSetzen(INITIAL_ACTION_STATE, form({ art: 'ma_hinweis', abgemeldet: 'ja' }))).meldung).toBe('Diese Mail kann nicht abbestellt werden.');
  });
  it('Token-Abmeldung ohne Sitzung; ungültig → „Dieser Link ist nicht gültig.“', async () => {
    const t = abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: DEMO_BENUTZER_IDS.jonas, art: 'ma_hinweis' });
    expect(await mailAbmeldenPerToken(INITIAL_ACTION_STATE, form({ t, aktion: 'abmelden' }))).toEqual({ status: 'ok', meldung: 'Sie erhalten diese Mails nicht mehr.' });
    expect((await holeAbmeldeSeite(t))!.abgemeldet).toBe(true);
    expect((await mailAbmeldenPerToken(INITIAL_ACTION_STATE, form({ t, aktion: 'anmelden' }))).meldung).toBe('Sie erhalten diese Mails wieder.');
    expect((await mailAbmeldenPerToken(INITIAL_ACTION_STATE, form({ t: 'x'.repeat(30), aktion: 'abmelden' }))).meldung).toBe('Dieser Link ist nicht gültig.');
    expect((await mailAbmeldenPerToken(INITIAL_ACTION_STATE, form({ t, aktion: 'loeschen' }))).meldung).toBe('Dieser Link ist nicht gültig.');
  });
});

describe('erinnerungslaufStarten (Vorschau)', () => {
  it('ADM: Lauf mit Datum (Demo) → Mails in der Vorschau; zweiter Lauf → „Keine neuen Mails (bereits erinnert).“', async () => {
    als('admin');
    const r = await erinnerungslaufStarten(INITIAL_ACTION_STATE, form({ heute: '2026-11-30' }));
    expect(r.status).toBe('ok');
    expect(r.meldung).toMatch(/^Lauf ausgeführt: \d+ Mails in der Vorschau\.$/);
    expect(revalidiert).toEqual(['/admin/mails', '/erinnerungen/protokoll']);
    const vorschau = await holeMailVorschau();
    expect(vorschau.mails.length).toBeGreaterThan(0);
    expect(new Set(vorschau.mails.map((m) => m.art))).toEqual(new Set(['frist_digest', 'pruefer_woche', 'ma_hinweis']));
    expect(await erinnerungslaufStarten(INITIAL_ACTION_STATE, form({ heute: '2026-11-30' }))).toEqual({
      status: 'ok',
      meldung: 'Keine neuen Mails (bereits erinnert).',
    });
  });
  it('manueller Lauf nur für die Organisation der Sitzung', async () => {
    als('admin');
    expect((await erinnerungslaufStarten(INITIAL_ACTION_STATE, form({ heute: '2026-11-30' }))).status).toBe('ok');
    const stand = demoStandVon(demoRepository('2026-11-30'));
    const heutige = stand.mailVersand.filter((v) => v.laufDatum === '2026-11-30');
    expect(heutige.length).toBeGreaterThan(0);
    expect(heutige.every((v) => v.organisationId === DEMO_ORG_ID)).toBe(true);
    expect((await holeMailVorschau()).mails.every((m) => m.organisationId === DEMO_ORG_ID)).toBe(true);
  });
  it('ungültiges Datum → Feldfehler heute; SIF → kein Recht', async () => {
    als('admin');
    expect((await erinnerungslaufStarten(INITIAL_ACTION_STATE, form({ heute: '30.11.2026' }))).feldfehler?.heute).toBeDefined();
    als('sifa');
    expect((await erinnerungslaufStarten(INITIAL_ACTION_STATE, form({}))).status).toBe('fehler');
  });
});
