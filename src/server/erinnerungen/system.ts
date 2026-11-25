// System-Repository ohne Benutzersitzung (F-43): Erinnerungslauf, One-Click-Abmeldung, Webhook.
// Demo: In-Memory über alle Organisationen. Supabase: Service-Role-Client nur über system-repository (BE-28).
import { heuteBerlin } from '@/domain/datum';
import { betriebsmodus } from '../betriebsmodus';
import type { MailAdapter } from '../mail/types';
import type { ErinnerungsSystemRepository } from '../repo/types';

export async function holeSystemRepository(): Promise<ErinnerungsSystemRepository> {
  const modus = betriebsmodus();
  if (modus === 'demo') {
    const { demoRepository, demoStandVon } = await import('../repo/demo/repository');
    const { DemoSystemRepository } = await import('../repo/demo/system-repository');
    return new DemoSystemRepository(demoStandVon(demoRepository(heuteBerlin())));
  }
  if (modus === 'supabase') {
    const { standardSystemRepository } = await import('../repo/supabase/system-repository');
    return standardSystemRepository();
  }
  throw new Error('Readyloop ist nicht konfiguriert');
}

/** F-33: Im Supabase-Modus ist jeder Lauf mit dem Vorschau-Adapter ein Trockenlauf (keine Versand-/Postendatensätze,
 *  kein Statusschreiben). Nur im Demo-Modus schreibt die Vorschau ins (In-Memory-)Protokoll und zählt als erinnert. */
export function istTrockenlauf(adapter: MailAdapter | null): boolean {
  return adapter !== null && adapter.modus === 'vorschau' && betriebsmodus() !== 'demo';
}
