// Vertrag §9.4 – E-Mail-Erinnerungen (F-30 bis F-35). Rein und deterministisch, ohne Framework-Abhängigkeit,
// ohne Date.now(): „heute“ kommt immer als Parameter.
import type {
  AbbestellbareMailArt,
  Betriebsstatus,
  Bereich,
  Dringlichkeit,
  ErinnerungEinstellung,
  ErinnerungStufe,
  FristStatus,
  GeraeteKategorie,
  Id,
  IsoDate,
  MailArt,
  Nutzung,
  OeffentlicheFrist,
  PostenArt,
  PostenRolle,
  Rolle,
  StatusErgebnis,
  VorNutzungGrund,
} from './types';

const NICHT_IMPLEMENTIERT = 'nicht implementiert (BE-22)';

export function standardEinstellung(organisationId: Id, bereichId: Id): ErinnerungEinstellung {
  void organisationId;
  void bereichId;
  throw new Error(NICHT_IMPLEMENTIERT);
}

export function istStandard(
  e: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage' | 'sifaInKopie' | 'sifaEmpfaengerIds' | 'adminEmpfaengerIds'>,
): boolean {
  void e;
  throw new Error(NICHT_IMPLEMENTIERT);
}

export function stufeCode(s: ErinnerungStufe): string {
  void s;
  throw new Error(NICHT_IMPLEMENTIERT);
}

export function stufeAusCode(code: string): ErinnerungStufe | null {
  void code;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** Dringlicher = größer. vorlauf: −tage; e_verantwortlicher 1001, e_sifa 1002, e_admin 1003; 'woche'/'nicht_verwenden' 0. */
export function stufeRang(code: string): number {
  void code;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** 'v90' → 'Vorlauf 90 Tage'; 'e_verantwortlicher' → 'Fällig – an Verantwortliche'; 'e_sifa' → 'Eskaliert an Sifa';
 *  'e_admin' → 'Eskaliert an Admin/Geschäftsführung'; 'woche' → 'Wochenübersicht'; 'nicht_verwenden' → 'Hinweis „Nicht verwenden“'. */
export function stufeLabel(code: string): string {
  switch (code) {
    case 'e_verantwortlicher':
      return 'Fällig – an Verantwortliche';
    case 'e_sifa':
      return 'Eskaliert an Sifa';
    case 'e_admin':
      return 'Eskaliert an Admin/Geschäftsführung';
    case 'woche':
      return 'Wochenübersicht';
    case 'nicht_verwenden':
      return 'Hinweis „Nicht verwenden“';
  }
  const v = /^v(\d{1,3})$/.exec(code);
  if (v) return `Vorlauf ${Number(v[1])} Tage`;
  return code;
}

/** F-31/F-32: dringlichste erreichte Stufe oder null. r ≥ 1 → Vorlauf; r ≤ 0 → Eskalation mit u = −r. */
export function faelligeStufe(
  restTage: number,
  e: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage'>,
): ErinnerungStufe | null {
  void restTage;
  void e;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** F-38. */
export function dringlichkeitAus(status: Pick<StatusErgebnis, 'status' | 'restTage'>): Dringlichkeit {
  void status;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** F-35: null, wenn nutzung ≠ 'nicht_verwenden'. */
export function zustandsKennung(e: {
  nutzung: Nutzung;
  betriebsstatus: Betriebsstatus;
  letztesBetriebsstatusEreignisId: Id | null;
  gesamtStatus: FristStatus;
  gesamtStatusGrund: VorNutzungGrund | null;
  fruehestesUeberschrittenesFaelligAm: IsoDate | null;
  aeltesterGefaehrlicherMangelId: Id | null;
  aeltesterOffenerAnlassId: Id | null;
  letzterNichtBestandenNachweisId: Id | null;
}): string | null {
  void e;
  throw new Error(NICHT_IMPLEMENTIERT);
}

/** F-33 */
export function postenSchluessel(
  p:
    | { art: 'frist'; geraetPruefartId: Id; stufe: string; faelligAm: IsoDate; empfaengerId: Id }
    | { art: 'pruefer_woche'; geraetPruefartId: Id; montag: IsoDate; empfaengerId: Id }
    | { art: 'ma_hinweis'; geraetId: Id; zustandsKennung: string; empfaengerId: Id },
): string {
  void p;
  throw new Error(NICHT_IMPLEMENTIERT);
}

// ---------- Plan (rein) ----------

export interface PlanMitglied {
  benutzerId: Id;
  name: string; // nur für Protokoll/Tests – NIE im Mailinhalt
  email: string;
  rolle: Rolle;
  bereichIds: Id[]; // nur verantwortlicher
}

export interface PlanPruefart {
  geraetPruefartId: Id;
  geraetId: Id;
  bereichId: Id;
  geraetBezeichnung: string;
  inventarnummer: string | null;
  pruefartBezeichnung: string;
  betriebsstatus: Betriebsstatus;
  status: StatusErgebnis; // F-9 im Kontext
  frist: OeffentlicheFrist | null; // nur freigegebene Frist
  zugewiesenerPrueferId: Id | null;
  katalogEntwurf: boolean; // katalogSchluessel gesetzt und kein freigegebener Eintrag dieses Schlüssels
}

export interface PlanMaGeraet {
  geraetId: Id;
  bereichId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  kategorie: GeraeteKategorie;
  zugeordnetAn: Id | null; // aktives MA-Mitglied
  uebernommenVon: Id | null; // Benutzer-ID der offenen Übernahme (aktives MA-Mitglied)
  nutzung: Nutzung;
  grundText: string; // 'Überfällig', 'Gefährlicher Mangel offen', 'Außer Betrieb', …
  zustandsKennung: string | null;
}

export interface BisherigerPosten {
  art: PostenArt;
  stufe: string;
  geraetId: Id;
  geraetPruefartId: Id | null;
  bezugDatum: IsoDate | null;
  empfaengerBenutzerId: Id;
  schluessel: string;
}

export interface PlanEingabe {
  heute: IsoDate;
  organisationId: Id;
  bereiche: Pick<Bereich, 'id' | 'name'>[];
  einstellungen: ErinnerungEinstellung[]; // fehlende Bereiche → standardEinstellung
  mitglieder: PlanMitglied[]; // nur aktive
  pruefarten: PlanPruefart[];
  maGeraete: PlanMaGeraet[]; // nur Geräte mit Halter
  abmeldungen: { benutzerId: Id; art: AbbestellbareMailArt }[]; // nur abgemeldet = true
  bisherige: BisherigerPosten[]; // nur Posten mit Versandstatus in VERSAND_ERFOLGREICH
}

export interface PostenPlan {
  schluessel: string;
  art: PostenArt;
  stufe: string;
  rolle: PostenRolle;
  dringlichkeit: Dringlichkeit;
  geraetId: Id;
  geraetPruefartId: Id | null;
  bereichId: Id;
  bereichName: string;
  geraetBezeichnung: string;
  inventarnummer: string | null;
  pruefartBezeichnung: string | null;
  bezugDatum: IsoDate | null;
  faelligAm: IsoDate | null;
  restTage: number | null;
  status: FristStatus | null; // null bei ma_hinweis
  frist: OeffentlicheFrist | null;
  hinweise: string[]; // stufeLabel bei Eskalation, 'Bereich ohne Verantwortlichen', Nutzungsgrund, 'Bitte zurückgeben'
  katalogEntwurf: boolean;
  pfad: string; // relativ: `/geraete/${geraetId}` | '/pruefer' | '/meine-geraete'
}

export interface DigestPlan {
  art: MailArt;
  empfaenger: PlanMitglied;
  posten: PostenPlan[]; // DRINGLICHKEITEN, dann faelligAm (null zuletzt), bereichName, geraetBezeichnung, pruefartBezeichnung
  abbestellbar: boolean;
}

/** F-30 bis F-35. Deterministisch; höchstens ein Digest je Empfänger; Digests nach benutzerId sortiert; ohne Posten kein Digest. */
export function planeErinnerungen(eingabe: PlanEingabe): DigestPlan[] {
  void eingabe;
  throw new Error(NICHT_IMPLEMENTIERT);
}
