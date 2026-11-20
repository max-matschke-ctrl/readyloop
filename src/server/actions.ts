'use server';
// Vertrag §3.6/§5.5 – Server Actions (BE-6, BE-11; Auth BE-12).
// 'use server': nur async-Funktionen exportieren (keine Konstanten/Typen).
// Jede Action prüft Sitzung und Recht (can) serverseitig selbst; die Dienste prüfen zusätzlich den Geltungsbereich.

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { can } from '@/domain/rechte';
import {
  anlassAufhebenSchema,
  anlassErfassenSchema,
  bereichSpeichernSchema,
  betriebsstatusSetzenSchema,
  demoRolleSchema,
  fristFreigebenSchema,
  gbuDokumentSetzenSchema,
  geraetAnlegenSchema,
  geraetVerschiebenSchema,
  mangelBehebenSchema,
  mangelErfassenSchema,
  mangelKenntnisSchema,
  mitgliedAendernSchema,
  mitgliedEinladenSchema,
  nachweisErfassenSchema,
  organisationWaehlenSchema,
  prueferZuweisenSchema,
} from '@/domain/schemas';
import type { Aktion, ActionState, Sitzung } from '@/domain/types';
import * as auth from './auth';
import * as dienste from './dienste';
import type { DienstErgebnis } from './dienste-basis';
import * as maengel from './dienste-maengel';
import * as verwaltung from './dienste-verwaltung';
import { sichererRuecksprung } from './pfade';
import { RepositoryFehler } from './repo/supabase/mapping';
import { DEMO_COOKIE, DEMO_COOKIE_OPTIONEN, ORG_COOKIE, ORG_COOKIE_OPTIONEN, heute, holeRepository, istDemoModus, leseSitzung } from './sitzung';

function felder(formData: FormData, namen: readonly string[], mehrfach: readonly string[] = []): Record<string, unknown> {
  return {
    ...Object.fromEntries(namen.map((n) => [n, formData.get(n)])),
    ...Object.fromEntries(mehrfach.map((n) => [n, formData.getAll(n).filter((v): v is string => typeof v === 'string' && v !== '')])),
  };
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

/**
 * Gemeinsamer Ablauf: Recht → Zod → Dienst (mit Fehlerabfang). Liefert das Dienstergebnis oder einen ActionState.
 * Redirects stehen bewusst außerhalb, weil redirect() per Exception arbeitet.
 */
async function fuehreAus<S extends z.ZodType, T extends object>(
  aktion: Aktion,
  schema: S,
  roh: Record<string, unknown>,
  dienst: (sitzung: Sitzung, eingabe: z.infer<S>) => Promise<DienstErgebnis<T>>,
  name: string,
): Promise<{ ok: true; sitzung: Sitzung; ergebnis: { ok: true } & T } | { ok: false; state: ActionState }> {
  const sitzung = await sitzungMitRecht(aktion);
  if (!sitzung) return { ok: false, state: KEIN_RECHT };
  const geprueft = schema.safeParse(roh);
  if (!geprueft.success) return { ok: false, state: validierungsfehler(geprueft.error) };
  try {
    const ergebnis = await dienst(sitzung, geprueft.data);
    if (!ergebnis.ok) return { ok: false, state: dienstFehler(ergebnis) };
    return { ok: true, sitzung, ergebnis };
  } catch (e) {
    // Supabase: Postgres-/RLS-Fehler (23514, 42501, 23505 …) kommen als RepositoryFehler mit deutscher Meldung.
    if (e instanceof RepositoryFehler) return { ok: false, state: { status: 'fehler', meldung: e.meldung } };
    console.error(name, e);
    return { ok: false, state: UNERWARTET };
  }
}

const zeit = () => ({ heute: heute(), jetzt: new Date() });

// ---------------------------------------------------------------------------
// Sitzung und Anmeldung
// ---------------------------------------------------------------------------

/** Nur Demo-Modus. Setzt Cookie rl_demo_rolle; Erfolg: redirect('/pruefer') für pruefer, sonst redirect('/geraete'). */
export async function setzeDemoRolle(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  if (!istDemoModus()) return { status: 'fehler', meldung: 'Der Demo-Modus ist nicht aktiv.' };
  const geprueft = demoRolleSchema.safeParse(felder(formData, ['rolle']));
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  const jar = await cookies();
  jar.set(DEMO_COOKIE, geprueft.data.rolle, DEMO_COOKIE_OPTIONEN);
  jar.delete({ name: ORG_COOKIE, path: '/' });
  redirect(geprueft.data.rolle === 'pruefer' ? '/pruefer' : '/geraete');
}

/** Supabase signOut (Modus supabase), Cookies rl_org und rl_demo_rolle löschen; redirect('/login'). */
export async function abmelden(): Promise<void> {
  await auth.abmeldenSupabase();
  const jar = await cookies();
  jar.delete({ name: DEMO_COOKIE, path: '/' });
  jar.delete({ name: ORG_COOKIE, path: '/' });
  redirect('/login');
}

/** Nur Modus supabase. Fehler immer 'E-Mail oder Passwort ist falsch.'. Erfolg: redirect('/'). */
export async function anmelden(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const ergebnis = await auth.anmelden(felder(formData, ['email', 'passwort']));
  if (ergebnis.status !== 'ok') return ergebnis;
  redirect('/');
}

/** Nur Modus supabase. Antwort immer gleich (keine Kontoaufzählung). */
export async function passwortVergessen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  return auth.passwortVergessen(felder(formData, ['email']));
}

/** Verlangt Auth-Sitzung (aus Einladungs- oder Reset-Link). Erfolg: redirect('/'). */
export async function passwortSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const ergebnis = await auth.passwortSetzen(felder(formData, ['passwort', 'passwortWiederholung']));
  if (ergebnis.status !== 'ok') return ergebnis;
  redirect('/');
}

/**
 * Review I2 (Befund 7): Formular der Seite /auth/bestaetigen (Felder token_hash, type, next; hidden).
 * Ruft verifyOtp auf; Erfolg: redirect(next bereinigt, Standard '/passwort-neu'); Fehler: redirect('/login?fehler=link').
 */
export async function bestaetigeOtp(formData: FormData): Promise<void> {
  redirect(await auth.bestaetigeOtp(felder(formData, ['token_hash', 'type', 'next'])));
}

/** Nur eigene aktive Mitgliedschaft; setzt Cookie rl_org. Erfolg: redirect('/'). */
export async function waehleOrganisation(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const sitzung = await leseSitzung();
  if (!sitzung) redirect('/login');
  const geprueft = organisationWaehlenSchema.safeParse(felder(formData, ['organisationId']));
  if (!geprueft.success) return validierungsfehler(geprueft.error);
  if (!sitzung.organisationen.some((o) => o.id === geprueft.data.organisationId)) {
    return dienstFehler({ fehler: 'Organisation nicht verfügbar.', feld: 'organisationId' });
  }
  (await cookies()).set(ORG_COOKIE, geprueft.data.organisationId, ORG_COOKIE_OPTIONEN);
  revalidatePath('/', 'layout');
  redirect('/');
}

// ---------------------------------------------------------------------------
// Geräte, Fristen, Nachweise
// ---------------------------------------------------------------------------

/** Recht geraet.anlegen + Bereich im Geltungsbereich. Erfolg: redirect(`/geraete/${id}`). */
export async function geraetAnlegen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'geraet.anlegen',
    geraetAnlegenSchema,
    felder(formData, ['bezeichnung', 'inventarnummer', 'bereichId', 'geraetegruppe', 'kategorie', 'hersteller', 'typ', 'seriennummer', 'baujahr', 'einsatzort', 'pruefartenJson']),
    async (s, e) => dienste.geraetAnlegen(s, await holeRepository(s), e, zeit()),
    'geraetAnlegen',
  );
  if (!r.ok) return r.state;
  revalidatePath('/geraete');
  redirect(`/geraete/${r.ergebnis.id}`);
}

/** Recht frist.freigeben + Geltungsbereich; F-4, F-13. Rückgabe { status: 'ok', meldung: 'Frist freigegeben', id }. */
export async function fristFreigeben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'frist.freigeben',
    fristFreigebenSchema,
    felder(formData, ['modus', 'geraetPruefartId', 'monate', 'fundstelle', 'begruendung', 'nachweisId']),
    async (s, e) => dienste.fristFreigeben(s, await holeRepository(s), e, new Date()),
    'fristFreigeben',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  revalidatePath('/pruefer');
  return { status: 'ok', meldung: 'Frist freigegeben', id: r.ergebnis.pruefartId };
}

/** Recht nachweis.erfassen + Geltungsbereich; F-7, F-12, F-13. Ergebnis ≠ ohne_maengel → Mängelformular. */
export async function nachweisErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'nachweis.erfassen',
    nachweisErfassenSchema,
    felder(formData, ['geraetPruefartId', 'pruefdatum', 'ergebnis', 'pruefumfang', 'prueferName', 'unterschriftImPdf', 'pdf', 'fristEmpfehlungMonate']),
    async (s, e) => {
      const { pdf, ...rest } = e;
      return dienste.nachweisErfassen(
        s,
        await holeRepository(s),
        { ...rest, unterschriftImPdf: true, pdf: { name: pdf.name, inhalt: new Uint8Array(await pdf.arrayBuffer()) } },
        zeit(),
      );
    },
    'nachweisErfassen',
  );
  if (!r.ok) return r.state;
  const { sitzung, ergebnis } = r;
  const geraetId = ergebnis.geraetId;
  revalidatePath(`/geraete/${geraetId}`);
  revalidatePath('/geraete');
  revalidatePath('/pruefer');
  const ziel = sitzung.rolle === 'pruefer' ? '/pruefer' : `/geraete/${geraetId}`;
  if (formData.get('ergebnis') !== 'ohne_maengel' && can(sitzung.rolle, 'mangel.erfassen')) {
    const pruefartId = String(formData.get('geraetPruefartId'));
    redirect(
      `/maengel/neu?geraet=${geraetId}&pruefart=${encodeURIComponent(pruefartId)}&nachweis=${ergebnis.id}&zurueck=${encodeURIComponent(ziel)}`,
    );
  }
  redirect(ziel);
}

/** pruefer.zuweisen + Geltungsbereich; F-15. Warnung blockiert nicht. */
export async function prueferZuweisen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'pruefer.zuweisen',
    prueferZuweisenSchema,
    felder(formData, ['geraetPruefartId', 'prueferId']),
    async (s, e) => dienste.prueferZuweisen(s, await holeRepository(s), e, new Date()),
    'prueferZuweisen',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/pruefer');
  return { status: 'ok', meldung: r.ergebnis.entfernt ? 'Zuweisung entfernt' : 'Prüfer zugewiesen', id: r.ergebnis.pruefartId };
}

/** frist.freigeben + Geltungsbereich; F-18. */
export async function gbuDokumentSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'frist.freigeben',
    gbuDokumentSetzenSchema,
    felder(formData, ['geraetPruefartId', 'titel', 'url']),
    async (s, e) => dienste.gbuDokumentSetzen(s, await holeRepository(s), e, new Date()),
    'gbuDokumentSetzen',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  return { status: 'ok', meldung: 'GBU-Verweis gespeichert', id: r.ergebnis.pruefartId };
}

/** geraet.bearbeiten + Geltungsbereich; F-11. */
export async function betriebsstatusSetzen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'geraet.bearbeiten',
    betriebsstatusSetzenSchema,
    felder(formData, ['geraetId', 'betriebsstatus', 'begruendung']),
    async (s, e) => dienste.betriebsstatusSetzen(s, await holeRepository(s), e, new Date()),
    'betriebsstatusSetzen',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  return { status: 'ok', meldung: 'Betriebsstatus geändert', id: r.ergebnis.geraetId };
}

/** geraet.bearbeiten + darfVerschieben; F-16. Redirect auf das Gerät bzw. die Liste, wenn es nicht mehr sichtbar ist. */
export async function geraetVerschieben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'geraet.bearbeiten',
    geraetVerschiebenSchema,
    felder(formData, ['geraetId', 'bereichId', 'begruendung']),
    async (s, e) => dienste.geraetVerschieben(s, await holeRepository(s), e, new Date()),
    'geraetVerschieben',
  );
  if (!r.ok) return r.state;
  revalidatePath('/geraete');
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  redirect(r.ergebnis.nochSichtbar ? `/geraete/${r.ergebnis.geraetId}` : '/geraete');
}

/** anlass.erfassen + Geltungsbereich; F-10. */
export async function anlassErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'anlass.erfassen',
    anlassErfassenSchema,
    felder(formData, ['geraetId', 'art', 'datum', 'beschreibung'], ['geraetPruefartIds']),
    async (s, e) => dienste.anlassErfassen(s, await holeRepository(s), e, zeit()),
    'anlassErfassen',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  revalidatePath('/pruefer');
  return { status: 'ok', meldung: 'Anlass erfasst', id: r.ergebnis.geraetId };
}

/** anlass.erfassen + Geltungsbereich; nur offene Anlässe. */
export async function anlassAufheben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'anlass.erfassen',
    anlassAufhebenSchema,
    felder(formData, ['anlassId', 'grund']),
    async (s, e) => dienste.anlassAufheben(s, await holeRepository(s), e, new Date()),
    'anlassAufheben',
  );
  if (!r.ok) return r.state;
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  revalidatePath('/pruefer');
  return { status: 'ok', meldung: 'Anlass aufgehoben', id: r.ergebnis.anlassId };
}

// ---------------------------------------------------------------------------
// Mängel
// ---------------------------------------------------------------------------

/** mangel.erfassen + Geltungsbereich; F-14. Redirect auf zurueck (nur relative Pfade) bzw. Default. */
export async function mangelErfassen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'mangel.erfassen',
    mangelErfassenSchema,
    felder(formData, ['geraetId', 'geraetPruefartId', 'nachweisId', 'beschreibung', 'schwere', 'termin', 'verantwortlichId', 'zurueck']),
    async (s, e) => maengel.mangelErfassen(s, await holeRepository(s), e, zeit()),
    'mangelErfassen',
  );
  if (!r.ok) return r.state;
  revalidatePath('/maengel');
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  const standard = r.sitzung.rolle === 'pruefer' ? '/pruefer' : `/maengel/${r.ergebnis.id}`;
  redirect(sichererRuecksprung(formData.get('zurueck'), standard));
}

/** mangel.bearbeiten + Geltungsbereich; nur Status 'offen'. */
export async function mangelKenntnisNehmen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'mangel.bearbeiten',
    mangelKenntnisSchema,
    felder(formData, ['mangelId', 'verantwortlichId', 'termin']),
    async (s, e) => maengel.mangelKenntnisNehmen(s, await holeRepository(s), e, zeit()),
    'mangelKenntnisNehmen',
  );
  if (!r.ok) return r.state;
  revalidatePath('/maengel');
  revalidatePath(`/maengel/${r.ergebnis.id}`);
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  return { status: 'ok', meldung: 'Zur Kenntnis genommen', id: r.ergebnis.id };
}

/** mangel.bearbeiten + Geltungsbereich; Status 'offen' oder 'in_bearbeitung'. */
export async function mangelBeheben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'mangel.bearbeiten',
    mangelBehebenSchema,
    felder(formData, ['mangelId', 'behobenAm', 'behobenDurch', 'behebung']),
    async (s, e) => maengel.mangelBeheben(s, await holeRepository(s), e, zeit()),
    'mangelBeheben',
  );
  if (!r.ok) return r.state;
  revalidatePath('/maengel');
  revalidatePath(`/maengel/${r.ergebnis.id}`);
  revalidatePath(`/geraete/${r.ergebnis.geraetId}`);
  revalidatePath('/geraete');
  return { status: 'ok', meldung: 'Mangel behoben', id: r.ergebnis.id };
}

// ---------------------------------------------------------------------------
// Verwaltung
// ---------------------------------------------------------------------------

/** bereich.verwalten. Neu oder ändern (Name, Einsatzort). */
export async function bereichSpeichern(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'bereich.verwalten',
    bereichSpeichernSchema,
    felder(formData, ['bereichId', 'name', 'einsatzort']),
    async (s, e) => verwaltung.bereichSpeichern(s, await holeRepository(s), e, new Date()),
    'bereichSpeichern',
  );
  if (!r.ok) return r.state;
  revalidatePath('/admin/bereiche');
  revalidatePath('/geraete');
  return { status: 'ok', meldung: 'Bereich gespeichert', id: r.ergebnis.id };
}

/** mitglied.verwalten. F-17. Doppelte Mitgliedschaft → feldfehler.email. */
export async function mitgliedEinladen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'mitglied.verwalten',
    mitgliedEinladenSchema,
    felder(formData, ['email', 'name', 'rolle'], ['bereichIds', 'prueferTypen']),
    async (s, e) => verwaltung.mitgliedEinladen(s, await holeRepository(s), e, new Date()),
    'mitgliedEinladen',
  );
  if (!r.ok) return r.state;
  revalidatePath('/admin/mitglieder');
  return { status: 'ok', meldung: r.ergebnis.meldung, id: r.ergebnis.id };
}

/** mitglied.verwalten. F-17 (letzter Admin, eigene Mitgliedschaft). */
export async function mitgliedAendern(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  const r = await fuehreAus(
    'mitglied.verwalten',
    mitgliedAendernSchema,
    felder(formData, ['mitgliedschaftId', 'name', 'rolle', 'aktiv'], ['bereichIds', 'prueferTypen']),
    async (s, e) => verwaltung.mitgliedAendern(s, await holeRepository(s), e, new Date()),
    'mitgliedAendern',
  );
  if (!r.ok) return r.state;
  revalidatePath('/admin/mitglieder');
  revalidatePath(`/admin/mitglieder/${r.ergebnis.id}`);
  return { status: 'ok', meldung: 'Gespeichert', id: r.ergebnis.id };
}

// ---------------------------------------------------------------------------
// Inkrement I3M (§7.6) – Stubs bis BE-18
// ---------------------------------------------------------------------------

const STUB: ActionState = { status: 'fehler', meldung: 'nicht implementiert (BE-18)' };

/** geraet.uebernehmen; F-23. */
export async function geraetUebernehmen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** geraet.uebernehmen; nur eigene offene Übernahme. */
export async function geraetZurueckgeben(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** mangel.erfassen + Rolle mitarbeiter; F-26. */
export async function mangelMelden(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** geraet.zuordnen + Geltungsbereich; F-22. */
export async function geraetZuordnen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** geraet.zuordnen + Geltungsbereich; F-23 (c). */
export async function uebernahmeBeenden(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** etikett.verwalten + Geltungsbereich; F-24. */
export async function etikettErneuern(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}

/** mitarbeiter.einladen; F-20 (Rolle fest 'mitarbeiter', keine Bereiche). */
export async function mitarbeiterEinladen(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  throw new Error(STUB.meldung);
}
