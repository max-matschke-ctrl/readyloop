// Vertrag §3.5/§5.4 – Datenzugriffsschicht (BE-6; I2-Signaturen BE-7, Umsetzung BE-11).
// Nur aus Server Components, Server Actions und Route Handlern importieren.
import { notFound, redirect } from 'next/navigation';
import { can } from '@/domain/rechte';
import type {
  Aktion,
  Anmeldestatus,
  Bereich,
  BereichAnsicht,
  Betriebsmodus,
  GeraetDetail,
  GeraeteFilter,
  GeraetegruppeOption,
  GeraetListenEintrag,
  Id,
  IsoDate,
  MangelAnsicht,
  MangelFilter,
  MangelFormularKontext,
  MitgliedAnsicht,
  OrganisationOption,
  PersonOption,
  PrueferAufgabe,
  PrueferOption,
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

// ---------------------------------------------------------------------------
// Inkrement 2 (§5.4) – Signaturen, Umsetzung BE-11
// ---------------------------------------------------------------------------

function nichtImplementiert(): never {
  throw new Error('nicht implementiert (BE-11)');
}

/** F-8: 'supabase' bei URL + Anon-Key; 'demo' wenn beide fehlen und (NODE_ENV ≠ 'production' oder READYLOOP_DEMO === '1'); sonst 'unkonfiguriert'. */
export function betriebsmodus(): Betriebsmodus {
  return nichtImplementiert();
}

/** Für '/' und Login: 'unkonfiguriert' | 'abgemeldet' | 'ohne_mitgliedschaft' (Supabase-Login ohne aktive Mitgliedschaft) | 'angemeldet'. */
export async function holeAnmeldestatus(): Promise<Anmeldestatus> {
  return nichtImplementiert();
}

/** true, wenn ein Supabase-Auth-Benutzer angemeldet ist (auch ohne Mitgliedschaft) – für /passwort-neu. Demo: false. */
export async function hatAuthSitzung(): Promise<boolean> {
  return nichtImplementiert();
}

/** Aktive Mitgliedschaften des angemeldeten Benutzers, alphabetisch (= sitzung.organisationen). */
export async function listeMeineOrganisationen(): Promise<OrganisationOption[]> {
  return nichtImplementiert();
}

// --- Mängel ---

/** mangel.lesen + Geltungsbereich (Prüfer: Mängel zugewiesener Prüfarten). Sortierung: Schwere, termin aufsteigend, erfasstAm. */
export async function listeMaengel(filter?: MangelFilter): Promise<MangelAnsicht[]> {
  void filter;
  return nichtImplementiert();
}

/** null ohne Recht oder außerhalb des Geltungsbereichs. */
export async function holeMangel(mangelId: Id): Promise<MangelAnsicht | null> {
  void mangelId;
  return nichtImplementiert();
}

/** mangel.erfassen + Gerät im Geltungsbereich; nachweisId muss zum Gerät gehören (setzt vorbelegtePruefartId). Sonst null. */
export async function holeMangelFormular(
  geraetId: Id,
  vorbelegung?: { geraetPruefartId?: Id; nachweisId?: Id },
): Promise<MangelFormularKontext | null> {
  void geraetId;
  void vorbelegung;
  return nichtImplementiert();
}

/** mangel.bearbeiten: aktive Mitglieder mit Rolle admin, sifa, verantwortlicher; alphabetisch. */
export async function listeMangelVerantwortliche(): Promise<PersonOption[]> {
  return nichtImplementiert();
}

// --- Prüfer ---

/** pruefer.zuweisen: aktive Mitglieder mit Rolle pruefer, alphabetisch. Sonst []. */
export async function listePrueferOptionen(): Promise<PrueferOption[]> {
  return nichtImplementiert();
}

// --- Verwaltung ---

/** bereich.verwalten, sonst notFound(). Alphabetisch. */
export async function listeBereicheVerwaltung(): Promise<BereichAnsicht[]> {
  return nichtImplementiert();
}

/** mitglied.verwalten, sonst notFound(). Aktive zuerst, dann alphabetisch. */
export async function listeMitglieder(): Promise<MitgliedAnsicht[]> {
  return nichtImplementiert();
}

/** mitglied.verwalten; null, wenn nicht in der Organisation. */
export async function holeMitglied(mitgliedschaftId: Id): Promise<MitgliedAnsicht | null> {
  void mitgliedschaftId;
  return nichtImplementiert();
}
