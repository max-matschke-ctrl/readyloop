// Gemeinsame Logik der I3-Routen (BE-26), ohne Next-Abhängigkeit, damit sie direkt testbar ist.
// Antworten enthalten nur Zahlen und Status – keine Namen, keine Adressen, keine Mailinhalte.
import { createHash, timingSafeEqual } from 'node:crypto';
import { heuteBerlin, istIsoDate } from '@/domain/datum';
import type { LaufAusloeser } from '@/domain/types';
import { betriebsmodus } from '../betriebsmodus';
import { abmeldenPerToken } from '../dienste-erinnerungen';
import { holeMailAdapter, mailSiteUrl } from '../mail/index';
import { pruefeSvixSignatur, webhookStatus } from '../mail/webhook';
import { fuehreErinnerungslaufAus } from './lauf';
import { holeSystemRepository, istTrockenlauf } from './system';

const JSON_KOPF = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (daten: unknown, status = 200) => new Response(JSON.stringify(daten), { status, headers: JSON_KOPF });
const WEBHOOK_MAX_BYTES = 256 * 1024;
/** F-36: kürzere Secrets gelten als nicht konfiguriert (503), nicht als gültig. */
export const CRON_SECRET_MIN_LAENGE = 32;

/** Zeitkonstanter Vergleich (gleich lange Hashes, unabhängig von der Eingabelänge). */
export function bearerGueltig(kopfzeile: string | null, secret: string): boolean {
  if (!kopfzeile || !kopfzeile.startsWith('Bearer ')) return false;
  const a = createHash('sha256').update(kopfzeile.slice('Bearer '.length)).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

/** F-36: User-Agent vercel-cron → vercel_cron; Body {"ausloeser":"pg_cron"} → pg_cron; sonst manuell. */
export async function ausloeserAus(request: Request): Promise<LaufAusloeser> {
  if ((request.headers.get('user-agent') ?? '').toLowerCase().includes('vercel-cron')) return 'vercel_cron';
  if (request.method === 'POST') {
    try {
      const text = await request.text();
      if (text.length <= 1024) {
        const daten = JSON.parse(text) as { ausloeser?: unknown };
        if (daten?.ausloeser === 'pg_cron') return 'pg_cron';
      }
    } catch {
      // kein JSON → manuell
    }
  }
  return 'manuell';
}

/** ?heute= nur im Demo-Modus oder bei NODE_ENV ≠ production (F-36). */
export function heuteFuerLauf(url: URL, jetzt: Date): string {
  const wunsch = url.searchParams.get('heute');
  const erlaubt = betriebsmodus() === 'demo' || process.env.NODE_ENV !== 'production';
  return wunsch && erlaubt && istIsoDate(wunsch) ? wunsch : heuteBerlin(jetzt);
}

/** GET/POST /api/cron/erinnerungen */
export async function cronErinnerungen(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET ?? '';
  if (secret.length < CRON_SECRET_MIN_LAENGE) return json({ status: 'nicht_konfiguriert' }, 503);
  if (!bearerGueltig(request.headers.get('authorization'), secret)) return new Response('Unauthorized', { status: 401 });
  const adapter = holeMailAdapter();
  if (adapter === null) return json({ status: 'nicht_konfiguriert' }, 503);
  if (mailSiteUrl() === null) {
    console.warn('[cron/erinnerungen] NEXT_PUBLIC_SITE_URL fehlt im Produktionsmodus → nicht_konfiguriert');
    return json({ status: 'nicht_konfiguriert' }, 503);
  }
  const jetzt = new Date();
  const heute = heuteFuerLauf(new URL(request.url), jetzt);
  const ausloeser = await ausloeserAus(request);
  try {
    const ergebnis = await fuehreErinnerungslaufAus(await holeSystemRepository(), adapter, {
      heute,
      jetzt,
      ausloeser,
      trockenlauf: istTrockenlauf(adapter),
    });
    const http = ergebnis.status === 'fehler' ? 500 : ergebnis.status === 'nicht_konfiguriert' ? 503 : 200;
    return json(ergebnis, http);
  } catch (e) {
    console.error('[cron/erinnerungen]', e instanceof Error ? e.message : 'Fehler');
    return json({ status: 'fehler' }, 500);
  }
}

/** POST /api/mail/abmelden?t= – One-Click nach RFC 8058. */
export async function oneClickAbmelden(request: Request): Promise<Response> {
  const t = new URL(request.url).searchParams.get('t') ?? '';
  if (t.length < 20 || t.length > 500) return new Response('Ungültiger Link', { status: 400 });
  try {
    const r = await abmeldenPerToken(await holeSystemRepository(), t, true, new Date());
    return r.status === 'ok' ? new Response('Abbestellt', { status: 200 }) : new Response('Ungültiger Link', { status: 400 });
  } catch (e) {
    console.error('[mail/abmelden]', e instanceof Error ? e.message : 'Fehler');
    return new Response('Fehler', { status: 500 });
  }
}

/** POST /api/mail/webhook – Resend (Svix-Signatur, Toleranz 5 Min.). Unbekannte Anbieter-ID → 200 ohne Änderung. */
export async function resendWebhook(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return json({ status: 'nicht_konfiguriert' }, 503);
  const body = await request.text();
  if (Buffer.byteLength(body, 'utf8') > WEBHOOK_MAX_BYTES) return new Response('Zu groß', { status: 413 });
  const gueltig = pruefeSvixSignatur({
    secret,
    id: request.headers.get('svix-id') ?? '',
    zeitstempel: request.headers.get('svix-timestamp') ?? '',
    signatur: request.headers.get('svix-signature') ?? '',
    body,
    jetzt: new Date(),
  });
  if (!gueltig) return new Response('Unauthorized', { status: 401 });
  let typ = '';
  let anbieterId = '';
  try {
    const daten = JSON.parse(body) as { type?: unknown; data?: { email_id?: unknown } };
    typ = typeof daten.type === 'string' ? daten.type : '';
    anbieterId = typeof daten.data?.email_id === 'string' ? daten.data.email_id : '';
  } catch {
    return json({ geaendert: false });
  }
  const status = webhookStatus(typ);
  if (!status || !anbieterId) return json({ geaendert: false });
  try {
    const geaendert = await (await holeSystemRepository()).setzeStatusPerAnbieterId({ anbieterId, status, jetzt: new Date().toISOString() });
    return json({ geaendert });
  } catch (e) {
    console.error('[mail/webhook]', e instanceof Error ? e.message : 'Fehler');
    return json({ status: 'fehler' }, 500);
  }
}
