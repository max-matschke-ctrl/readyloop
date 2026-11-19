'use server';
// Vertrag §3.6/§5.5 – Server Actions (BE-6; I2-Signaturen BE-7, Umsetzung BE-11/BE-12).
// 'use server': nur async-Funktionen exportieren (keine Konstanten/Typen).
// Jede Action prüft Sitzung und Recht (can) serverseitig selbst; die Dienste prüfen zusätzlich den Geltungsbereich.

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { can } from '@/domain/rechte';
import { demoRolleSchema, fristFreigebenSchema, geraetAnlegenSchema, nachweisErfassenSchema } from '@/domain/schemas';
import type { Aktion, ActionState, Sitzung } from '@/domain/types';
import * as dienste from './dienste';
import { DEMO_COOKIE, DEMO_COOKIE_OPTIONEN, heute, holeRepository, istDemoModus, leseSitzung } from './sitzung';

function felder(formData: FormData, namen: readonly string[]): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(namen.map((n) => [n, formData.get(n)]));
}

function validierungsfehler(fehler: z.ZodError): ActionState {
  const { fieldErrors, formErrors } = z.flattenError(fehler);
  return {
    status: 'fehler',
    meldung: formErrors[0] ?? 'Bitte die markierten Felder prüfen.',
    feldfehler: fieldErrors as Partial<Record<string, string[]>>,
  };
}

function dienstFehler(ergebnis: { fehler: string; feld?: string }): ActionState {
  return {
    status: 'fehler',
    meldung: ergebnis.fehler,
    ...(ergebnis.feld ? { feldfehler: { [ergebnis.feld]: [ergebnis.fehler] } } : {}),
  };
}

const KEIN_RECHT: ActionState = { status: 'fehler', meldung: 'Keine Berechtigung für diese Aktion.' };
const UNERWARTET: ActionState = { status: 'fehler', meldung: 'Unerwarteter Fehler. Bitte erneut versuchen.' };

/** Sitzung erzwingen (sonst Login) und Rolle prüfen. */
async function sitzungMitRecht(aktion: Aktion): Promise<Sitzung | null> {
  const sitzung = await leseSitzung();
  if (!sitzung) redirect('/login');
  return can(sitzung.rolle, aktion) ? sitzung : null;
}

/** Nur Demo-Modus. Setzt Cookie rl_demo_rolle; Erfolg: redirect('/pruefer') für pruefer, sonst redirect('/geraete'). */
export async function setzeDemoRolle(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  if (!istDemoModus()) return { status: 'fehler', meldung: 'Der Demo-Modus ist nicht aktiv.' };
  const geprueft = demoRolleSchema.safeParse(felder(formData, ['rolle']));
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  (await cookies()).set(DEMO_COOKIE, geprueft.data.rolle, DEMO_COOKIE_OPTIONEN);
  redirect(geprueft.data.rolle === 'pruefer' ? '/pruefer' : '/geraete');
}

/** Löscht Sitzung bzw. Demo-Cookie; redirect('/login'). */
export async function abmelden(): Promise<void> {
  (await cookies()).delete({ name: DEMO_COOKIE, path: '/' });
  redirect('/login');
}

/** Recht geraet.anlegen + Bereich im Geltungsbereich. Erfolg: redirect(`/geraete/${id}`). */
export async function geraetAnlegen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const sitzung = await sitzungMitRecht('geraet.anlegen');
  if (!sitzung) return KEIN_RECHT;
  const geprueft = geraetAnlegenSchema.safeParse(
    felder(formData, [
      'bezeichnung',
      'inventarnummer',
      'bereichId',
      'geraetegruppe',
      'kategorie',
      'hersteller',
      'typ',
      'seriennummer',
      'baujahr',
      'einsatzort',
      'pruefartenJson',
    ]),
  );
  if (!geprueft.success) return validierungsfehler(geprueft.error);

  let id: string;
  try {
    const ergebnis = await dienste.geraetAnlegen(sitzung, holeRepository(), geprueft.data, { heute: heute(), jetzt: new Date() });
    if (!ergebnis.ok) return dienstFehler(ergebnis);
    id = ergebnis.id;
  } catch (e) {
    console.error('geraetAnlegen', e);
    return UNERWARTET;
  }
  revalidatePath('/geraete');
  redirect(`/geraete/${id}`);
}

/** Recht frist.freigeben + Geltungsbereich; Regeln F-4. Erfolg: revalidatePath(`/geraete/${geraetId}`),
 *  Rückgabe { status: 'ok', meldung: 'Frist freigegeben', id: geraetPruefartId }. */
export async function fristFreigeben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const sitzung = await sitzungMitRecht('frist.freigeben');
  if (!sitzung) return KEIN_RECHT;
  const geprueft = fristFreigebenSchema.safeParse(
    felder(formData, ['modus', 'geraetPruefartId', 'monate', 'fundstelle', 'begruendung', 'nachweisId']),
  );
  if (!geprueft.success) return validierungsfehler(geprueft.error);

  try {
    const ergebnis = await dienste.fristFreigeben(sitzung, holeRepository(), geprueft.data, new Date());
    if (!ergebnis.ok) return dienstFehler(ergebnis);
    revalidatePath(`/geraete/${ergebnis.geraetId}`);
    revalidatePath('/geraete');
    revalidatePath('/pruefer');
    return { status: 'ok', meldung: 'Frist freigegeben', id: ergebnis.pruefartId };
  } catch (e) {
    console.error('fristFreigeben', e);
    return UNERWARTET;
  }
}

/** Recht nachweis.erfassen + Geltungsbereich; Regeln F-7; Prüfdatum ≤ heute.
 *  Erfolg: pruefer → redirect('/pruefer'), sonst redirect(`/geraete/${geraetId}`). */
export async function nachweisErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const sitzung = await sitzungMitRecht('nachweis.erfassen');
  if (!sitzung) return KEIN_RECHT;
  const geprueft = nachweisErfassenSchema.safeParse(
    felder(formData, [
      'geraetPruefartId',
      'pruefdatum',
      'ergebnis',
      'pruefumfang',
      'prueferName',
      'unterschriftImPdf',
      'pdf',
      'fristEmpfehlungMonate',
    ]),
  );
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  const { pdf, ...rest } = geprueft.data;

  let geraetId: string;
  try {
    const ergebnis = await dienste.nachweisErfassen(
      sitzung,
      holeRepository(),
      { ...rest, unterschriftImPdf: true, pdf: { name: pdf.name, inhalt: new Uint8Array(await pdf.arrayBuffer()) } },
      { heute: heute(), jetzt: new Date() },
    );
    if (!ergebnis.ok) return dienstFehler(ergebnis);
    geraetId = ergebnis.geraetId;
  } catch (e) {
    console.error('nachweisErfassen', e);
    return UNERWARTET;
  }
  revalidatePath(`/geraete/${geraetId}`);
  revalidatePath('/geraete');
  revalidatePath('/pruefer');
  redirect(sitzung.rolle === 'pruefer' ? '/pruefer' : `/geraete/${geraetId}`);
}

// ---------------------------------------------------------------------------
// Inkrement 2 (§5.5) – Signaturen; Rümpfe folgen mit BE-11 (Fachaktionen) bzw. BE-12 (Auth).
// fristFreigeben/nachweisErfassen oben lesen bereits nachweisId bzw. fristEmpfehlungMonate;
// abmelden (Supabase signOut, rl_org löschen) und der Redirect zur Mängelerfassung folgen mit BE-11/BE-12.
// ---------------------------------------------------------------------------

/** Nur Modus supabase. signInWithPassword; Fehler immer 'E-Mail oder Passwort ist falsch.' (keine Unterscheidung). Erfolg: redirect('/'). */
export async function anmelden(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-12)');
}

/** Nur Modus supabase. resetPasswordForEmail mit redirectTo SITE_URL + '/api/auth/confirm?next=/passwort-neu'.
 *  Antwort immer { status: 'ok', meldung: 'Wenn ein Konto existiert, ist eine E-Mail unterwegs.' }. */
export async function passwortVergessen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-12)');
}

/** Verlangt Auth-Sitzung (aus Einladungs- oder Reset-Link). updateUser({ password }). Erfolg: redirect('/'). */
export async function passwortSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-12)');
}

/** Nur eigene aktive Mitgliedschaft; setzt Cookie rl_org (httpOnly, sameSite lax, path '/'). Erfolg: redirect('/'). */
export async function waehleOrganisation(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-12)');
}

/** bereich.verwalten. Neu oder ändern (Name, Einsatzort). Erfolg: revalidatePath('/admin/bereiche'),
 *  { status: 'ok', meldung: 'Bereich gespeichert', id: bereichId }. */
export async function bereichSpeichern(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** mitglied.verwalten. F-17. Erfolg: revalidatePath('/admin/mitglieder'),
 *  { status: 'ok', id: mitgliedschaftId, meldung: 'Einladung an … versendet.' | '… hat bereits ein Konto; Zugang angelegt.' }.
 *  Doppelte Mitgliedschaft → feldfehler.email. */
export async function mitgliedEinladen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** mitglied.verwalten. F-17 (letzter Admin, eigene Mitgliedschaft). Erfolg: { status: 'ok', meldung: 'Gespeichert', id }. */
export async function mitgliedAendern(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** pruefer.zuweisen + Geltungsbereich; F-15. Erfolg: revalidatePath(`/geraete/${geraetId}`), '/pruefer';
 *  { status: 'ok', meldung: 'Prüfer zugewiesen' | 'Zuweisung entfernt', id: geraetPruefartId }. Warnung blockiert nicht. */
export async function prueferZuweisen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** frist.freigeben + Geltungsbereich; F-18. Erfolg: { status: 'ok', meldung: 'GBU-Verweis gespeichert', id: geraetPruefartId }. */
export async function gbuDokumentSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** geraet.bearbeiten + Geltungsbereich; F-11. Erfolg: { status: 'ok', meldung: 'Betriebsstatus geändert', id: geraetId }. */
export async function betriebsstatusSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** geraet.bearbeiten + darfVerschieben; F-16. Erfolg: revalidatePath('/geraete'), redirect(`/geraete/${geraetId}`).
 *  (Redirect, weil VER das Gerät nach dem Verschieben evtl. nicht mehr sieht → dann redirect('/geraete').) */
export async function geraetVerschieben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** anlass.erfassen + Geltungsbereich; F-10; datum ≤ heute; alle Prüfarten gehören zum Gerät.
 *  Erfolg: { status: 'ok', meldung: 'Anlass erfasst', id: geraetId }. */
export async function anlassErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** anlass.erfassen + Geltungsbereich; nur offene, nicht aufgehobene Anlässe. Erfolg: { status: 'ok', meldung: 'Anlass aufgehoben', id: anlassId }. */
export async function anlassAufheben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** mangel.erfassen + Geltungsbereich; F-14. Erfolg: revalidatePath('/maengel', `/geraete/${geraetId}`),
 *  redirect(zurueck ?? (pruefer ? '/pruefer' : `/maengel/${mangelId}`)). */
export async function mangelErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** mangel.bearbeiten + Geltungsbereich; nur Status 'offen'; verantwortlichId aus listeMangelVerantwortliche.
 *  Erfolg: { status: 'ok', meldung: 'Zur Kenntnis genommen', id: mangelId }. */
export async function mangelKenntnisNehmen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}

/** mangel.bearbeiten + Geltungsbereich; Status 'offen' oder 'in_bearbeitung'. Erfolg: { status: 'ok', meldung: 'Mangel behoben', id: mangelId }. */
export async function mangelBeheben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error('nicht implementiert (BE-11)');
}
