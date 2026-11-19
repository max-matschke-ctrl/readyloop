'use server';
// Vertrag §3.6 – Server Actions (BE-6).
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
    felder(formData, ['modus', 'geraetPruefartId', 'monate', 'fundstelle', 'begruendung']),
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
    felder(formData, ['geraetPruefartId', 'pruefdatum', 'ergebnis', 'pruefumfang', 'prueferName', 'unterschriftImPdf', 'pdf']),
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
