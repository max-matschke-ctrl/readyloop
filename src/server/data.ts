// Vertrag §3.5/§5.4 – Datenzugriffsschicht (BE-6, BE-11).
// Nur aus Server Components, Server Actions und Route Handlern importieren.
import { notFound, redirect } from 'next/navigation';
import { can } from '@/domain/rechte';
import type {
  Aktion,
  Anmeldestatus,
  Bereich,
  BereichAnsicht,
  Betriebsmodus,
  Etikett,
  EtikettenFilter,
  GeraetKurzansicht,
  GeraetDetail,
  GeraeteFilter,
  GeraetegruppeOption,
  GeraetListenEintrag,
  Id,
  IsoDate,
  MangelAnsicht,
  MangelFilter,
  MangelFormularKontext,
  MeinGeraet,
  MitgliedAnsicht,
  OrganisationOption,
  PersonOption,
  PrueferAufgabe,
  PrueferOption,
  Sitzung,
  TokenSeite,
} from '@/domain/types';
import * as dienste from './dienste';
import * as maengel from './dienste-maengel';
import * as verwaltung from './dienste-verwaltung';
import {
  betriebsmodus as betriebsmodusIntern,
  heute as heuteIntern,
  holeRepository,
  leseSitzung,
} from './sitzung';

/** F-8: 'supabase' bei URL + Anon-Key; 'demo' wenn beide fehlen und (NODE_ENV ≠ 'production' oder READYLOOP_DEMO === '1'); sonst 'unkonfiguriert'. */
export function betriebsmodus(): Betriebsmodus {
  return betriebsmodusIntern();
}

/** betriebsmodus() === 'demo'. */
export function istDemoModus(): boolean {
  return betriebsmodusIntern() === 'demo';
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

async function mitRepo() {
  const sitzung = await erfordereSitzung();
  return { sitzung, repo: await holeRepository(sitzung) };
}

/** Für '/' und Login. */
export async function holeAnmeldestatus(): Promise<Anmeldestatus> {
  const modus = betriebsmodusIntern();
  if (modus === 'unkonfiguriert') return 'unkonfiguriert';
  if (await leseSitzung()) return 'angemeldet';
  if (modus === 'supabase' && (await hatAuthSitzung())) return 'ohne_mitgliedschaft';
  return 'abgemeldet';
}

/** true, wenn ein Supabase-Auth-Benutzer angemeldet ist (auch ohne Mitgliedschaft) – für /passwort-neu. Demo: false. */
export async function hatAuthSitzung(): Promise<boolean> {
  if (betriebsmodusIntern() !== 'supabase') return false;
  const { holeAuthBenutzer } = await import('./supabase/sitzung');
  return (await holeAuthBenutzer()) !== null;
}

/** Aktive Mitgliedschaften des angemeldeten Benutzers, alphabetisch (= sitzung.organisationen). */
export async function listeMeineOrganisationen(): Promise<OrganisationOption[]> {
  return (await erfordereSitzung()).organisationen;
}

/** Bereiche im Geltungsbereich der Sitzung, alphabetisch. */
export async function listeBereiche(): Promise<Bereich[]> {
  const { sitzung, repo } = await mitRepo();
  return dienste.listeBereiche(sitzung, repo);
}

/** Sortierung: Gesamtstatus nach Schwere, dann naechsteFaelligkeit aufsteigend (null zuletzt), dann Bezeichnung. */
export async function listeGeraete(filter?: GeraeteFilter): Promise<GeraetListenEintrag[]> {
  const { sitzung, repo } = await mitRepo();
  return dienste.listeGeraete(sitzung, repo, heute(), filter);
}

/** null, wenn nicht vorhanden oder außerhalb des Geltungsbereichs. Prüfer sehen nur zugewiesene Prüfarten.
 *  I3M: liefert nutzung (F-22, F-27; null für Prüfer). */
export async function holeGeraetDetail(geraetId: Id): Promise<GeraetDetail | null> {
  const { sitzung, repo } = await mitRepo();
  return dienste.holeGeraetDetail(sitzung, repo, heute(), geraetId);
}

/** Aus dem Katalog (freigegeben und Entwurf), alphabetisch nach Label. */
export async function listeGeraetegruppen(): Promise<GeraetegruppeOption[]> {
  const sitzung = await erfordereSitzung('katalog.lesen');
  return dienste.listeGeraetegruppen(await holeRepository(sitzung));
}

/** Nur Rolle pruefer: zugewiesene Prüfarten der aktuellen Organisation. */
export async function listePrueferAufgaben(): Promise<PrueferAufgabe[]> {
  const { sitzung, repo } = await mitRepo();
  return dienste.listePrueferAufgaben(sitzung, repo, heute());
}

/** Kontext für das Nachweisformular; null ohne Recht nachweis.erfassen auf diese Prüfart. */
export async function holeNachweisKontext(geraetPruefartId: Id): Promise<PrueferAufgabe | null> {
  const { sitzung, repo } = await mitRepo();
  return dienste.holeNachweisKontext(sitzung, repo, heute(), geraetPruefartId);
}

/** Nur für src/app/api/nachweise/[id]/route.ts. null ohne Sitzung oder außerhalb des Geltungsbereichs. */
export async function holeNachweisPdf(nachweisId: Id): Promise<{ dateiname: string; inhalt: Uint8Array } | null> {
  const sitzung = await leseSitzung();
  if (!sitzung) return null;
  return dienste.holeNachweisPdf(sitzung, await holeRepository(sitzung), nachweisId);
}

// --- Mängel ---

/** mangel.lesen + Geltungsbereich (Prüfer: Mängel zugewiesener Prüfarten). Sortierung: Schwere, termin aufsteigend, erfasstAm. */
export async function listeMaengel(filter?: MangelFilter): Promise<MangelAnsicht[]> {
  const { sitzung, repo } = await mitRepo();
  return maengel.listeMaengel(sitzung, repo, heute(), filter);
}

/** null ohne Recht oder außerhalb des Geltungsbereichs. */
export async function holeMangel(mangelId: Id): Promise<MangelAnsicht | null> {
  const { sitzung, repo } = await mitRepo();
  return maengel.holeMangel(sitzung, repo, heute(), mangelId);
}

/** mangel.erfassen + Gerät im Geltungsbereich; nachweisId muss zum Gerät gehören (setzt vorbelegtePruefartId). Sonst null. */
export async function holeMangelFormular(
  geraetId: Id,
  vorbelegung?: { geraetPruefartId?: Id; nachweisId?: Id },
): Promise<MangelFormularKontext | null> {
  const { sitzung, repo } = await mitRepo();
  return maengel.holeMangelFormular(sitzung, repo, heute(), geraetId, vorbelegung);
}

/** mangel.bearbeiten: aktive Mitglieder mit Rolle admin, sifa, verantwortlicher; alphabetisch. */
export async function listeMangelVerantwortliche(): Promise<PersonOption[]> {
  const { sitzung, repo } = await mitRepo();
  return maengel.listeMangelVerantwortliche(sitzung, repo);
}

// --- Prüfer ---

/** pruefer.zuweisen: aktive Mitglieder mit Rolle pruefer, alphabetisch. Sonst []. */
export async function listePrueferOptionen(): Promise<PrueferOption[]> {
  const { sitzung, repo } = await mitRepo();
  return dienste.listePrueferOptionen(sitzung, repo);
}

// --- Verwaltung ---

/** bereich.verwalten, sonst notFound(). Alphabetisch. */
export async function listeBereicheVerwaltung(): Promise<BereichAnsicht[]> {
  const sitzung = await erfordereSitzung('bereich.verwalten');
  return verwaltung.listeBereicheVerwaltung(sitzung, await holeRepository(sitzung));
}

/** mitglied.verwalten, sonst notFound(). Aktive zuerst, dann alphabetisch. */
export async function listeMitglieder(): Promise<MitgliedAnsicht[]> {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  return verwaltung.listeMitglieder(sitzung, await holeRepository(sitzung));
}

/** mitglied.verwalten (sonst notFound()); null, wenn nicht in der Organisation. */
export async function holeMitglied(mitgliedschaftId: Id): Promise<MitgliedAnsicht | null> {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  return verwaltung.holeMitglied(sitzung, await holeRepository(sitzung), mitgliedschaftId);
}

// --- Inkrement I3M (§7.5) ---

const NICHT_IMPLEMENTIERT = 'nicht implementiert (BE-18)';

/** F-24. Ohne Sitzung aufrufbar, nie Redirect. null bei falschem Format (ohne Datenzugriff), unbekanntem oder
 *  deaktiviertem Token. kurz nur für Rolle mitarbeiter derselben Organisation; akteUrl bei geraet.lesen + Geltungsbereich. */
export async function holeTokenSeite(token: string): Promise<TokenSeite | null> {
  void token;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** meine_geraete.lesen (sonst notFound()). Sortierung: nutzung (nicht_verwenden, unklar, verwendbar),
 *  dann naechsteFaelligkeit aufsteigend (null zuerst), dann Bezeichnung. */
export async function listeMeineGeraete(): Promise<MeinGeraet[]> {
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** geraet.suchen (sonst notFound()). suche < 2 Zeichen → []. Höchstens 50 Treffer, nach Bezeichnung. */
export async function sucheGeraete(suche: string): Promise<GeraetKurzansicht[]> {
  void suche;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** Kontext für /mangel-melden/[geraetId]: nur Rolle mitarbeiter, Gerät der eigenen Organisation; sonst null. */
export async function holeMangelMeldung(geraetId: Id): Promise<GeraetKurzansicht | null> {
  void geraetId;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** geraet.zuordnen: aktive Mitglieder mit Rolle mitarbeiter, alphabetisch. Sonst []. */
export async function listeMitarbeiterOptionen(): Promise<PersonOption[]> {
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** mitarbeiter.einladen (sonst notFound()): Mitglieder mit Rolle mitarbeiter, aktive zuerst, dann alphabetisch. */
export async function listeMitarbeiter(): Promise<MitgliedAnsicht[]> {
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** etikett.verwalten (sonst notFound()). F-25: nur Geräte im Geltungsbereich, höchstens ETIKETTEN_MAX;
 *  ohne geraetIds und ohne kategorie gilt kategorie 'wechselnd'. Sortierung Bereich, Inventarnummer, Bezeichnung. */
export async function holeEtiketten(filter: EtikettenFilter): Promise<Etikett[]> {
  void filter;
  throw new Error(NICHT_IMPLEMENTIERT);
}
