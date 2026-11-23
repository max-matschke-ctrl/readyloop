// Geräte-Token und Token-URL (F-24). Nur serverseitig.
import { randomBytes } from 'node:crypto';

/** 16 Byte aus dem kryptografisch sicheren Zufallsgenerator, base64url ohne Auffüllung → 22 Zeichen (128 Bit). */
export function neuerToken(): string {
  return randomBytes(16).toString('base64url');
}

/** `${NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/g/${token}` ohne doppelten Schrägstrich. */
export function tokenUrl(token: string): string {
  const basis = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${basis}/g/${token}`;
}

/** URL ohne Schema ('https://' bzw. 'http://') für den Aufdruck. */
export function kurzUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}
