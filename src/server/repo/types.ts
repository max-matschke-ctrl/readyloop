// Repository-Interface (intern, BE-5, §5.6). I1: In-Memory-Demo; I2: Supabase-Adapter mit gleicher Schnittstelle.
// Nachweise und Ereignisse sind append-only: es gibt bewusst keine Methoden zum Ändern oder Löschen.
// Supabase: Ereignisse entstehen per Trigger; der Parameter `ereignis` wird dort ignoriert und dient der Demo.
// Gleiche Ereignisdaten in beiden Implementierungen (F-19).
import type {
  Anlass,
  Bereich,
  Benutzer,
  Ereignis,
  FestgelegteFrist,
  GbuDokument,
  Geraet,
  GeraetPruefart,
  GeraetToken,
  Id,
  IsoDate,
  IsoDateTime,
  KatalogEintrag,
  Mangel,
  MangelSchwere,
  Mitgliedschaft,
  Nachweis,
  OeffentlicheFrist,
  Organisation,
  Uebernahme,
  WaehlbarerBetriebsstatus,
} from '@/domain/types';

// ---------- I3M (§7.7) ----------

export type KurzAuswahl =
  | { art: 'meine' }
  | { art: 'suche'; suche: string } // ≥ 2 Zeichen, höchstens 50 Treffer
  | { art: 'ids'; geraetIds: Id[] };

/** Höchstzahl Treffer der Suche (F-26/US-28). */
export const SUCHE_MAX = 50;

/** Rohdaten für Kurzansicht und öffentliche Ansicht. Enthält keine Personennamen außer Prüfernamen. */
export interface KurzRohdaten {
  geraet: Pick<Geraet, 'id' | 'organisationId' | 'bezeichnung' | 'inventarnummer' | 'hersteller' | 'typ' | 'kategorie' | 'betriebsstatus'>;
  bereichName: string;
  pruefarten: (Pick<GeraetPruefart, 'id' | 'bezeichnung' | 'letztePruefung' | 'letztePruefungHerkunft'> & { frist: OeffentlicheFrist | null })[];
  nachweise: (Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis' | 'erfasstAm'> & { prueferName: string | null })[]; // Name nur beim neuesten je Prüfart
  anlaesse: Pick<Anlass, 'id' | 'geraetPruefartId' | 'datum' | 'erfasstAm' | 'aufgehobenAm'>[];
  offeneMaengel: { schwere: MangelSchwere }[];
  zugeordnetMir: boolean;
  offeneUebernahme: { vonMir: boolean; seit: IsoDateTime | null } | null; // seit nur bei vonMir
}

export interface TokenRohdaten extends Omit<KurzRohdaten, 'bereichName' | 'zugeordnetMir' | 'offeneUebernahme'> {
  organisationName: string;
}

export interface Repository {
  // Lesen
  holeOrganisation(id: Id): Promise<Organisation | null>;
  holeBenutzer(id: Id): Promise<Benutzer | null>;
  listeBenutzer(organisationId: Id): Promise<Benutzer[]>;
  listeMitgliedschaften(organisationId: Id): Promise<Mitgliedschaft[]>;
  mitgliedschaftenVonBenutzer(benutzerId: Id): Promise<Mitgliedschaft[]>;
  listeBereiche(organisationId: Id): Promise<Bereich[]>;
  listeKatalog(): Promise<KatalogEintrag[]>;
  listeGeraete(organisationId: Id): Promise<Geraet[]>;
  holeGeraet(id: Id): Promise<Geraet | null>;
  listePruefarten(organisationId: Id): Promise<GeraetPruefart[]>;
  holePruefart(id: Id): Promise<GeraetPruefart | null>;
  listeNachweise(organisationId: Id): Promise<Nachweis[]>;
  holeNachweis(id: Id): Promise<Nachweis | null>;
  holeNachweisPdf(id: Id): Promise<Uint8Array | null>;
  listeEreignisse(organisationId: Id, geraetId?: Id): Promise<Ereignis[]>;

  // Schreiben (je Aufruf atomar)
  /** I3M: + token. Supabase: Token per Trigger, Parameter ignoriert. */
  legeGeraetAn(daten: { geraet: Geraet; pruefarten: GeraetPruefart[]; ereignis: Ereignis; token: GeraetToken }): Promise<void>;
  setzeFrist(daten: { pruefartId: Id; frist: FestgelegteFrist; nachweisId: Id | null; ereignis: Ereignis }): Promise<void>;
  erfasseNachweis(daten: {
    nachweis: Nachweis;
    pdf: Uint8Array;
    /** gesetzt, wenn F-7 die letzte Prüfung fortschreibt */
    letztePruefung: IsoDate | null;
    ereignis: Ereignis;
  }): Promise<void>;

  // Lesen I2
  listeAnlaesse(organisationId: Id): Promise<Anlass[]>;
  holeAnlass(id: Id): Promise<Anlass | null>;
  listeMaengel(organisationId: Id): Promise<Mangel[]>;
  holeMangel(id: Id): Promise<Mangel | null>;

  // Schreiben I2 (je Aufruf atomar)
  speichereBereich(daten: { bereich: Bereich; neu: boolean; ereignis: Ereignis }): Promise<void>;
  ladeBenutzerEin(daten: { email: string; name: string }): Promise<{ benutzerId: Id; neu: boolean }>;
  speichereMitgliedschaft(daten: {
    mitgliedschaft: Mitgliedschaft;
    benutzer: Benutzer;
    neu: boolean;
    ereignis: Ereignis;
  }): Promise<void>;
  setzePruefer(daten: { pruefartId: Id; prueferId: Id | null; ereignis: Ereignis }): Promise<void>;
  setzeGbuDokument(daten: { pruefartId: Id; gbuDokument: GbuDokument | null; ereignis: Ereignis }): Promise<void>;
  verschiebeGeraet(daten: { geraetId: Id; bereichId: Id; begruendung: string | null; ereignis: Ereignis }): Promise<void>;
  setzeBetriebsstatus(daten: {
    geraetId: Id;
    betriebsstatus: WaehlbarerBetriebsstatus;
    begruendung: string | null;
    ereignis: Ereignis;
  }): Promise<void>;
  erfasseAnlaesse(daten: { anlaesse: Anlass[]; ereignisse: Ereignis[] }): Promise<void>;
  /** anlass mit gesetzten aufgehoben*-Feldern */
  hebeAnlassAuf(daten: { anlass: Anlass; ereignis: Ereignis }): Promise<void>;
  erfasseMangel(daten: { mangel: Mangel; ereignis: Ereignis }): Promise<void>;
  /** nur Übergänge nach F-14 */
  aktualisiereMangel(daten: { mangel: Mangel; ereignis: Ereignis }): Promise<void>;

  // Lesen I3M
  /** RLS: ADM, VER (Bereich). */
  listeTokens(organisationId: Id): Promise<GeraetToken[]>;
  /** RLS: eigene; ADM alle; SIF/VER (Bereich) nur offene; PRF keine. Demo liefert alle – Dienste filtern nach F-27. */
  listeUebernahmen(organisationId: Id, geraetId?: Id): Promise<Uebernahme[]>;
  /** Nur für Rolle mitarbeiter. Supabase: RPC ma_kurzansichten. */
  listeKurzRohdaten(organisationId: Id, auswahl: KurzAuswahl, fuerBenutzerId: Id): Promise<KurzRohdaten[]>;
  /** Ohne Sitzung aufrufbar. Nur aktive Tokens. Supabase: RPC geraet_oeffentlich.
   *  geraet.id/organisationId dienen nur dem Server (TokenSeite.kurz, akteUrl) und gehen nie unverändert an den Client. */
  holeTokenRohdaten(token: string): Promise<TokenRohdaten | null>;

  // Schreiben I3M (je Aufruf atomar)
  /** vorherige: fremde offene Übernahme mit gesetztem bis/endeArt 'uebergabe'. Supabase: RPC uebernahme_starten. */
  starteUebernahme(daten: { uebernahme: Uebernahme; vorherige: Uebernahme | null }): Promise<void>;
  /** uebernahme mit gesetztem bis/endeArt/beendetVon. Supabase: RPC uebernahme_beenden. */
  beendeUebernahme(daten: { uebernahme: Uebernahme }): Promise<void>;
  setzeZuordnung(daten: { geraetId: Id; benutzerId: Id | null; ereignis: Ereignis }): Promise<void>;
  /** Supabase: RPC etikett_erneuern (erzeugt den Token selbst; neu.token wird durch den Rückgabewert ersetzt). */
  erneuereToken(daten: { geraetId: Id; neu: GeraetToken; ereignis: Ereignis }): Promise<string>;
  /** F-20 Austritt. Demo: Zuordnungen lösen, offene Übernahmen 'austritt'. Supabase: No-op (Trigger). */
  loeseNutzungen(daten: { organisationId: Id; benutzerId: Id; jetzt: IsoDateTime }): Promise<void>;
}
