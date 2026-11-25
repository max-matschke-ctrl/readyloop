// Abmelde-Token (F-40): HMAC-SHA256 über (Organisation, Benutzer, Art), base64url, ohne Ablauf, ohne E-Mail-Adresse.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ABBESTELLBARE_MAIL_ARTEN, type AbbestellbareMailArt, type Id } from '@/domain/types';
import { mailModus, siteUrl } from './index';

/** Nur im Modus 'vorschau' ohne gesetztes Secret. Mit Resend ist MAIL_ABMELDE_SECRET Pflicht (F-37). */
export const ENTWICKLUNGS_SECRET = 'readyloop-dev-nur-vorschau';

export interface AbmeldeDaten {
  organisationId: Id;
  benutzerId: Id;
  art: AbbestellbareMailArt;
}

function secret(): string {
  const wert = process.env.MAIL_ABMELDE_SECRET;
  if (wert) return wert;
  if (mailModus() === 'vorschau') return ENTWICKLUNGS_SECRET;
  throw new Error('MAIL_ABMELDE_SECRET fehlt');
}

function signatur(nutzlast: string, schluessel: string): Buffer {
  return createHmac('sha256', schluessel).update(nutzlast).digest();
}

export function abmeldeToken(d: AbmeldeDaten): string {
  const nutzlast = Buffer.from(JSON.stringify({ o: d.organisationId, b: d.benutzerId, a: d.art }), 'utf8').toString('base64url');
  return `${nutzlast}.${signatur(nutzlast, secret()).toString('base64url')}`;
}

export function pruefeAbmeldeToken(token: string): AbmeldeDaten | null {
  if (typeof token !== 'string' || token.length > 500) return null;
  const teile = token.split('.');
  if (teile.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(teile[0]) || !/^[A-Za-z0-9_-]+$/.test(teile[1])) return null;
  let schluessel: string;
  try {
    schluessel = secret();
  } catch {
    return null;
  }
  const erwartet = signatur(teile[0], schluessel);
  const erhalten = Buffer.from(teile[1], 'base64url');
  if (erhalten.length !== erwartet.length || !timingSafeEqual(erhalten, erwartet)) return null;
  try {
    const d = JSON.parse(Buffer.from(teile[0], 'base64url').toString('utf8')) as { o?: unknown; b?: unknown; a?: unknown };
    if (typeof d.o !== 'string' || d.o === '' || typeof d.b !== 'string' || d.b === '') return null;
    if (typeof d.a !== 'string' || !(ABBESTELLBARE_MAIL_ARTEN as readonly string[]).includes(d.a)) return null;
    return { organisationId: d.o, benutzerId: d.b, art: d.a as AbbestellbareMailArt };
  } catch {
    return null;
  }
}

/** Bestätigungsseite (GET ändert nichts). */
export function abmeldeSeitenUrl(token: string): string {
  return `${siteUrl()}/abmelden?t=${token}`;
}

/** One-Click nach RFC 8058 (POST). */
export function oneClickUrl(token: string): string {
  return `${siteUrl()}/api/mail/abmelden?t=${token}`;
}
