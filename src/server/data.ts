// Vertrag §3.5 – Implementierung folgt in BE-6.
// Nur aus Server Components, Server Actions und Route Handlern importieren.
import type {
  Aktion,
  Bereich,
  GeraetDetail,
  GeraeteFilter,
  GeraetegruppeOption,
  GeraetListenEintrag,
  Id,
  IsoDate,
  PrueferAufgabe,
  Sitzung,
} from '@/domain/types';

const NI = 'nicht implementiert (BE-6)';

/** true, wenn NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. */
export function istDemoModus(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** Heutiges Datum in Europe/Berlin. */
export function heute(): IsoDate {
  throw new Error(NI);
}

export async function holeSitzung(): Promise<Sitzung | null> {
  throw new Error(NI);
}

/** Ohne Sitzung: redirect('/login'). Mit aktion und ohne Recht (can): notFound(). */
export async function erfordereSitzung(aktion?: Aktion): Promise<Sitzung> {
  void aktion;
  throw new Error(NI);
}

/** Bereiche im Geltungsbereich der Sitzung, alphabetisch. */
export async function listeBereiche(): Promise<Bereich[]> {
  throw new Error(NI);
}

/** Sortierung: Gesamtstatus nach Schwere, dann naechsteFaelligkeit aufsteigend (null zuletzt), dann Bezeichnung. */
export async function listeGeraete(filter?: GeraeteFilter): Promise<GeraetListenEintrag[]> {
  void filter;
  throw new Error(NI);
}

/** null, wenn nicht vorhanden oder außerhalb des Geltungsbereichs. Prüfer sehen nur zugewiesene Prüfarten. */
export async function holeGeraetDetail(geraetId: Id): Promise<GeraetDetail | null> {
  void geraetId;
  throw new Error(NI);
}

/** Aus dem Katalog (freigegeben und Entwurf), alphabetisch nach Label. */
export async function listeGeraetegruppen(): Promise<GeraetegruppeOption[]> {
  throw new Error(NI);
}

/** Nur Rolle pruefer: zugewiesene Prüfarten; 'faellig' vor 'spaeter', innerhalb nach faelligAm (null zuerst). */
export async function listePrueferAufgaben(): Promise<PrueferAufgabe[]> {
  throw new Error(NI);
}

/** Kontext für das Nachweisformular; null ohne Recht nachweis.erfassen auf diese Prüfart. */
export async function holeNachweisKontext(geraetPruefartId: Id): Promise<PrueferAufgabe | null> {
  void geraetPruefartId;
  throw new Error(NI);
}

/** Nur für src/app/api/nachweise/[id]/route.ts. null außerhalb des Geltungsbereichs. */
export async function holeNachweisPdf(
  nachweisId: Id,
): Promise<{ dateiname: string; inhalt: Uint8Array } | null> {
  void nachweisId;
  throw new Error(NI);
}
