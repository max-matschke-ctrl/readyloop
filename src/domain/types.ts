// Vertrag Inkrement 1 + 2 + I3M – siehe docs/backlog.md §3.1, §5.1 und §7.1

export type Id = string; // UUID
export type IsoDate = string; // 'YYYY-MM-DD'
export type IsoDateTime = string; // ISO 8601 UTC, z. B. '2026-11-19T08:30:00.000Z'

// ---------- Aufzählungen ----------

export const ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type Rolle = (typeof ROLLEN)[number];

// Mitarbeiter in der Demo-Rollenwahl (F-20)
export const DEMO_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type DemoRolle = (typeof DEMO_ROLLEN)[number];

export const ROLLE_LABEL: Record<Rolle, string> = {
  admin: 'Admin',
  sifa: 'Sifa',
  verantwortlicher: 'Verantwortlicher',
  pruefer: 'Prüfer',
  mitarbeiter: 'Mitarbeiter',
};

export const STUFEN = ['A', 'B', 'C', 'D'] as const;
export type Stufe = (typeof STUFEN)[number];

export const STUFE_LABEL: Record<Stufe, string> = {
  A: 'Höchstfrist aus Gesetz/UVV',
  B: 'Richtwert DGUV/TRBS/ASR, Abweichung nur mit Begründung',
  C: 'Gefährdungsbeurteilung oder Herstellerangabe',
  D: 'Empfehlung',
};

export const EINSATZORTE = ['buero', 'werkstatt_fertigung', 'lager_logistik', 'baustelle', 'aussenbereich'] as const;
export type Einsatzort = (typeof EINSATZORTE)[number];

export const EINSATZORT_LABEL: Record<Einsatzort, string> = {
  buero: 'Büro',
  werkstatt_fertigung: 'Werkstatt/Fertigung',
  lager_logistik: 'Lager/Logistik',
  baustelle: 'Baustelle',
  aussenbereich: 'Außenbereich',
};

export const GERAETE_KATEGORIEN = ['personenbezogen', 'ortsgebunden', 'wechselnd'] as const;
export type GeraeteKategorie = (typeof GERAETE_KATEGORIEN)[number];

export const KATEGORIE_LABEL: Record<GeraeteKategorie, string> = {
  personenbezogen: 'Personenbezogen',
  ortsgebunden: 'Ortsgebunden',
  wechselnd: 'Wechselnder Einsatzort',
};

export const BETRIEBSSTATUS = ['in_betrieb', 'ausser_betrieb', 'ausgemustert'] as const;
export type Betriebsstatus = (typeof BETRIEBSSTATUS)[number];

export const KATALOG_FREIGABESTATUS = ['entwurf', 'freigegeben', 'zurueckgezogen'] as const;
export type KatalogFreigabestatus = (typeof KATALOG_FREIGABESTATUS)[number];

export const PRUEFER_TYPEN = ['zbp', 'sachkundiger', 'efk', 'eup', 'ps', 'zues', 'sachkundiger_din14406', 'benutzer'] as const;
export type PrueferTyp = (typeof PRUEFER_TYPEN)[number];

export const PRUEFER_TYP_LABEL: Record<PrueferTyp, string> = {
  zbp: 'Zur Prüfung befähigte Person',
  sachkundiger: 'Sachkundiger',
  efk: 'Elektrofachkraft',
  eup: 'Elektrotechnisch unterwiesene Person',
  ps: 'Prüfsachverständiger',
  zues: 'Zugelassene Überwachungsstelle',
  sachkundiger_din14406: 'Sachkundiger nach DIN 14406-4',
  benutzer: 'Benutzer',
};

export const DATUMSHERKUNFT = ['nachweis', 'pruefbericht', 'plakette', 'unbekannt'] as const;
export type Datumsherkunft = (typeof DATUMSHERKUNFT)[number];

/** Herkunftswerte, die bei der Ersterfassung wählbar sind ('nachweis' entsteht nur durch erfassten Nachweis). */
export const ERSTERFASSUNG_HERKUNFT = ['pruefbericht', 'plakette', 'unbekannt'] as const;
export type ErsterfassungHerkunft = (typeof ERSTERFASSUNG_HERKUNFT)[number];

export const DATUMSHERKUNFT_LABEL: Record<Datumsherkunft, string> = {
  nachweis: 'Nachweis in Readyloop',
  pruefbericht: 'Prüfbericht (Altbestand)',
  plakette: 'Prüfplakette am Gerät',
  unbekannt: 'unbekannt',
};

export const FRIST_QUELLEN = ['katalog', 'hersteller', 'gbu'] as const;
export type FristQuelle = (typeof FRIST_QUELLEN)[number];

export const FRIST_QUELLE_LABEL: Record<FristQuelle, string> = {
  katalog: 'Prüfkatalog',
  hersteller: 'Herstellerangabe',
  gbu: 'Gefährdungsbeurteilung',
};

export const PRUEF_ERGEBNISSE = ['ohne_maengel', 'maengel_weiterbetrieb', 'nicht_bestanden'] as const;
export type PruefErgebnis = (typeof PRUEF_ERGEBNISSE)[number];

export const PRUEF_ERGEBNIS_LABEL: Record<PruefErgebnis, string> = {
  ohne_maengel: 'Ohne Mängel',
  maengel_weiterbetrieb: 'Mängel, Weiterbetrieb zulässig',
  nicht_bestanden: 'Nicht bestanden, Weiterbetrieb nicht zulässig',
};

/** Reihenfolge = Schwere absteigend (F-9). */
export const FRIST_STATUS = ['ueberfaellig', 'vor_nutzung_pruefen', 'unbekannt', 'gbu', 'bald_faellig', 'ok'] as const;
export type FristStatus = (typeof FRIST_STATUS)[number];

export const STATUS_LABEL: Record<FristStatus, string> = {
  ueberfaellig: 'Überfällig – nicht verwenden',
  vor_nutzung_pruefen: 'Vor Nutzung prüfen – nicht verwenden',
  unbekannt: 'Prüfdatum unbekannt – Prüfung veranlassen',
  gbu: 'Frist über GBU festlegen',
  bald_faellig: 'Bald fällig',
  ok: 'In Ordnung',
};

export const VOR_NUTZUNG_GRUENDE = ['anlass', 'nicht_bestanden', 'ausser_betrieb', 'gefaehrlicher_mangel'] as const;
export type VorNutzungGrund = (typeof VOR_NUTZUNG_GRUENDE)[number];

export const VOR_NUTZUNG_GRUND_LABEL: Record<VorNutzungGrund, string> = {
  anlass: 'Anlassprüfung offen',
  nicht_bestanden: 'Letzte Prüfung nicht bestanden',
  ausser_betrieb: 'Außer Betrieb, Frist abgelaufen',
  gefaehrlicher_mangel: 'Gefährlicher Mangel offen',
};

// ---------- Betrieb, Rollen (I2) ----------

export const BETRIEBSSTATUS_LABEL: Record<Betriebsstatus, string> = {
  in_betrieb: 'In Betrieb',
  ausser_betrieb: 'Außer Betrieb',
  ausgemustert: 'Ausgemustert',
};

/** In I2 setzbar; 'ausgemustert' folgt in I4. */
export const WAEHLBARER_BETRIEBSSTATUS = ['in_betrieb', 'ausser_betrieb'] as const;
export type WaehlbarerBetriebsstatus = (typeof WAEHLBARER_BETRIEBSSTATUS)[number];

/** 'mitarbeiter' einladbar (F-20). Verantwortliche dürfen nur 'mitarbeiter' einladen (darfEinladen). */
export const EINLADBARE_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type EinladbareRolle = (typeof EINLADBARE_ROLLEN)[number];

export type Betriebsmodus = 'demo' | 'supabase' | 'unkonfiguriert';
export type Anmeldestatus = 'unkonfiguriert' | 'abgemeldet' | 'ohne_mitgliedschaft' | 'angemeldet';

// ---------- Anlass (F-10) ----------

export const ANLASS_ARTEN = [
  'inbetriebnahme',
  'aenderung_instandsetzung',
  'unfall_schadensfall',
  'laengere_nichtbenutzung',
  'naturereignis',
  'sonstiges',
] as const;
export type AnlassArt = (typeof ANLASS_ARTEN)[number];

export const ANLASS_ART_LABEL: Record<AnlassArt, string> = {
  inbetriebnahme: 'Vor (Wieder-)Inbetriebnahme',
  aenderung_instandsetzung: 'Prüfpflichtige Änderung/Instandsetzung',
  unfall_schadensfall: 'Unfall oder Schadensfall',
  laengere_nichtbenutzung: 'Längere Nichtbenutzung',
  naturereignis: 'Naturereignis',
  sonstiges: 'Sonstiges außergewöhnliches Ereignis',
};

// ---------- Mängel (F-14) ----------

/** Reihenfolge = Schwere absteigend. */
export const MANGEL_SCHWEREN = ['gefaehrlich', 'erheblich', 'gering'] as const;
export type MangelSchwere = (typeof MANGEL_SCHWEREN)[number];

export const MANGEL_SCHWERE_LABEL: Record<MangelSchwere, string> = {
  gefaehrlich: 'Gefährlich – Weiterbetrieb nicht zulässig',
  erheblich: 'Erheblich – zeitnah beheben',
  gering: 'Gering – bis Termin beheben',
};

/** Vorschlag Termin = heute + Tage (Q-16). */
export const MANGEL_TERMIN_TAGE: Record<MangelSchwere, number> = { gefaehrlich: 0, erheblich: 30, gering: 90 };

export const MANGEL_STATUS = ['offen', 'in_bearbeitung', 'behoben'] as const;
export type MangelStatus = (typeof MANGEL_STATUS)[number];

export const MANGEL_STATUS_LABEL: Record<MangelStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  behoben: 'Behoben',
};

// ---------- Ereignisse und Aktionen ----------

export const EREIGNIS_TYPEN = [
  'geraet_angelegt',
  'frist_freigegeben',
  'nachweis_erfasst',
  'pruefer_zugewiesen',
  'gbu_dokument_gesetzt',
  'geraet_verschoben',
  'betriebsstatus_geaendert',
  'anlass_erfasst',
  'anlass_aufgehoben',
  'mangel_erfasst',
  'mangel_kenntnis',
  'mangel_behoben',
  'bereich_gespeichert',
  'mitglied_gespeichert',
  'zuordnung_geaendert',
  'etikett_erneuert',
] as const;
export type EreignisTyp = (typeof EREIGNIS_TYPEN)[number];

export const EREIGNIS_LABEL: Record<EreignisTyp, string> = {
  geraet_angelegt: 'Gerät angelegt',
  frist_freigegeben: 'Frist freigegeben',
  nachweis_erfasst: 'Nachweis erfasst',
  pruefer_zugewiesen: 'Prüfer zugewiesen',
  gbu_dokument_gesetzt: 'GBU-Verweis gesetzt',
  geraet_verschoben: 'Gerät verschoben',
  betriebsstatus_geaendert: 'Betriebsstatus geändert',
  anlass_erfasst: 'Anlass erfasst',
  anlass_aufgehoben: 'Anlass aufgehoben',
  mangel_erfasst: 'Mangel erfasst',
  mangel_kenntnis: 'Mangel zur Kenntnis genommen',
  mangel_behoben: 'Mangel behoben',
  bereich_gespeichert: 'Bereich gespeichert',
  mitglied_gespeichert: 'Mitglied gespeichert',
  zuordnung_geaendert: 'Zuordnung geändert',
  etikett_erneuert: 'Aufkleber erneuert',
};

export const AKTIONEN = [
  'geraet.lesen',
  'geraet.anlegen',
  'geraet.bearbeiten', // verschieben, Betriebsstatus
  'frist.freigeben', // inkl. GBU-Verweis
  'nachweis.lesen',
  'nachweis.erfassen',
  'pruefaufgaben.lesen',
  'pruefer.zuweisen',
  'anlass.erfassen', // inkl. aufheben
  'mangel.lesen',
  'mangel.erfassen', // MA: nur über mangelMelden (F-26)
  'mangel.bearbeiten', // Kenntnisnahme, Behebung
  'verlauf.lesen',
  'katalog.lesen',
  'katalog.freigeben',
  'bereich.verwalten',
  'mitglied.verwalten',
  'meine_geraete.lesen', // I3M
  'geraet.suchen', // I3M: Kurzansicht für MA
  'geraet.uebernehmen', // I3M: inkl. zurückgeben
  'geraet.zuordnen', // I3M: personenbezogen zuordnen/lösen, fremde Übernahme beenden
  'uebernahmen.lesen', // I3M: abgeschlossene Übernahmen, 90 Tage
  'etikett.verwalten', // I3M: drucken, erneuern
  'mitarbeiter.einladen', // I3M
] as const;
export type Aktion = (typeof AKTIONEN)[number];

// ---------- Stammdaten ----------

export interface Organisation {
  id: Id;
  name: string;
  bg: string | null; // zuständige Berufsgenossenschaft
}

export interface Standort {
  id: Id;
  organisationId: Id;
  name: string;
}

export interface Bereich {
  id: Id;
  organisationId: Id;
  standortId: Id;
  name: string;
  einsatzort: Einsatzort;
}

export interface Benutzer {
  id: Id;
  name: string;
  email: string;
}

export interface Mitgliedschaft {
  id: Id;
  organisationId: Id;
  benutzerId: Id;
  rolle: Rolle;
  bereichIds: Id[]; // nur für 'verantwortlicher' befüllt
  prueferTypen: PrueferTyp[]; // nur für 'pruefer' befüllt (R-10)
  aktiv: boolean;
}

export interface OrganisationOption {
  id: Id;
  name: string;
  rolle: Rolle;
}

export interface Sitzung {
  benutzer: Benutzer;
  organisation: Organisation;
  mitgliedschaftId: Id;
  rolle: Rolle;
  bereichIds: Id[];
  organisationen: OrganisationOption[]; // alle aktiven Mitgliedschaften, alphabetisch
  demo: boolean;
}

// ---------- Katalog ----------

export interface KatalogEintrag {
  id: Id;
  schluessel: string; // Prüfart-Schlüssel, z. B. 'regal.experteninspektion'
  version: number;
  geraetegruppe: string; // z. B. 'regal'
  geraetegruppeLabel: string;
  pruefart: string; // Anzeigename der Prüfart
  einsatzort: Einsatzort | null; // null = gilt für alle Einsatzorte
  intervallMonate: number | null; // null = keine Zahl → Frist über GBU
  stufe: Stufe;
  fundstelle: string;
  quelleUrl: string;
  prueferTypen: PrueferTyp[];
  hinweis: string | null;
  freigabestatus: KatalogFreigabestatus;
  freigegebenVon: string | null;
  freigegebenAm: IsoDate | null;
}

// ---------- Geräte und Prüfarten ----------

export interface Geraet {
  id: Id;
  organisationId: Id;
  bereichId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  geraetegruppe: string; // Katalog-geraetegruppe oder 'sonstiges'
  kategorie: GeraeteKategorie;
  hersteller: string | null;
  typ: string | null;
  seriennummer: string | null;
  baujahr: number | null;
  einsatzort: Einsatzort | null; // Override; null = Einsatzort des Bereichs
  betriebsstatus: Betriebsstatus;
  angelegtAm: IsoDateTime;
  zugeordnetAn: Id | null; // Benutzer-ID eines Mitarbeiters; nur kategorie 'personenbezogen' (F-22)
}

/** Snapshot einer freigegebenen Frist (R-04). */
export interface FestgelegteFrist {
  monate: number;
  quelle: FristQuelle;
  stufe: Stufe;
  fundstelle: string;
  quelleUrl: string | null;
  katalogEintragId: Id | null; // bei gbu: Orientierungseintrag, falls vorhanden
  katalogVersion: number | null;
  begruendung: string | null; // Pflicht bei quelle 'gbu'
  freigegebenVon: Id; // Benutzer-ID
  freigegebenVonName: string;
  freigegebenAm: IsoDateTime;
}

export type FristEntwurf = Omit<FestgelegteFrist, 'freigegebenVon' | 'freigegebenVonName' | 'freigegebenAm'>;

/** R-11: Verweis auf die Gefährdungsbeurteilung, kein Upload in I2. */
export interface GbuDokument {
  titel: string; // z. B. 'GBU Lager 2025, Abschn. 3'
  url: string | null; // nur https://
}

export interface GeraetPruefart {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  katalogSchluessel: string | null; // null = freie Prüfart ohne Katalogeintrag
  bezeichnung: string;
  herstellerfristMonate: number | null;
  herstellerfristQuelle: string | null; // z. B. 'Betriebsanleitung Kap. 9'
  frist: FestgelegteFrist | null; // null = nicht freigegeben
  letztePruefung: IsoDate | null;
  letztePruefungHerkunft: Datumsherkunft; // 'unbekannt' ⇔ letztePruefung === null
  zugewiesenerPrueferId: Id | null; // Benutzer-ID
  gbuDokument: GbuDokument | null;
}

export interface Nachweis {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id;
  pruefdatum: IsoDate;
  ergebnis: PruefErgebnis;
  pruefumfang: string;
  prueferName: string;
  prueferBenutzerId: Id | null;
  unterschriftImPdf: boolean;
  pdfDateiname: string;
  pdfSha256: string;
  fristEmpfehlungMonate: number | null; // Empfehlung des Prüfers, wirkt nie selbst (F-13)
  erfasstVon: Id;
  erfasstAm: IsoDateTime;
}

export interface Anlass {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id;
  art: AnlassArt;
  datum: IsoDate;
  beschreibung: string;
  erfasstVon: Id;
  erfasstVonName: string;
  erfasstAm: IsoDateTime;
  aufgehobenVon: Id | null;
  aufgehobenVonName: string | null;
  aufgehobenAm: IsoDateTime | null;
  aufhebungsgrund: string | null;
}

export interface AnlassAnsicht extends Anlass {
  pruefartBezeichnung: string;
  offen: boolean; // F-10
  erledigtDurchNachweisId: Id | null;
}

export interface Mangel {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id | null; // null = freier Mangel am Gerät
  nachweisId: Id | null;
  beschreibung: string;
  schwere: MangelSchwere;
  termin: IsoDate;
  status: MangelStatus;
  verantwortlichId: Id | null; // Benutzer-ID; null bis Kenntnisnahme, wenn vom Prüfer erfasst
  erfasstVon: Id;
  erfasstVonName: string;
  erfasstAm: IsoDateTime;
  kenntnisVon: Id | null;
  kenntnisVonName: string | null;
  kenntnisAm: IsoDateTime | null;
  behobenAm: IsoDate | null; // Datum der Behebung
  behobenDurch: string | null; // Person oder Firma, die behoben hat
  behebung: string | null; // Maßnahme
  behebungErfasstVon: Id | null;
  behebungErfasstVonName: string | null;
  behebungErfasstAm: IsoDateTime | null;
}

export interface Ereignis {
  id: Id;
  organisationId: Id;
  geraetId: Id | null;
  typ: EreignisTyp;
  akteurId: Id;
  akteurName: string;
  zeitpunkt: IsoDateTime;
  daten: Record<string, unknown>; // z. B. { pruefartId, alt: FestgelegteFrist | null, neu: FestgelegteFrist }
}

// ---------- Regel-Engine ----------

export type FristVorschlag =
  | { art: 'katalog'; monate: number; stufe: Stufe; fundstelle: string; quelleUrl: string; eintrag: KatalogEintrag }
  | { art: 'hersteller'; monate: number; stufe: 'C'; fundstelle: string; verdraengt: KatalogEintrag | null }
  | {
      art: 'gbu';
      grund: 'kein_eintrag' | 'nur_entwurf' | 'ohne_intervall';
      orientierung: KatalogEintrag | null; // Entwurf oder freigegebener Eintrag ohne Intervall
    };

export type FristFestlegungEingabe =
  | { modus: 'vorschlag' }
  | { modus: 'gbu'; monate: number; fundstelle: string; begruendung: string };

export type FristFestlegungErgebnis = { ok: true; frist: FristEntwurf } | { ok: false; fehler: string };

export interface StatusErgebnis {
  status: FristStatus;
  faelligAm: IsoDate | null;
  restTage: number | null; // faelligAm − heute; negativ = überfällig
  grund?: VorNutzungGrund; // nur bei status 'vor_nutzung_pruefen'
}

// ---------- Lesemodelle für die UI ----------

export interface MangelAnsicht extends Mangel {
  geraetBezeichnung: string;
  inventarnummer: string | null;
  bereichId: Id;
  bereichName: string;
  pruefartBezeichnung: string | null;
  verantwortlichName: string | null;
  terminUeberschritten: boolean; // status ≠ behoben und termin < heute
}

export interface MangelFilter {
  status?: 'offen' | 'behoben' | 'alle'; // Default 'offen' = offen + in_bearbeitung
  bereichId?: Id;
  schwere?: MangelSchwere;
}

export interface PersonOption {
  benutzerId: Id;
  name: string;
  rolle: Rolle;
}

export interface PrueferOption {
  benutzerId: Id;
  name: string;
  prueferTypen: PrueferTyp[];
}

export interface MangelFormularKontext {
  geraet: Pick<Geraet, 'id' | 'bezeichnung' | 'inventarnummer'>;
  bereichName: string;
  pruefarten: { id: Id; bezeichnung: string }[]; // im Geltungsbereich; Prüfer: nur zugewiesene
  nachweis: Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis'> | null;
  vorbelegtePruefartId: Id | null;
  verantwortliche: PersonOption[]; // leer für Prüfer → Feld ausblenden
  heute: IsoDate;
}

export interface BereichAnsicht {
  bereich: Bereich;
  geraeteAnzahl: number;
  verantwortliche: PersonOption[];
}

export interface MitgliedAnsicht {
  mitgliedschaftId: Id;
  benutzer: Benutzer;
  rolle: Rolle;
  bereichIds: Id[];
  bereichNamen: string[];
  prueferTypen: PrueferTyp[];
  aktiv: boolean;
  istEigeneMitgliedschaft: boolean;
}

export interface PruefartAnsicht {
  pruefart: GeraetPruefart;
  vorschlag: FristVorschlag;
  status: StatusErgebnis; // nach F-9 (Kontext: Betriebsstatus, Anlass, nicht bestanden)
  katalogEintrag: KatalogEintrag | null; // passender Eintrag (freigegeben oder Entwurf) für Prüfertyp/Hinweis
  weiterbetriebUnzulaessig: boolean; // letzter Nachweis 'nicht_bestanden'
  zugewiesenerPrueferName: string | null;
  /**
   * Review I2 (Befund 2): true nur, wenn ein Prüfer zugewiesen ist UND seine Prüfer-Mitgliedschaft aktiv ist.
   * false bei fehlender Zuweisung oder deaktiviertem Prüfer. Deaktivierter Prüfer ⇔
   * pruefart.zugewiesenerPrueferId !== null && !zugewiesenerPrueferAktiv → Hinweis „Prüfer deaktiviert – neu zuweisen“;
   * die Prüfart gilt dann als nicht versorgt. Die Zuweisung bleibt bestehen (wird nie still entfernt).
   */
  zugewiesenerPrueferAktiv: boolean;
  qualifikationsWarnung: string | null; // F-15
  offeneAnlaesse: AnlassAnsicht[];
  offeneMaengel: number; // offen + in_bearbeitung an dieser Prüfart
  letzterNachweis: Pick<Nachweis, 'id' | 'pruefdatum' | 'ergebnis' | 'fristEmpfehlungMonate' | 'erfasstAm'> | null;
  fristHinweis: 'empfehlung_abweichend' | 'kuerzerer_vorschlag' | null; // F-13, F-16
  maengelErfassenFuerNachweisId: Id | null; // F-12: letzter Nachweis ≠ ohne_maengel ohne verknüpften Mangel
}

export interface GeraetListenEintrag {
  geraet: Geraet;
  bereichName: string;
  gesamtStatus: FristStatus;
  naechsteFaelligkeit: IsoDate | null;
  offeneMaengel: number;
  pruefarten: { id: Id; bezeichnung: string; status: FristStatus; faelligAm: IsoDate | null }[];
}

export interface NachweisAnsicht extends Nachweis {
  pruefartBezeichnung: string;
  pdfUrl: string; // '/api/nachweise/{id}'
}

export interface GeraetDetail {
  geraet: Geraet;
  bereich: Bereich;
  einsatzort: Einsatzort; // wirksam (F-1)
  gesamtStatus: FristStatus;
  gesamtStatusGrund: VorNutzungGrund | null; // gesetzt bei gesamtStatus 'vor_nutzung_pruefen'
  naechsteFaelligkeit: IsoDate | null;
  pruefarten: PruefartAnsicht[];
  nachweise: NachweisAnsicht[]; // absteigend nach pruefdatum
  maengel: MangelAnsicht[]; // offene zuerst, dann nach termin; leer ohne 'mangel.lesen'
  anlaesse: AnlassAnsicht[]; // absteigend nach datum
  verlauf: Ereignis[]; // absteigend nach zeitpunkt; leer ohne 'verlauf.lesen'
  nutzung: GeraetNutzung | null; // null für Rolle pruefer (F-27)
}

export interface PrueferAufgabe {
  pruefartAnsicht: PruefartAnsicht;
  geraet: Pick<Geraet, 'id' | 'bezeichnung' | 'inventarnummer' | 'hersteller' | 'typ' | 'seriennummer'>;
  bereichName: string;
  gruppe: 'faellig' | 'spaeter'; // faellig = alles außer ok (inkl. vor_nutzung_pruefen)
}

export interface GeraetegruppeOption {
  schluessel: string; // geraetegruppe
  label: string;
  pruefarten: {
    schluessel: string;
    bezeichnung: string;
    stufe: Stufe;
    intervallMonate: number | null;
    freigabestatus: KatalogFreigabestatus;
  }[]; // je Prüfart-Schlüssel ein Eintrag (einsatzort null bevorzugt)
}

export interface GeraeteFilter {
  bereichId?: Id;
  status?: FristStatus;
  suche?: string; // Bezeichnung, Inventarnummer, Hersteller, Seriennummer; case-insensitiv
}

// ---------- Nutzbarkeit (F-21) ----------

export const NUTZUNG = ['nicht_verwenden', 'unklar', 'verwendbar'] as const;
export type Nutzung = (typeof NUTZUNG)[number];

export const NUTZUNG_LABEL: Record<Nutzung, string> = {
  nicht_verwenden: 'Nicht verwenden',
  unklar: 'Prüfstatus unklar – vor Nutzung Verantwortlichen fragen',
  verwendbar: 'Verwendbar',
};

// ---------- Übernahme (F-23, F-27) ----------

export const UEBERNAHME_ENDE_ARTEN = ['rueckgabe', 'uebergabe', 'beendet_verwaltung', 'austritt'] as const;
export type UebernahmeEndeArt = (typeof UEBERNAHME_ENDE_ARTEN)[number];

export const UEBERNAHME_ENDE_LABEL: Record<UebernahmeEndeArt, string> = {
  rueckgabe: 'Zurückgegeben',
  uebergabe: 'Von anderer Person übernommen',
  beendet_verwaltung: 'Durch Verantwortlichen beendet',
  austritt: 'Zugang beendet',
};

/** Gründe, warum „Gerät übernehmen“ nicht angeboten wird; Prüfreihenfolge wie im Array. */
export const UEBERNAHME_HINWEISE = ['nicht_wechselnd', 'ausser_betrieb', 'nicht_verwenden'] as const;
export type UebernahmeHinweis = (typeof UEBERNAHME_HINWEISE)[number];

export const UEBERNAHME_HINWEIS_LABEL: Record<UebernahmeHinweis, string> = {
  nicht_wechselnd: 'Nur Geräte mit wechselndem Einsatzort werden übernommen.',
  ausser_betrieb: 'Gerät ist außer Betrieb – nicht verwenden.',
  nicht_verwenden: 'Prüfung überfällig oder vor Nutzung zu prüfen – nicht verwenden. Bitte Verantwortlichen informieren.',
};

export const UEBERNAHME_ZUSTAENDE = ['frei', 'von_mir', 'von_anderen'] as const;
export type UebernahmeZustand = (typeof UEBERNAHME_ZUSTAENDE)[number];

/** F-27: abgeschlossene Übernahmen mit Person nur so lange (ADM), danach pseudonymisiert. */
export const UEBERNAHME_AUFBEWAHRUNG_TAGE = 90;

export interface Uebernahme {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  benutzerId: Id | null; // null nach Pseudonymisierung
  benutzerName: string | null; // null nach Pseudonymisierung
  von: IsoDateTime;
  bis: IsoDateTime | null; // null = offen
  endeArt: UebernahmeEndeArt | null; // null ⇔ bis === null
  beendetVon: Id | null; // Benutzer-ID der beendenden Person; null bei offen oder nach Pseudonymisierung
}

// ---------- Token und Etikett (F-24, F-25) ----------

export interface GeraetToken {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  token: string; // 22 Zeichen base64url (16 Zufallsbytes)
  aktiv: boolean;
  erstelltAm: IsoDateTime;
  deaktiviertAm: IsoDateTime | null;
}

/** QR-Code als Modulraster, zeilenweise, groesse × groesse Einträge, true = dunkel; ohne Ruhezone. */
export interface QrMatrix {
  groesse: number;
  module: boolean[];
}

export const ETIKETTEN_MAX = 120;

export interface EtikettenFilter {
  geraetIds?: Id[]; // hat Vorrang vor bereichId/kategorie
  bereichId?: Id;
  kategorie?: GeraeteKategorie; // fehlt = alle Kategorien (Abnahme FE-15: „leer bzw. alle → alle Geräte“)
}

/**
 * Rückgabe von holeEtiketten (Vertrag geändert in I3M-Befunden, vorher Etikett[]).
 * etiketten: höchstens ETIKETTEN_MAX, sortiert; gesamt: Anzahl aller passenden Geräte vor der Kappung;
 * gekappt: gesamt > ETIKETTEN_MAX (UI zeigt „nur die ersten 120“).
 */
export interface EtikettenErgebnis {
  etiketten: Etikett[];
  gesamt: number;
  gekappt: boolean;
}

export interface Etikett {
  geraetId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  organisationName: string;
  url: string; // absolute Token-URL
  kurzUrl: string; // ohne Schema, z. B. 'app.readyloop.de/g/AbC…'
  qr: QrMatrix;
  status: FristStatus; // Gesamtstatus (F-9) zum Druckzeitpunkt, für die Plakette
  faelligAm: IsoDate | null; // nächste Fälligkeit zum Druckzeitpunkt
  stand: IsoDate; // Druckdatum
}

// ---------- Öffentliche Ansicht und Kurzansicht (F-21, F-24) ----------

export interface OeffentlicheFrist {
  monate: number;
  quelle: FristQuelle;
  stufe: Stufe;
  fundstelle: string;
}

export interface OeffentlichePruefart {
  bezeichnung: string;
  status: StatusErgebnis; // F-9
  frist: OeffentlicheFrist | null; // null = keine freigegebene Frist → „Frist über GBU festlegen“
  letztePruefung: IsoDate | null;
  letztePruefungHerkunft: Datumsherkunft;
  letzterNachweis: { pruefdatum: IsoDate; ergebnis: PruefErgebnis; prueferName: string } | null;
}

/** Gemeinsamer Kern der öffentlichen Ansicht und der Kurzansicht; enthält keine Personennamen außer Prüfernamen. */
export interface GeraetStatusKern {
  bezeichnung: string;
  inventarnummer: string | null;
  hersteller: string | null;
  typ: string | null;
  kategorie: GeraeteKategorie;
  betriebsstatus: Betriebsstatus;
  gesamtStatus: FristStatus; // über alle Prüfarten und alle offenen Mängel (F-21)
  gesamtStatusGrund: VorNutzungGrund | null;
  naechsteFaelligkeit: IsoDate | null;
  nutzung: Nutzung;
  pruefarten: OeffentlichePruefart[]; // nach Status-Schwere (FRIST_STATUS), dann Bezeichnung
}

export interface OeffentlicheGeraeteansicht extends GeraetStatusKern {
  organisationName: string;
  stand: IsoDateTime; // Zeitpunkt der Berechnung
}

export interface GeraetKurzansicht extends GeraetStatusKern {
  geraetId: Id;
  bereichName: string;
  offeneMaengel: number; // Anzahl offen + in_bearbeitung, ohne Details
  zugeordnetMir: boolean;
  uebernahme: UebernahmeZustand | null; // null = nicht kategorie 'wechselnd'
  /** null = Übernahme möglich. FE zeigt „Gerät übernehmen“ nur bei uebernahme ∈ {frei, von_anderen} und uebernahmeHinweis === null. */
  uebernahmeHinweis: UebernahmeHinweis | null;
}

export interface MeinGeraet extends GeraetKurzansicht {
  bezug: 'zugeordnet' | 'uebernommen';
  uebernommenSeit: IsoDateTime | null; // nur bei bezug 'uebernommen'
}

export interface TokenSeite {
  token: string;
  ansicht: OeffentlicheGeraeteansicht;
  angemeldet: boolean;
  andereOrganisation: boolean; // angemeldet, Gerät gehört nicht zur aktuellen Organisation → nur öffentliche Ansicht
  kurz: GeraetKurzansicht | null; // nur Rolle mitarbeiter derselben Organisation (Aktionen)
  akteUrl: string | null; // '/geraete/{id}' bei geraet.lesen + Geltungsbereich
}

// ---------- Geräteakte (F-22, F-27) ----------

export interface GeraetNutzung {
  zugeordnet: PersonOption | null; // nur kategorie 'personenbezogen'
  uebernahme: { benutzerName: string; seit: IsoDateTime } | null; // offene Übernahme
  verlauf: Uebernahme[]; // nur uebernahmen.lesen: abgeschlossen, Person vorhanden, ≤ 90 Tage nach Ende, neueste zuerst; sonst []
  darfZuordnen: boolean; // geraet.zuordnen + Geltungsbereich
  etikett: { token: string; url: string } | null; // nur etikett.verwalten + Geltungsbereich
}

// ---------- Server Actions ----------

export interface ActionState {
  status: 'idle' | 'ok' | 'fehler';
  meldung?: string;
  feldfehler?: Partial<Record<string, string[]>>; // Schlüssel = Formularfeldname
  id?: Id;
}

export const INITIAL_ACTION_STATE: ActionState = { status: 'idle' };
