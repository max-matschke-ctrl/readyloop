// System-Repository ohne Benutzersitzung (F-43): Erinnerungslauf, One-Click-Abmeldung, Webhook.
// Demo: In-Memory über alle Organisationen (BE-25). Supabase: Service-Role-Client nur über system-repository (BE-28).
import type { ErinnerungsSystemRepository } from '../repo/types';

export async function holeSystemRepository(): Promise<ErinnerungsSystemRepository> {
  throw new Error('nicht implementiert (BE-25/BE-28)');
}
