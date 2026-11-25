// BE-26: Routen I3 im Demo-Modus – Cron (Bearer, Auslöser, ?heute=), One-Click-Abmeldung, Resend-Webhook (Svix).
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as cron from '@/app/api/cron/erinnerungen/route';
import * as abmelden from '@/app/api/mail/abmelden/route';
import * as webhook from '@/app/api/mail/webhook/route';
import { ausloeserAus, bearerGueltig, CRON_SECRET_MIN_LAENGE, heuteFuerLauf } from '@/server/erinnerungen/routen';
import { abmeldeToken } from '@/server/mail/abmelden';
import { leereVorschau } from '@/server/mail/vorschau';
import { DEMO_BENUTZER_IDS, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { demoRepository, demoStandVon } from '@/server/repo/demo/repository';
import { istAbmeldePfad, QR_KOPFZEILEN, setzeQrKopfzeilen } from '@/server/kopfzeilen';

const SECRET = 'c'.repeat(40);
const WEBHOOK_KEY = Buffer.from('webhook-schluessel-fuer-tests-123456');
const WEBHOOK_SECRET = `whsec_${WEBHOOK_KEY.toString('base64')}`;
const SPEICHER = globalThis as { __readyloopDemoRepository?: unknown };

beforeEach(() => {
  for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'RESEND_API_KEY', 'MAIL_ABSENDER', 'READYLOOP_DEMO']) vi.stubEnv(k, '');
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('MAIL_ABMELDE_SECRET', 'a'.repeat(40));
  vi.stubEnv('RESEND_WEBHOOK_SECRET', WEBHOOK_SECRET);
  SPEICHER.__readyloopDemoRepository = undefined;
  leereVorschau();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const stand = () => demoStandVon(demoRepository('2026-11-30'));
const cronAnfrage = (methode: 'GET' | 'POST', opt: { auth?: string; query?: string; body?: string; ua?: string } = {}) =>
  new Request(`https://app.example/api/cron/erinnerungen${opt.query ?? ''}`, {
    method: methode,
    headers: {
      ...(opt.auth !== undefined ? { authorization: opt.auth } : {}),
      ...(opt.ua ? { 'user-agent': opt.ua } : {}),
      ...(opt.body ? { 'content-type': 'application/json' } : {}),
    },
    body: opt.body,
  });

describe('GET/POST /api/cron/erinnerungen', () => {
  it('Exporte: nodejs, force-dynamic, maxDuration 60', () => {
    expect(cron.runtime).toBe('nodejs');
    expect(cron.dynamic).toBe('force-dynamic');
    expect(cron.maxDuration).toBe(60);
    expect(abmelden.dynamic).toBe('force-dynamic');
    expect(webhook.runtime).toBe('nodejs');
  });

  it('ohne CRON_SECRET → 503', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await cron.GET(cronAnfrage('GET', { auth: `Bearer ${SECRET}` }))).status).toBe(503);
  });

  it(`CRON_SECRET kürzer als ${CRON_SECRET_MIN_LAENGE} Zeichen → 503 nicht_konfiguriert, auch mit passendem Bearer`, async () => {
    const kurz = 'k'.repeat(CRON_SECRET_MIN_LAENGE - 1);
    vi.stubEnv('CRON_SECRET', kurz);
    const laeufeVorher = stand().erinnerungLaeufe.length;
    const r = await cron.GET(cronAnfrage('GET', { auth: `Bearer ${kurz}` }));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ status: 'nicht_konfiguriert' });
    expect(stand().erinnerungLaeufe).toHaveLength(laeufeVorher);
    vi.stubEnv('CRON_SECRET', 'k'.repeat(CRON_SECRET_MIN_LAENGE));
    expect((await cron.GET(cronAnfrage('GET', { auth: `Bearer ${'k'.repeat(CRON_SECRET_MIN_LAENGE)}`, query: '?heute=2026-11-30' }))).status).toBe(200);
  });

  it('Produktion (Supabase, Resend) ohne NEXT_PUBLIC_SITE_URL → 503 nicht_konfiguriert statt localhost-Links', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('MAIL_ABSENDER', 'Readyloop <mail@example.org>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const r = await cron.GET(cronAnfrage('GET', { auth: `Bearer ${SECRET}` }));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ status: 'nicht_konfiguriert' });
  });

  it('fehlender oder falscher Bearer → 401 ohne Details', async () => {
    for (const auth of [undefined, 'Bearer falsch', `Basic ${SECRET}`, `Bearer ${SECRET}x`, SECRET]) {
      const r = await cron.GET(cronAnfrage('GET', { auth }));
      expect(r.status).toBe(401);
      expect(await r.text()).toBe('Unauthorized');
    }
  });

  it('richtiger Bearer → 200 mit LaufErgebnis (nur Zahlen/Status); ?heute= wirkt im Demo-Modus; GET und POST gleich', async () => {
    const r = await cron.GET(cronAnfrage('GET', { auth: `Bearer ${SECRET}`, query: '?heute=2026-11-30', ua: 'vercel-cron/1.0' }));
    expect(r.status).toBe(200);
    const e = await r.json();
    expect(Object.keys(e).sort()).toEqual(['fehler', 'laufId', 'mails', 'organisationen', 'status']);
    expect(e.status).toBe('fertig');
    expect(e.mails).toBeGreaterThan(0);
    expect(JSON.stringify(e)).not.toMatch(/@|Richter|Lindner/);
    expect(stand().erinnerungLaeufe.at(-1)).toMatchObject({ laufDatum: '2026-11-30', ausloeser: 'vercel_cron', status: 'fertig' });
    const zweit = await cron.POST(cronAnfrage('POST', { auth: `Bearer ${SECRET}`, query: '?heute=2026-11-30', body: '{"ausloeser":"pg_cron"}' }));
    expect(zweit.status).toBe(200);
    expect((await zweit.json()).status).toBe('bereits_gelaufen');
    const samstag = await cron.POST(cronAnfrage('POST', { auth: `Bearer ${SECRET}`, query: '?heute=2026-12-05', body: '{"ausloeser":"pg_cron"}' }));
    expect((await samstag.json()).status).toBe('kein_werktag');
  });

  it('Mail-Modus aus (Produktion mit Supabase, ohne Resend) → 503', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    expect((await cron.GET(cronAnfrage('GET', { auth: `Bearer ${SECRET}` }))).status).toBe(503);
  });

  it('?heute= wird bei NODE_ENV=production mit Supabase ignoriert; ungültige Werte ebenfalls', () => {
    const jetzt = new Date('2026-12-01T05:00:00Z');
    const url = new URL('https://app.example/api/cron/erinnerungen?heute=2026-11-30');
    expect(heuteFuerLauf(url, jetzt)).toBe('2026-11-30');
    expect(heuteFuerLauf(new URL('https://x/?heute=2026-13-45'), jetzt)).toBe('2026-12-01');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    expect(heuteFuerLauf(url, jetzt)).toBe('2026-12-01');
    // Zeitzone: 23:30 UTC am 30.11. ist in Berlin bereits der 01.12.
    expect(heuteFuerLauf(new URL('https://x/'), new Date('2026-11-30T23:30:00Z'))).toBe('2026-12-01');
  });

  it('Auslöser aus User-Agent bzw. Body; Bearer-Vergleich', async () => {
    expect(await ausloeserAus(cronAnfrage('GET', { ua: 'vercel-cron/1.0' }))).toBe('vercel_cron');
    expect(await ausloeserAus(cronAnfrage('POST', { body: '{"ausloeser":"pg_cron"}' }))).toBe('pg_cron');
    expect(await ausloeserAus(cronAnfrage('POST', { body: 'kein json' }))).toBe('manuell');
    expect(await ausloeserAus(cronAnfrage('GET'))).toBe('manuell');
    expect(bearerGueltig(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(bearerGueltig('Bearer ', SECRET)).toBe(false);
    expect(bearerGueltig(null, SECRET)).toBe(false);
  });
});

describe('POST /api/mail/abmelden (One-Click)', () => {
  const token = () => abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: DEMO_BENUTZER_IDS.tobias, art: 'pruefer_woche' });
  it('gültiger Token → 200 und abgemeldet', async () => {
    const r = await abmelden.POST(new Request(`https://app.example/api/mail/abmelden?t=${token()}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' }));
    expect(r.status).toBe(200);
    expect(stand().mailAbmeldungen).toContainEqual(expect.objectContaining({ benutzerId: DEMO_BENUTZER_IDS.tobias, art: 'pruefer_woche', abgemeldet: true }));
  });
  it('ungültiger Token → 400; GET → 405 ohne Änderung', async () => {
    expect((await abmelden.POST(new Request('https://app.example/api/mail/abmelden?t=kaputt', { method: 'POST' }))).status).toBe(400);
    expect((await abmelden.POST(new Request(`https://app.example/api/mail/abmelden?t=${token()}x`, { method: 'POST' }))).status).toBe(400);
    const get = await abmelden.GET();
    expect(get.status).toBe(405);
    expect(get.headers.get('Allow')).toBe('POST');
    expect(stand().mailAbmeldungen).toEqual([]);
  });
  it('Token einer Person mit anderer Rolle → 400', async () => {
    const t = abmeldeToken({ organisationId: DEMO_ORG_ID, benutzerId: DEMO_BENUTZER_IDS.marco, art: 'pruefer_woche' });
    expect((await abmelden.POST(new Request(`https://app.example/api/mail/abmelden?t=${t}`, { method: 'POST' }))).status).toBe(400);
  });
});

describe('POST /api/mail/webhook (Resend/Svix)', () => {
  const anfrage = (body: string, opt: { id?: string; ts?: number; sig?: string } = {}) => {
    const id = opt.id ?? 'msg_1';
    const ts = String(opt.ts ?? Math.floor(Date.now() / 1000));
    const sig = opt.sig ?? `v1,${createHmac('sha256', WEBHOOK_KEY).update(`${id}.${ts}.${body}`).digest('base64')}`;
    return new Request('https://app.example/api/mail/webhook', {
      method: 'POST',
      headers: { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig, 'content-type': 'application/json' },
      body,
    });
  };

  it('gültige Signatur + email.bounced → Status bounce', async () => {
    const v = stand().mailVersand.find((x) => x.status === 'zugestellt')!;
    const r = await webhook.POST(anfrage(JSON.stringify({ type: 'email.bounced', data: { email_id: v.anbieterId } })));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ geaendert: true });
    expect(v.status).toBe('bounce');
  });
  it('ungültige Signatur oder alter Zeitstempel → 401, keine Änderung', async () => {
    const v = stand().mailVersand.find((x) => x.status === 'zugestellt')!;
    const body = JSON.stringify({ type: 'email.bounced', data: { email_id: v.anbieterId } });
    expect((await webhook.POST(anfrage(body, { sig: 'v1,AAAA' }))).status).toBe(401);
    expect((await webhook.POST(anfrage(body, { ts: Math.floor(Date.now() / 1000) - 600 }))).status).toBe(401);
    expect(v.status).toBe('zugestellt');
  });
  it('unbekannte Anbieter-ID oder unbekannter Typ → 200 ohne Änderung', async () => {
    const r = await webhook.POST(anfrage(JSON.stringify({ type: 'email.bounced', data: { email_id: 'unbekannt' } })));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ geaendert: false });
    expect(await (await webhook.POST(anfrage(JSON.stringify({ type: 'email.opened', data: { email_id: 'x' } })))).json()).toEqual({ geaendert: false });
  });
  it('ohne RESEND_WEBHOOK_SECRET → 503', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '');
    expect((await webhook.POST(anfrage('{}'))).status).toBe(503);
  });
});

describe('Kopfzeilen /abmelden (wie /g/*)', () => {
  it('setzt no-store, Referrer-Policy, noindex auf /abmelden', () => {
    expect(istAbmeldePfad('/abmelden')).toBe(true);
    expect(istAbmeldePfad('/abmeldenx')).toBe(false);
    const kopf = new Headers();
    setzeQrKopfzeilen('/abmelden', kopf);
    for (const [k, v] of Object.entries(QR_KOPFZEILEN)) expect(kopf.get(k)).toBe(v);
    const andere = new Headers();
    setzeQrKopfzeilen('/geraete', andere);
    expect(andere.get('X-Robots-Tag')).toBeNull();
  });
});
