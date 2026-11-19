'use server';
// Vertrag §3.6 – Implementierung folgt in BE-6.
// 'use server': nur async-Funktionen exportieren (keine Konstanten/Typen).

import type { ActionState } from '@/domain/types';

const NI = 'nicht implementiert (BE-6)';

/** Nur Demo-Modus. Setzt Cookie rl_demo_rolle; Erfolg: redirect('/pruefer') für pruefer, sonst redirect('/geraete'). */
export async function setzeDemoRolle(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(NI);
}

/** Löscht Sitzung bzw. Demo-Cookie; redirect('/login'). */
export async function abmelden(): Promise<void> {
  throw new Error(NI);
}

/** Recht geraet.anlegen + Bereich im Geltungsbereich. Erfolg: redirect(`/geraete/${id}`). */
export async function geraetAnlegen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(NI);
}

/** Recht frist.freigeben + Geltungsbereich; Regeln F-4. Erfolg: revalidatePath(`/geraete/${geraetId}`),
 *  Rückgabe { status: 'ok', meldung: 'Frist freigegeben', id: geraetPruefartId }. */
export async function fristFreigeben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(NI);
}

/** Recht nachweis.erfassen + Geltungsbereich; Regeln F-7; Prüfdatum ≤ heute.
 *  Erfolg: pruefer → redirect('/pruefer'), sonst redirect(`/geraete/${geraetId}`). */
export async function nachweisErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(NI);
}
