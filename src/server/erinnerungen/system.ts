// System-Repository ohne Benutzersitzung (F-43): Erinnerungslauf, One-Click-Abmeldung, Webhook.
// Demo: In-Memory über alle Organisationen. Supabase: Service-Role-Client nur über system-repository (BE-28).
import { heuteBerlin } from '@/domain/datum';
import { betriebsmodus } from '../betriebsmodus';
import type { ErinnerungsSystemRepository } from '../repo/types';

export async function holeSystemRepository(): Promise<ErinnerungsSystemRepository> {
  const modus = betriebsmodus();
  if (modus === 'demo') {
    const { demoRepository, demoStandVon } = await import('../repo/demo/repository');
    const { DemoSystemRepository } = await import('../repo/demo/system-repository');
    return new DemoSystemRepository(demoStandVon(demoRepository(heuteBerlin())));
  }
  if (modus === 'supabase') {
    throw new Error('nicht implementiert (BE-28)');
  }
  throw new Error('Readyloop ist nicht konfiguriert');
}
