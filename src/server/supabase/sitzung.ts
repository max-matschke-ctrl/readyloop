// Supabase-Sitzung (BE-12) – Platzhalter bis BE-12/BE-13.
import type { Id, Sitzung } from '@/domain/types';
import type { Repository } from '../repo/types';

export async function leseSupabaseSitzung(): Promise<Sitzung | null> {
  return null;
}

export async function supabaseRepositoryFuerAnfrage(organisationId: Id | null): Promise<Repository> {
  void organisationId;
  throw new Error('Supabase-Repository folgt mit BE-13');
}

export async function holeAuthBenutzer(): Promise<{ id: Id; email: string } | null> {
  return null;
}
