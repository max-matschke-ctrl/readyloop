// Resend-Webhook (F-37): Svix-Signaturprüfung mit node:crypto, Toleranz 5 Minuten.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SVIX_TOLERANZ_SEKUNDEN = 300;

export function pruefeSvixSignatur(opt: {
  secret: string; // 'whsec_…'
  id: string; // Kopfzeile svix-id
  zeitstempel: string; // svix-timestamp (Sekunden)
  signatur: string; // svix-signature
  body: string; // roher Body
  jetzt: Date;
}): boolean {
  if (!opt.secret.startsWith('whsec_') || !opt.id || !/^\d{1,12}$/.test(opt.zeitstempel)) return false;
  const zeit = Number(opt.zeitstempel);
  if (Math.abs(opt.jetzt.getTime() / 1000 - zeit) > SVIX_TOLERANZ_SEKUNDEN) return false;
  const schluessel = Buffer.from(opt.secret.slice('whsec_'.length), 'base64');
  if (schluessel.length === 0) return false;
  const erwartet = createHmac('sha256', schluessel).update(`${opt.id}.${opt.zeitstempel}.${opt.body}`).digest();
  for (const teil of opt.signatur.split(' ')) {
    const [version, wert] = teil.split(',', 2);
    if (version !== 'v1' || !wert) continue;
    const erhalten = Buffer.from(wert, 'base64');
    if (erhalten.length === erwartet.length && timingSafeEqual(erhalten, erwartet)) return true;
  }
  return false;
}

export function webhookStatus(typ: string): 'zugestellt' | 'bounce' | 'beschwerde' | null {
  switch (typ) {
    case 'email.delivered':
      return 'zugestellt';
    case 'email.bounced':
      return 'bounce';
    case 'email.complained':
      return 'beschwerde';
    default:
      return null;
  }
}
