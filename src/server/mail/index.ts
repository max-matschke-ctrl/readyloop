// Mail-Modus und Adapterwahl (F-37). Nur serverseitig.
import type { MailModus } from '@/domain/types';
import { betriebsmodus } from '../betriebsmodus';
import { resendAdapter } from './resend';
import type { MailAdapter } from './types';
import { vorschauAdapter } from './vorschau';

/** F-37: 'resend', wenn RESEND_API_KEY, MAIL_ABSENDER und MAIL_ABMELDE_SECRET gesetzt sind; sonst 'vorschau' im Demo-Modus
 *  oder bei NODE_ENV ≠ production; sonst 'aus'. */
export function mailModus(): MailModus {
  if (process.env.RESEND_API_KEY && process.env.MAIL_ABSENDER && process.env.MAIL_ABMELDE_SECRET) return 'resend';
  if (betriebsmodus() === 'demo' || process.env.NODE_ENV !== 'production') return 'vorschau';
  return 'aus';
}

/** Adapter je Modus; null bei 'aus'. */
export function holeMailAdapter(): MailAdapter | null {
  switch (mailModus()) {
    case 'resend':
      return resendAdapter({
        apiKey: process.env.RESEND_API_KEY as string,
        absender: process.env.MAIL_ABSENDER as string,
        antwortAn: process.env.MAIL_ANTWORT_AN || null,
      });
    case 'vorschau':
      return vorschauAdapter();
    case 'aus':
      return null;
  }
}

/** NEXT_PUBLIC_SITE_URL ohne abschließenden '/', Default 'http://localhost:3000'. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Basis-URL für Links in Mails (F-36, F-38). Ohne NEXT_PUBLIC_SITE_URL im Produktionsmodus (Supabase und
 *  NODE_ENV = production) null – dann verweigert der Lauf (nicht_konfiguriert), statt localhost-Links zu verschicken.
 *  Im Demo-Modus und bei NODE_ENV ≠ production bleibt localhost erlaubt. */
export function mailSiteUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return siteUrl();
  if (betriebsmodus() === 'demo' || process.env.NODE_ENV !== 'production') return siteUrl();
  return null;
}
