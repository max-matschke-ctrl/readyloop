// BE-23: Mail-Infrastruktur – Modus, Resend-Adapter (fetch gemockt), Vorschau, Abmelde-Token, Svix-Prüfung.
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abmeldeSeitenUrl, abmeldeToken, ENTWICKLUNGS_SECRET, oneClickUrl, pruefeAbmeldeToken } from '@/server/mail/abmelden';
import { holeMailAdapter, mailModus, siteUrl } from '@/server/mail/index';
import { RESEND_URL, resendAdapter } from '@/server/mail/resend';
import type { GerenderteMail } from '@/server/mail/types';
import { leereVorschau, listeVorschauMails, VORSCHAU_MAX, vorschauAdapter } from '@/server/mail/vorschau';
import { pruefeSvixSignatur, webhookStatus } from '@/server/mail/webhook';

const ENV = ['RESEND_API_KEY', 'MAIL_ABSENDER', 'MAIL_ABMELDE_SECRET', 'MAIL_ANTWORT_AN', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'READYLOOP_DEMO', 'NEXT_PUBLIC_SITE_URL'] as const;

beforeEach(() => {
  for (const k of ENV) vi.stubEnv(k, '');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const MAIL: GerenderteMail = {
  an: 'empfaenger@example.org',
  betreff: 'Readyloop · Test GmbH: 1 überfällig',
  text: 'Guten Tag,',
  html: '<p>Guten Tag,</p>',
  kopfzeilen: { 'X-Readyloop-Art': 'pruefer_woche', 'List-Unsubscribe': '<https://x/api/mail/abmelden?t=abc>' },
  idempotenzSchluessel: '11111111-1111-4111-8111-111111111111',
};
const META = { organisationName: 'Test GmbH', art: 'pruefer_woche' as const, laufDatum: '2026-11-30' };

describe('mailModus (F-37)', () => {
  it('resend nur mit allen drei Variablen', () => {
    vi.stubEnv('RESEND_API_KEY', 're_x');
    vi.stubEnv('MAIL_ABSENDER', 'Readyloop <a@b.de>');
    expect(mailModus()).toBe('vorschau'); // test-Umgebung, Secret fehlt
    vi.stubEnv('MAIL_ABMELDE_SECRET', 'x'.repeat(32));
    expect(mailModus()).toBe('resend');
    expect(holeMailAdapter()?.modus).toBe('resend');
  });
  it('vorschau außerhalb production oder im Demo-Modus; sonst aus', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(mailModus()).toBe('vorschau');
    expect(holeMailAdapter()?.modus).toBe('vorschau');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    expect(mailModus()).toBe('aus');
    expect(holeMailAdapter()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('READYLOOP_DEMO', '1');
    expect(mailModus()).toBe('vorschau');
  });
  it('siteUrl ohne abschließenden Schrägstrich', () => {
    expect(siteUrl()).toBe('http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.example.de//');
    expect(siteUrl()).toBe('https://app.example.de');
  });
});

describe('resendAdapter', () => {
  const antwort = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const adapter = (fetchFn: typeof fetch, extra: { antwortAn?: string | null; timeoutMs?: number } = {}) =>
    resendAdapter({ apiKey: 're_test', absender: 'Readyloop <erinnerung@mail.example.de>', fetchFn, ...extra });

  it('Erfolg: Kopfzeilen, Body, Idempotency-Key', async () => {
    const fetchFn = vi.fn(async () => antwort(200, { id: 'resend-123' }));
    const e = await adapter(fetchFn as unknown as typeof fetch, { antwortAn: 'sifa@example.org' }).senden(MAIL, META);
    expect(e).toEqual({ ok: true, anbieterId: 'resend-123' });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(RESEND_URL);
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe('Bearer re_test');
    expect(h['Content-Type']).toBe('application/json');
    expect(h['Idempotency-Key']).toBe(MAIL.idempotenzSchluessel);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      from: 'Readyloop <erinnerung@mail.example.de>',
      to: [MAIL.an],
      subject: MAIL.betreff,
      html: MAIL.html,
      text: MAIL.text,
      headers: MAIL.kopfzeilen,
      reply_to: 'sifa@example.org',
    });
  });

  it('ohne antwortAn kein reply_to', async () => {
    const fetchFn = vi.fn(async () => antwort(200, { id: 'x' }));
    await adapter(fetchFn as unknown as typeof fetch).senden(MAIL, META);
    const body = JSON.parse((fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).not.toHaveProperty('reply_to');
  });

  it.each([
    [429, {}, 'rate_limit', true],
    [500, {}, 'anbieter_fehler', true],
    [503, {}, 'anbieter_fehler', true],
    [422, { name: 'validation_error', message: 'Invalid `to` field. The email address needs to follow the format.' }, 'ungueltige_adresse', false],
    [422, { name: 'validation_error', message: 'Invalid `subject` field.' }, 'abgelehnt', false],
    [401, {}, 'konfiguration', false],
    [403, {}, 'konfiguration', false],
    [400, {}, 'abgelehnt', false],
  ] as const)('HTTP %i → %s', async (status, body, code, wiederholbar) => {
    const fetchFn = vi.fn(async () => antwort(status, body));
    expect(await adapter(fetchFn as unknown as typeof fetch).senden(MAIL, META)).toEqual({ ok: false, fehlerCode: code, wiederholbar });
  });

  it('Netzwerkfehler und Timeout → netzwerk, wiederholbar', async () => {
    const kaputt = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await adapter(kaputt as unknown as typeof fetch).senden(MAIL, META)).toEqual({ ok: false, fehlerCode: 'netzwerk', wiederholbar: true });
    const haengt = ((_url: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason)))) as unknown as typeof fetch;
    expect(await adapter(haengt, { timeoutMs: 20 }).senden(MAIL, META)).toEqual({ ok: false, fehlerCode: 'netzwerk', wiederholbar: true });
  });

  it('Logs ohne Adresse und Inhalt', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await adapter((async () => antwort(500, {})) as unknown as typeof fetch).senden(MAIL, META);
    const geloggt = warn.mock.calls.flat().join(' ');
    expect(geloggt).not.toContain(MAIL.an);
    expect(geloggt).not.toContain('Test GmbH');
    expect(geloggt).toContain('anbieter_fehler');
  });
});

describe('vorschauAdapter', () => {
  beforeEach(() => leereVorschau());

  it('speichert, Anbieter-ID vorschau-…, neueste zuerst, Filter nach Organisation', async () => {
    const a = vorschauAdapter();
    const e1 = await a.senden(MAIL, META);
    await a.senden({ ...MAIL, betreff: 'zwei', kopfzeilen: {} }, { ...META, organisationName: 'Andere AG' });
    expect(e1.ok && e1.anbieterId.startsWith('vorschau-')).toBe(true);
    const alle = listeVorschauMails();
    expect(alle.map((m) => m.betreff)).toEqual(['zwei', MAIL.betreff]);
    expect(alle[1].listUnsubscribe).toBe(MAIL.kopfzeilen['List-Unsubscribe']);
    expect(alle[0].listUnsubscribe).toBeNull();
    expect(listeVorschauMails('Test GmbH')).toHaveLength(1);
  });

  it(`kappt bei ${VORSCHAU_MAX} (älteste verworfen)`, async () => {
    const a = vorschauAdapter();
    for (let i = 0; i < VORSCHAU_MAX + 5; i++) await a.senden({ ...MAIL, betreff: `m${i}` }, META);
    const alle = listeVorschauMails();
    expect(alle).toHaveLength(200);
    expect(alle[0].betreff).toBe(`m${VORSCHAU_MAX + 4}`);
    expect(alle.at(-1)!.betreff).toBe('m5');
  });
});

describe('Abmelde-Token (F-40)', () => {
  const D = { organisationId: 'org-1', benutzerId: 'ben-1', art: 'pruefer_woche' as const };

  it('Hin- und Rückweg, ohne E-Mail-Adresse, URL-sicher', () => {
    vi.stubEnv('MAIL_ABMELDE_SECRET', 's'.repeat(40));
    const t = abmeldeToken(D);
    expect(t).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(pruefeAbmeldeToken(t)).toEqual(D);
    expect(Buffer.from(t.split('.')[0], 'base64url').toString()).not.toContain('@');
    expect(abmeldeSeitenUrl(t)).toBe(`http://localhost:3000/abmelden?t=${t}`);
    expect(oneClickUrl(t)).toBe(`http://localhost:3000/api/mail/abmelden?t=${t}`);
  });

  it('manipulierte Nutzlast oder Signatur, anderes Secret, kaputtes Format → null', () => {
    vi.stubEnv('MAIL_ABMELDE_SECRET', 's'.repeat(40));
    const t = abmeldeToken(D);
    const [nutzlast, sig] = t.split('.');
    const fremd = Buffer.from(JSON.stringify({ o: 'org-1', b: 'ben-2', a: 'pruefer_woche' })).toString('base64url');
    expect(pruefeAbmeldeToken(`${fremd}.${sig}`)).toBeNull();
    expect(pruefeAbmeldeToken(`${nutzlast}.${sig.slice(0, -2)}AA`)).toBeNull();
    expect(pruefeAbmeldeToken(nutzlast)).toBeNull();
    expect(pruefeAbmeldeToken('a.b.c')).toBeNull();
    expect(pruefeAbmeldeToken('')).toBeNull();
    vi.stubEnv('MAIL_ABMELDE_SECRET', 't'.repeat(40));
    expect(pruefeAbmeldeToken(t)).toBeNull();
  });

  it('ungültige Art (auch frist_digest) → null, selbst mit gültiger Signatur', () => {
    vi.stubEnv('MAIL_ABMELDE_SECRET', 's'.repeat(40));
    const nutzlast = Buffer.from(JSON.stringify({ o: 'org-1', b: 'ben-1', a: 'frist_digest' })).toString('base64url');
    const sig = createHmac('sha256', 's'.repeat(40)).update(nutzlast).digest('base64url');
    expect(pruefeAbmeldeToken(`${nutzlast}.${sig}`)).toBeNull();
  });

  it('ohne Secret: Vorschau nutzt Entwicklungsschlüssel, sonst Fehler', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const t = abmeldeToken(D);
    const sig = createHmac('sha256', ENTWICKLUNGS_SECRET).update(t.split('.')[0]).digest('base64url');
    expect(t.split('.')[1]).toBe(sig);
    expect(pruefeAbmeldeToken(t)).toEqual(D);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    expect(() => abmeldeToken(D)).toThrow('MAIL_ABMELDE_SECRET fehlt');
    expect(pruefeAbmeldeToken(t)).toBeNull();
  });
});

describe('Svix-Signatur (Resend-Webhook)', () => {
  const schluessel = Buffer.from('geheimer-webhook-schluessel-32-bytes!!');
  const SECRET = `whsec_${schluessel.toString('base64')}`;
  const body = JSON.stringify({ type: 'email.bounced', data: { email_id: 'resend-123' } });
  const jetzt = new Date('2026-11-30T05:00:30Z');
  const ts = String(Math.floor(new Date('2026-11-30T05:00:00Z').getTime() / 1000));
  const sign = (id: string, zeit: string, inhalt: string) =>
    createHmac('sha256', schluessel).update(`${id}.${zeit}.${inhalt}`).digest('base64');

  it('gültig, auch mit mehreren Signaturen', () => {
    const sig = `v1,${sign('msg_1', ts, body)}`;
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'msg_1', zeitstempel: ts, signatur: sig, body, jetzt })).toBe(true);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'msg_1', zeitstempel: ts, signatur: `v1,AAAA ${sig}`, body, jetzt })).toBe(true);
  });

  it('falsche Signatur, anderer Body, andere ID → false', () => {
    const sig = `v1,${sign('msg_1', ts, body)}`;
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'msg_1', zeitstempel: ts, signatur: 'v1,AAAA', body, jetzt })).toBe(false);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'msg_1', zeitstempel: ts, signatur: sig, body: body + ' ', jetzt })).toBe(false);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'msg_2', zeitstempel: ts, signatur: sig, body, jetzt })).toBe(false);
    expect(pruefeSvixSignatur({ secret: 'kein-whsec', id: 'msg_1', zeitstempel: ts, signatur: sig, body, jetzt })).toBe(false);
  });

  it('Zeitstempel 6 Minuten alt (oder in der Zukunft) → false; 5 Minuten → true', () => {
    const alt = String(Math.floor(jetzt.getTime() / 1000) - 360);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'm', zeitstempel: alt, signatur: `v1,${sign('m', alt, body)}`, body, jetzt })).toBe(false);
    const zukunft = String(Math.floor(jetzt.getTime() / 1000) + 360);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'm', zeitstempel: zukunft, signatur: `v1,${sign('m', zukunft, body)}`, body, jetzt })).toBe(false);
    const grenze = String(Math.floor(jetzt.getTime() / 1000) - 300);
    expect(pruefeSvixSignatur({ secret: SECRET, id: 'm', zeitstempel: grenze, signatur: `v1,${sign('m', grenze, body)}`, body, jetzt })).toBe(true);
  });

  it('webhookStatus', () => {
    expect(webhookStatus('email.delivered')).toBe('zugestellt');
    expect(webhookStatus('email.bounced')).toBe('bounce');
    expect(webhookStatus('email.complained')).toBe('beschwerde');
    expect(webhookStatus('email.opened')).toBeNull();
    expect(webhookStatus('email.sent')).toBeNull();
  });
});
