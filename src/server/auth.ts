// Anmeldung im Modus supabase (BE-12, F-8). Keine Kontoaufzählung: gleiche Meldungen für unbekannte E-Mail
// und falsches Passwort bzw. für „Passwort vergessen“.
import { z } from 'zod';
import { anmeldenSchema, otpBestaetigenSchema, passwortSetzenSchema, passwortVergessenSchema } from '@/domain/schemas';
import type { ActionState } from '@/domain/types';
import { NACH_BESTAETIGUNG, sichererRuecksprung } from './pfade';
import { betriebsmodus } from './sitzung';

export const ANMELDEFEHLER = 'E-Mail oder Passwort ist falsch.';
export const VERGESSEN_ANTWORT = 'Wenn ein Konto existiert, ist eine E-Mail unterwegs.';
const NICHT_VERFUEGBAR: ActionState = { status: 'fehler', meldung: 'Anmeldung mit E-Mail ist nur mit Supabase verfügbar.' };

function validierungsfehler(fehler: z.ZodError): ActionState {
  const { fieldErrors, formErrors } = z.flattenError(fehler);
  return {
    status: 'fehler',
    meldung: formErrors[0] ?? 'Bitte die markierten Felder prüfen.',
    feldfehler: fieldErrors as Partial<Record<string, string[]>>,
  };
}

async function client() {
  const { erzeugeServerClient } = await import('./supabase/server');
  return erzeugeServerClient();
}

export async function anmelden(roh: Record<string, unknown>): Promise<ActionState> {
  if (betriebsmodus() !== 'supabase') return NICHT_VERFUEGBAR;
  const geprueft = anmeldenSchema.safeParse(roh);
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  const { error } = await (await client()).auth.signInWithPassword({
    email: geprueft.data.email,
    password: geprueft.data.passwort,
  });
  // Absichtlich keine Unterscheidung nach Fehlerursache.
  if (error) return { status: 'fehler', meldung: ANMELDEFEHLER };
  return { status: 'ok' };
}

export async function passwortVergessen(roh: Record<string, unknown>): Promise<ActionState> {
  if (betriebsmodus() !== 'supabase') return NICHT_VERFUEGBAR;
  const geprueft = passwortVergessenSchema.safeParse(roh);
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  try {
    const { bestaetigungsUrl } = await import('./supabase/umgebung');
    const { error } = await (await client()).auth.resetPasswordForEmail(geprueft.data.email, { redirectTo: bestaetigungsUrl() });
    if (error) console.error('passwortVergessen', error.message);
  } catch (e) {
    console.error('passwortVergessen', e);
  }
  return { status: 'ok', meldung: VERGESSEN_ANTWORT };
}

export async function passwortSetzen(roh: Record<string, unknown>): Promise<ActionState> {
  if (betriebsmodus() !== 'supabase') return NICHT_VERFUEGBAR;
  const geprueft = passwortSetzenSchema.safeParse(roh);
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  const c = await client();
  const { data } = await c.auth.getUser();
  if (!data.user) return { status: 'fehler', meldung: 'Der Link ist abgelaufen. Bitte „Passwort vergessen“ erneut anfordern.' };
  const { error } = await c.auth.updateUser({ password: geprueft.data.passwort });
  if (error) {
    console.error('passwortSetzen', error.message);
    return { status: 'fehler', meldung: 'Das Passwort konnte nicht gesetzt werden.', feldfehler: { passwort: ['Bitte ein anderes Passwort wählen.'] } };
  }
  return { status: 'ok' };
}

export const LINK_UNGUELTIG_ZIEL = '/login?fehler=link';

/**
 * Review I2 (Befund 7): Einladungs-/Reset-Token bestätigen (nur per POST aus der Bestätigungsseite).
 * Liefert das Weiterleitungsziel: bereinigtes next (Standard /passwort-neu) oder /login?fehler=link.
 */
export async function bestaetigeOtp(roh: Record<string, unknown>): Promise<string> {
  if (betriebsmodus() !== 'supabase') return LINK_UNGUELTIG_ZIEL;
  const geprueft = otpBestaetigenSchema.safeParse(roh);
  if (!geprueft.success) return LINK_UNGUELTIG_ZIEL;
  try {
    const { error } = await (await client()).auth.verifyOtp({ token_hash: geprueft.data.token_hash, type: geprueft.data.type });
    if (error) {
      console.error('bestaetigeOtp', error.message);
      return LINK_UNGUELTIG_ZIEL;
    }
  } catch (e) {
    console.error('bestaetigeOtp', e);
    return LINK_UNGUELTIG_ZIEL;
  }
  return sichererRuecksprung(geprueft.data.next, NACH_BESTAETIGUNG);
}

export async function abmeldenSupabase(): Promise<void> {
  if (betriebsmodus() !== 'supabase') return;
  try {
    await (await client()).auth.signOut();
  } catch (e) {
    console.error('abmelden', e);
  }
}
