// Supabase-Repository (BE-13/BE-14) – Platzhalter.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Id } from '@/domain/types';
import type { Repository } from '../types';

export function supabaseRepository(client: SupabaseClient, organisationId: Id | null): Repository {
  void client;
  void organisationId;
  throw new Error('Supabase-Repository folgt mit BE-13');
}
