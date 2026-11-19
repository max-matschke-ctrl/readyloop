// Anmeldung (BE-12). Platzhalter für BE-11: außerhalb des Supabase-Modus keine Auth-Aktionen.
import type { ActionState } from '@/domain/types';
import { betriebsmodus } from './sitzung';

const NICHT_VERFUEGBAR: ActionState = { status: 'fehler', meldung: 'Anmeldung mit E-Mail ist nur mit Supabase verfügbar.' };

export async function anmelden(roh: Record<string, unknown>): Promise<ActionState> {
  void roh;
  return NICHT_VERFUEGBAR;
}
export async function passwortVergessen(roh: Record<string, unknown>): Promise<ActionState> {
  void roh;
  return NICHT_VERFUEGBAR;
}
export async function passwortSetzen(roh: Record<string, unknown>): Promise<ActionState> {
  void roh;
  return NICHT_VERFUEGBAR;
}
export async function abmeldenSupabase(): Promise<void> {
  if (betriebsmodus() !== 'supabase') return;
}
