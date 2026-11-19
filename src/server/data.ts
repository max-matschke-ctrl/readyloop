// Vertrag §3.5 – Datenzugriffsschicht (BE-6).
// Nur aus Server Components, Server Actions und Route Handlern importieren.
import { notFound, redirect } from 'next/navigation';
import { can } from '@/domain/rechte';
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
import * as dienste from './dienste';
import { heute as heuteIntern, holeRepository, istDemoModus as istDemoModusIntern, leseSitzung } from './sitzung';

/** true, wenn NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. */
export function istDemoModus(): boolean {
  return istDemoModusIntern();
}

/** Heutiges Datum in Europe/Berlin. */
export function heute(): IsoDate {
  return heuteIntern();
}

export async function holeSitzung(): Promise<Sitzung | null> {
  return leseSitzung();
}

/** Ohne Sitzung: redirect('/login'). Mit aktion und ohne Recht (can): notFound(). */
export async function erfordereSitzung(aktion?: Aktion): Promise<Sitzung> {
  const sitzung = await leseSitzung();
  if (!sitzung) redirect('/login');
  if (aktion && !can(sitzung.rolle, aktion)) notFound();
  return sitzung;
}

/** Bereiche im Geltungsbereich der Sitzung, alphabetisch. */
export async function listeBereiche(): Promise<Bereich[]> {
  return dienste.listeBereiche(await erfordereSitzung(), holeRepository());
}

/** Sortierung: Gesamtstatus nach Schwere, dann naechsteFaelligkeit aufsteigend (null zuletzt), dann Bezeichnung. */
export async function listeGeraete(filter?: GeraeteFilter): Promise<GeraetListenEintrag[]> {
  return dienste.listeGeraete(await erfordereSitzung(), holeRepository(), heute(), filter);
}

/** null, wenn nicht vorhanden oder außerhalb des Geltungsbereichs. Prüfer sehen nur zugewiesene Prüfarten. */
export async function holeGeraetDetail(geraetId: Id): Promise<GeraetDetail | null> {
  return dienste.holeGeraetDetail(await erfordereSitzung(), holeRepository(), heute(), geraetId);
}

/** Aus dem Katalog (freigegeben und Entwurf), alphabetisch nach Label. */
export async function listeGeraetegruppen(): Promise<GeraetegruppeOption[]> {
  await erfordereSitzung('katalog.lesen');
  return dienste.listeGeraetegruppen(holeRepository());
}

/** Nur Rolle pruefer: zugewiesene Prüfarten; 'faellig' vor 'spaeter', innerhalb nach faelligAm (null zuerst). */
export async function listePrueferAufgaben(): Promise<PrueferAufgabe[]> {
  return dienste.listePrueferAufgaben(await erfordereSitzung(), holeRepository(), heute());
}

/** Kontext für das Nachweisformular; null ohne Recht nachweis.erfassen auf diese Prüfart. */
export async function holeNachweisKontext(geraetPruefartId: Id): Promise<PrueferAufgabe | null> {
  return dienste.holeNachweisKontext(await erfordereSitzung(), holeRepository(), heute(), geraetPruefartId);
}

/** Nur für src/app/api/nachweise/[id]/route.ts. null ohne Sitzung oder außerhalb des Geltungsbereichs. */
export async function holeNachweisPdf(
  nachweisId: Id,
): Promise<{ dateiname: string; inhalt: Uint8Array } | null> {
  const sitzung = await leseSitzung();
  if (!sitzung) return null;
  return dienste.holeNachweisPdf(sitzung, holeRepository(), nachweisId);
}
