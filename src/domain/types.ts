// Vertrag Inkrement 1 + 2 + I3M + I3 – siehe docs/backlog.md §3.1, §5.1, §7.1 und §9.1

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
  'erinnerung_einstellung_gespeichert', // I3 (F-42)
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
  erinnerung_einstellung_gespeichert: 'Erinnerungen eingestellt',
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
  'erinnerung.einstellen', // I3: Staffel, Eskalation, Empfänger je Bereich (F-39)
  'erinnerung.protokoll', // I3: Versandprotokoll (F-41)
  'mail.vorschau', // I3: /admin/mails, nur Mail-Modus 'vorschau' (F-37)
  'benachrichtigung.eigene', // I3: eigene Mails ansehen, abbestellbare ab-/anbestellen (F-40)
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

// ---------- Erinnerungen: Einstellungen (F-31, F-32, F-39) ----------

export const ERINNERUNG_STAFFEL_STANDARD: readonly number[] = [90, 60, 30];
export const STAFFEL_MAX_WERTE = 3;
export const STAFFEL_MAX_TAGE = 365;
export const ESKALATION_MAX_TAGE = 90;

export const ESKALATIONS_EBENEN = ['verantwortlicher', 'sifa', 'admin'] as const;
export type EskalationsEbene = (typeof ESKALATIONS_EBENEN)[number];

export const ESKALATION_STANDARD: Readonly<Record<EskalationsEbene, number>> = { verantwortlicher: 0, sifa: 7, admin: 14 };

export const ESKALATIONS_EBENE_LABEL: Record<EskalationsEbene, string> = {
  verantwortlicher: 'Verantwortliche des Bereichs',
  sifa: 'Sifa',
  admin: 'Admin/Geschäftsführung',
};

export interface ErinnerungEinstellung {
  organisationId: Id;
  bereichId: Id;
  staffelTage: number[]; // 1–3 Werte, je 1–365, verschieden, absteigend
  eskalationTage: Record<EskalationsEbene, number>; // 0 ≤ verantwortlicher ≤ sifa ≤ admin ≤ 90
  sifaInKopie: boolean;
  sifaEmpfaengerIds: Id[] | null; // Benutzer-IDs; null = alle aktiven SIF
  adminEmpfaengerIds: Id[] | null; // Benutzer-IDs; null = alle aktiven ADM
  standard: boolean; // true = keine gespeicherte Zeile oder Werte = Standard
  geaendertVon: Id | null;
  geaendertVonName: string | null;
  geaendertAm: IsoDateTime | null;
}

/** Stufe einer Fristerinnerung. Code: 'v{tage}' bzw. 'e_{ebene}' (stufeCode). */
export type ErinnerungStufe = { art: 'vorlauf'; tage: number } | { art: 'eskalation'; ebene: EskalationsEbene };

// ---------- Erinnerungen: Mails und Posten (F-30, F-33, F-38) ----------

export const MAIL_ARTEN = ['frist_digest', 'pruefer_woche', 'ma_hinweis'] as const;
export type MailArt = (typeof MAIL_ARTEN)[number];

export const MAIL_ART_LABEL: Record<MailArt, string> = {
  frist_digest: 'Fristen-Erinnerung',
  pruefer_woche: 'Wochenübersicht für Prüfer',
  ma_hinweis: 'Hinweis „Nicht verwenden“',
};

export const MAIL_ART_BESCHREIBUNG: Record<MailArt, string> = {
  frist_digest: 'Vorlauf vor Fälligkeiten und Eskalation überfälliger Prüfungen in Ihren Bereichen.',
  pruefer_woche: 'Montags eine Übersicht der Ihnen zugewiesenen fälligen Prüfungen.',
  ma_hinweis: 'Nachricht, wenn ein Gerät, das Sie haben, nicht mehr verwendet werden darf.',
};

export const ABBESTELLBARE_MAIL_ARTEN = ['pruefer_woche', 'ma_hinweis'] as const;
export type AbbestellbareMailArt = (typeof ABBESTELLBARE_MAIL_ARTEN)[number];

/** F-30: Rollen sind je Organisation exklusiv → genau eine Mailart je Mitgliedschaft. */
export const MAIL_ART_FUER_ROLLE: Record<Rolle, MailArt> = {
  admin: 'frist_digest',
  sifa: 'frist_digest',
  verantwortlicher: 'frist_digest',
  pruefer: 'pruefer_woche',
  mitarbeiter: 'ma_hinweis',
};

export const PFLICHTMAIL_BEGRUENDUNG =
  'Diese Erinnerung gehört zur Fristenüberwachung Ihres Betriebs (§ 3 Abs. 6, § 14 BetrSichV) und kann nicht abbestellt werden. Empfänger und Zeitpunkte legt der Admin je Bereich fest.';

export const POSTEN_ARTEN = ['frist', 'pruefer_woche', 'ma_hinweis'] as const;
export type PostenArt = (typeof POSTEN_ARTEN)[number];

export const POSTEN_ROLLEN = ['zustaendig', 'kopie'] as const;
export type PostenRolle = (typeof POSTEN_ROLLEN)[number];

export const POSTEN_ROLLE_LABEL: Record<PostenRolle, string> = {
  zustaendig: 'Sie sind zuständig',
  kopie: 'Zur Kenntnis',
};

/** Gruppen der Sammelmail; Reihenfolge = Dringlichkeit absteigend (F-38). */
export const DRINGLICHKEITEN = ['nicht_verwenden', 'ueberfaellig', 'heute_faellig', 'bald_faellig', 'vorlauf', 'ohne_termin'] as const;
export type Dringlichkeit = (typeof DRINGLICHKEITEN)[number];

export const DRINGLICHKEIT_LABEL: Record<Dringlichkeit, string> = {
  nicht_verwenden: 'Nicht verwenden',
  ueberfaellig: 'Überfällig',
  heute_faellig: 'Heute fällig',
  bald_faellig: 'In den nächsten 30 Tagen fällig',
  vorlauf: 'Vorlauf',
  ohne_termin: 'Ohne Termin',
};

export const MAIL_MAX_POSTEN = 100;

// ---------- Erinnerungen: Versand und Protokoll (F-36, F-41) ----------

export const VERSAND_STATUS = ['vorbereitet', 'versendet', 'zugestellt', 'fehler', 'bounce', 'beschwerde', 'vorschau'] as const;
export type VersandStatus = (typeof VERSAND_STATUS)[number];

export const VERSAND_STATUS_LABEL: Record<VersandStatus, string> = {
  vorbereitet: 'In Vorbereitung',
  versendet: 'Versendet',
  zugestellt: 'Zugestellt',
  fehler: 'Fehler – nächster Werktag erneut',
  bounce: 'Nicht zustellbar – E-Mail-Adresse prüfen',
  beschwerde: 'Als Spam gemeldet',
  vorschau: 'Nur Vorschau, nicht versendet',
};

/** F-33: Posten dieser Versände gelten als gesendet. */
export const VERSAND_ERFOLGREICH: readonly VersandStatus[] = ['versendet', 'zugestellt', 'bounce', 'beschwerde', 'vorschau'];
/** F-41: Filter „Probleme“; MA-Hinweise zeigen nur dann den Namen. */
export const VERSAND_PROBLEME: readonly VersandStatus[] = ['fehler', 'bounce', 'beschwerde'];

export const VERSAND_MAX_VERSUCHE = 3;
export const MA_HINWEIS_AUFBEWAHRUNG_TAGE = 90;

export const MAIL_FEHLER_CODES = ['netzwerk', 'rate_limit', 'anbieter_fehler', 'abgelehnt', 'ungueltige_adresse', 'konfiguration'] as const;
export type MailFehlerCode = (typeof MAIL_FEHLER_CODES)[number];

export const MAIL_FEHLER_LABEL: Record<MailFehlerCode, string> = {
  netzwerk: 'Versanddienst nicht erreichbar',
  rate_limit: 'Versanddienst ausgelastet',
  anbieter_fehler: 'Fehler beim Versanddienst',
  abgelehnt: 'Vom Versanddienst abgelehnt',
  ungueltige_adresse: 'E-Mail-Adresse ungültig',
  konfiguration: 'Mailversand falsch eingerichtet',
};

export interface MailVersand {
  id: Id;
  organisationId: Id;
  laufId: Id;
  laufDatum: IsoDate;
  art: MailArt;
  empfaengerBenutzerId: Id | null; // null nach Pseudonymisierung (nur ma_hinweis)
  status: VersandStatus;
  versuche: number; // 0–3
  anbieterId: string | null;
  fehlerCode: MailFehlerCode | null;
  postenAnzahl: number;
  erstelltAm: IsoDateTime;
  versendetAm: IsoDateTime | null;
  statusAm: IsoDateTime;
  // bewusst KEIN Betreff, KEIN Inhalt, KEINE E-Mail-Adresse (F-41)
}

export interface ErinnerungPosten {
  id: Id;
  organisationId: Id;
  versandId: Id;
  schluessel: string; // F-33
  art: PostenArt;
  stufe: string; // 'v90' | 'e_sifa' | … | 'woche' | 'nicht_verwenden'
  geraetId: Id;
  geraetPruefartId: Id | null; // null bei ma_hinweis
  bereichId: Id;
  bezugDatum: IsoDate | null; // frist: faelligAm; pruefer_woche: Montag der ISO-Woche; ma_hinweis: null
  rolle: PostenRolle;
  empfaengerBenutzerId: Id | null; // null nach Pseudonymisierung (nur ma_hinweis)
  erstelltAm: IsoDateTime;
}

export const LAUF_AUSLOESER = ['vercel_cron', 'pg_cron', 'manuell'] as const;
export type LaufAusloeser = (typeof LAUF_AUSLOESER)[number];

export const LAUF_STATUS = ['laeuft', 'fertig', 'fehler'] as const;
export type LaufStatus = (typeof LAUF_STATUS)[number];

export interface ErinnerungLauf {
  id: Id;
  laufDatum: IsoDate;
  ausloeser: LaufAusloeser;
  status: LaufStatus;
  gestartetAm: IsoDateTime;
  beendetAm: IsoDateTime | null;
}

/** F-37. */
export type MailModus = 'resend' | 'vorschau' | 'aus';

// ---------- Erinnerungen: Lesemodelle für die UI ----------

export interface ErinnerungEinstellungAnsicht {
  bereich: Bereich;
  einstellung: ErinnerungEinstellung; // bei fehlender Zeile standardEinstellung(), standard = true
  verantwortliche: PersonOption[]; // aktive VER des Bereichs (immer zuständig)
  sifaOptionen: PersonOption[]; // aktive SIF der Organisation, alphabetisch
  adminOptionen: PersonOption[]; // aktive ADM der Organisation, alphabetisch
  warnungen: string[]; // z. B. 'Kein aktiver Verantwortlicher – Erinnerungen gehen an die Sifa.'
}

export interface EigeneBenachrichtigung {
  art: MailArt;
  label: string; // MAIL_ART_LABEL
  beschreibung: string; // MAIL_ART_BESCHREIBUNG
  abbestellbar: boolean;
  abgemeldet: boolean; // immer false bei Pflicht
  pflichtBegruendung: string | null; // PFLICHTMAIL_BEGRUENDUNG bei frist_digest
}

export interface BereichsRegel {
  bereichName: string;
  staffelTage: number[];
  eskalationTage: Record<EskalationsEbene, number>;
  sifaInKopie: boolean;
  standard: boolean;
}

export interface EigeneBenachrichtigungen {
  organisationName: string;
  email: string;
  rolle: Rolle;
  benachrichtigung: EigeneBenachrichtigung; // genau eine (MAIL_ART_FUER_ROLLE)
  bereichsRegeln: BereichsRegel[]; // ADM/SIF alle Bereiche, VER eigene, PRF/MA []
  mailModus: MailModus;
}

export interface ProtokollFilter {
  von?: IsoDate; // Default heute − 30
  bis?: IsoDate; // Default heute
  status?: VersandStatus | 'probleme';
  art?: MailArt;
  bereichId?: Id;
  seite?: number; // ab 1
}

export const PROTOKOLL_PRO_SEITE = 50;

export interface ProtokollPosten {
  geraetId: Id;
  geraetBezeichnung: string;
  inventarnummer: string | null;
  bereichName: string;
  pruefartBezeichnung: string | null;
  stufe: string;
  stufeLabel: string; // stufeLabel()
  faelligAm: IsoDate | null; // bezugDatum bei art 'frist'
  rolle: PostenRolle;
}

export interface ProtokollEintrag {
  versandId: Id;
  laufDatum: IsoDate;
  art: MailArt;
  status: VersandStatus;
  statusAm: IsoDateTime;
  versuche: number;
  fehlerCode: MailFehlerCode | null;
  /** ma_hinweis: null außer bei Status in VERSAND_PROBLEME; null auch nach Pseudonymisierung oder unbekannter Person. */
  empfaenger: { name: string; rolle: Rolle } | null;
  postenAnzahl: number;
  posten: ProtokollPosten[]; // ma_hinweis: immer []
}

export interface ProtokollSeite {
  eintraege: ProtokollEintrag[]; // neueste zuerst (laufDatum, erstelltAm)
  gesamt: number;
  seite: number;
  proSeite: number;
  filter: Required<Pick<ProtokollFilter, 'von' | 'bis'>> & Omit<ProtokollFilter, 'von' | 'bis'>; // wirksame Werte
  letzterLauf: { laufDatum: IsoDate; status: LaufStatus; beendetAm: IsoDateTime | null } | null;
  mailModus: MailModus;
}

export interface VorschauMail {
  id: Id;
  erstelltAm: IsoDateTime;
  laufDatum: IsoDate;
  organisationName: string;
  art: MailArt;
  an: string; // E-Mail-Adresse (nur im Prozessspeicher, nie in der DB)
  betreff: string;
  text: string;
  html: string;
  listUnsubscribe: string | null;
}

export interface MailVorschauSeite {
  mails: VorschauMail[]; // neueste zuerst; FE zeigt nur Mails der aktuellen Organisation (BE filtert)
  heute: IsoDate;
  datumWaehlbar: boolean; // nur Demo-Modus
}

export interface AbmeldeSeite {
  token: string;
  organisationName: string;
  art: AbbestellbareMailArt;
  artLabel: string;
  abgemeldet: boolean;
}

// ---------- Server Actions ----------

export interface ActionState {
  status: 'idle' | 'ok' | 'fehler';
  meldung?: string;
  feldfehler?: Partial<Record<string, string[]>>; // Schlüssel = Formularfeldname
  id?: Id;
}

export const INITIAL_ACTION_STATE: ActionState = { status: 'idle' };
