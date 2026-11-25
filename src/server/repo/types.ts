// Repository-Interface (intern, BE-5, §5.6). I1: In-Memory-Demo; I2: Supabase-Adapter mit gleicher Schnittstelle.
// Nachweise und Ereignisse sind append-only: es gibt bewusst keine Methoden zum Ändern oder Löschen.
// Supabase: Ereignisse entstehen per Trigger; der Parameter `ereignis` wird dort ignoriert und dient der Demo.
// Gleiche Ereignisdaten in beiden Implementierungen (F-19).
import type { BisherigerPosten } from '@/domain/erinnerungen';
import type {
  AbbestellbareMailArt,
  Anlass,
  Bereich,
  Benutzer,
  ErinnerungEinstellung,
  ErinnerungLauf,
  ErinnerungPosten,
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
  LaufAusloeser,
  LaufStatus,
  MailFehlerCode,
  MailVersand,
  Mangel,
  MangelSchwere,
  Mitgliedschaft,
  Nachweis,
  OeffentlicheFrist,
  Organisation,
  ProtokollFilter,
  Rolle,
  Uebernahme,
  VersandStatus,
  WaehlbarerBetriebsstatus,
} from '@/domain/types';

// ---------- I3M (§7.7) ----------

export type KurzAuswahl =
  | { art: 'meine' }
  | { art: 'suche'; suche: string } // ≥ 2 Zeichen, höchstens 50 Treffer
  | { art: 'ids'; geraetIds: Id[] };

/** Höchstzahl Treffer der Suche (F-26/US-28). */
export const SUCHE_MAX = 50;

/**
 * Öffentliche Statusdaten (F-21, F-24), wie app.geraet_status_json: keine Personennamen außer Prüfernamen und
 * KEINE internen IDs (Review I3M). Prüfarten tragen eine laufende Nummer je Gerät (nr, ab 1); Nachweise und Anlässe
 * verweisen über pruefartNr darauf.
 */
export interface StatusRohdaten {
  geraet: Pick<Geraet, 'bezeichnung' | 'inventarnummer' | 'hersteller' | 'typ' | 'kategorie' | 'betriebsstatus'>;
  pruefarten: (Pick<GeraetPruefart, 'bezeichnung' | 'letztePruefung' | 'letztePruefungHerkunft'> & { nr: number; frist: OeffentlicheFrist | null })[];
  nachweise: (Pick<Nachweis, 'pruefdatum' | 'ergebnis' | 'erfasstAm'> & { pruefartNr: number; prueferName: string | null })[]; // nur neuester je Prüfart
  anlaesse: (Pick<Anlass, 'datum' | 'erfasstAm' | 'aufgehobenAm'> & { pruefartNr: number })[]; // nur offene
  offeneMaengel: { schwere: MangelSchwere }[];
}

/** Kurzansicht für Mitarbeiter derselben Organisation (RPC ma_kurzansichten): Statusdaten + Geräte-ID + eigener Bezug. */
export interface KurzRohdaten extends StatusRohdaten {
  geraetId: Id;
  bereichName: string;
  zugeordnetMir: boolean;
  offeneUebernahme: { vonMir: boolean; seit: IsoDateTime | null } | null; // seit nur bei vonMir
}

/** Öffentliche Ansicht (RPC geraet_oeffentlich). */
export interface TokenRohdaten extends StatusRohdaten {
  organisationName: string;
  /** Nur wenn die aktuelle Organisation des Aufrufers die Geräte-Organisation ist und er dort aktives Mitglied ist;
   *  sonst null (anon, fremde Organisation). */
  eigeneOrganisation: { geraetId: Id } | null;
}

// ---------- I3 (§9.6) ----------

/** Wirksamer Protokollfilter (von/bis gesetzt). */
export type WirksamerProtokollFilter = Required<Pick<ProtokollFilter, 'von' | 'bis'>> & Omit<ProtokollFilter, 'von' | 'bis'>;

/** Rohdaten des Protokolls. Supabase: RPC mail_protokoll (maskiert bereits); Demo: ungefiltert, der Dienst maskiert. */
export interface ProtokollRohdaten {
  versand: (MailVersand & { empfaengerName: string | null; empfaengerRolle: Rolle | null })[];
  posten: ErinnerungPosten[]; // nur zu den gelieferten Versänden, ohne ma_hinweis
  gesamt: number;
  letzterLauf: { laufDatum: IsoDate; status: LaufStatus; beendetAm: IsoDateTime | null } | null;
}

/** Alles, was der Lauf für eine Organisation braucht (ein Lesevorgang je Organisation). */
export interface LaufDaten {
  organisation: Organisation;
  bereiche: Bereich[];
  einstellungen: ErinnerungEinstellung[]; // nur gespeicherte
  mitgliedschaften: Mitgliedschaft[]; // alle; der Dienst filtert aktive
  benutzer: Benutzer[];
  katalog: KatalogEintrag[];
  geraete: Geraet[];
  pruefarten: GeraetPruefart[];
  nachweise: Nachweis[];
  anlaesse: Anlass[];
  maengel: Mangel[];
  offeneUebernahmen: Uebernahme[];
  betriebsstatusEreignisse: Pick<Ereignis, 'id' | 'geraetId' | 'zeitpunkt'>[]; // nur typ betriebsstatus_geaendert
  abmeldungen: { benutzerId: Id; art: AbbestellbareMailArt }[]; // nur abgemeldet = true
  bisherigePosten: BisherigerPosten[]; // VERSAND_ERFOLGREICH; frist: bezugDatum ≥ heute − 730; pruefer_woche: ab Montag der Woche; ma_hinweis: alle mit Empfänger
}

export type LaufStartErgebnis = { ergebnis: 'gestartet'; lauf: ErinnerungLauf } | { ergebnis: 'bereits_gelaufen' } | { ergebnis: 'laeuft' };

/** Ohne Benutzersitzung (F-43). Demo: In-Memory über alle Organisationen. Supabase: Service-Role-Client (system.ts). */
export interface ErinnerungsSystemRepository {
  /** Organisationen mit mindestens einer aktiven Mitgliedschaft. Reihenfolge (F-36): zuerst Betriebe ohne Versand am
   *  Datum `heute` (Fortsetzung nach `teilweise`), dann die übrigen; innerhalb nach ID. */
  listeOrganisationIds(heute: IsoDate): Promise<Id[]>;
  holeLaufDaten(organisationId: Id, heute: IsoDate): Promise<LaufDaten>;
  /** F-36: hängende Läufe (> 15 Min. `laeuft`) → `fehler`; danach „vorbereitet“-Versände nicht laufender Läufe → `fehler`
   *  (Code `abgebrochen`, Posten kommen nach F-33/F-36 am nächsten Werktag erneut). `bereits_gelaufen` nur bei einem
   *  `fertig`en, nicht manuellen Lauf desselben Datums (außer erzwingen); `teilweise` blockiert nicht. */
  starteLauf(daten: { laufDatum: IsoDate; ausloeser: LaufAusloeser; erzwingen: boolean; jetzt: IsoDateTime }): Promise<LaufStartErgebnis>;
  beendeLauf(daten: { laufId: Id; status: 'fertig' | 'teilweise' | 'fehler'; jetzt: IsoDateTime }): Promise<void>;
  /** Atomar Versand + Posten. false bei Konflikt (Organisation, Empfänger, Datum) – dann nichts geschrieben. */
  reserviereVersand(daten: { versand: MailVersand; posten: ErinnerungPosten[] }): Promise<boolean>;
  setzeVersandStatus(daten: {
    versandId: Id;
    status: VersandStatus;
    versuche: number;
    anbieterId: string | null;
    fehlerCode: MailFehlerCode | null;
    jetzt: IsoDateTime;
  }): Promise<void>;
  /** Webhook. false bei unbekannter Anbieter-ID oder unzulässigem Übergang. */
  setzeStatusPerAnbieterId(daten: { anbieterId: string; status: 'zugestellt' | 'bounce' | 'beschwerde'; jetzt: IsoDateTime }): Promise<boolean>;
  /** Token-Abmeldung ohne Sitzung. null, wenn die Person kein aktives Mitglied mit passender Rolle ist. */
  holeAbmeldeKontext(d: { organisationId: Id; benutzerId: Id; art: AbbestellbareMailArt }): Promise<{ organisationName: string; abgemeldet: boolean } | null>;
  setzeAbmeldungSystem(d: { organisationId: Id; benutzerId: Id; art: AbbestellbareMailArt; abgemeldet: boolean; jetzt: IsoDateTime }): Promise<boolean>;
  /** Demo: Empfänger von ma_hinweis älter als 90 Tage entfernen. Supabase: No-op (pg_cron). */
  pseudonymisiereMaHinweise(jetzt: Date): Promise<void>;
}

/** Abgeschlossene Übernahme im Verlauf (F-27): ohne beendetVon. */
export type UebernahmeVerlaufEintrag = Omit<Uebernahme, 'beendetVon'> & { beendetVon: null };

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
  /** Nur OFFENE Übernahmen. RLS: MA eigene; ADM/SIF alle der Organisation; VER Bereich; PRF keine. */
  listeOffeneUebernahmen(organisationId: Id, geraetId?: Id): Promise<Uebernahme[]>;
  /** F-27/US-32: abgeschlossene Übernahmen genau eines Geräts, nur admin, Ende innerhalb der letzten 90 Tage, Person
   *  vorhanden, neueste zuerst. Supabase: RPC uebernahmen_verlauf (Nicht-Admin → []). Demo: ohne Rollenprüfung, Dienst prüft. */
  listeUebernahmeVerlauf(geraetId: Id, jetzt: Date): Promise<UebernahmeVerlaufEintrag[]>;
  /** Nur für Rolle mitarbeiter. Supabase: RPC ma_kurzansichten. */
  listeKurzRohdaten(organisationId: Id, auswahl: KurzAuswahl, fuerBenutzerId: Id): Promise<KurzRohdaten[]>;
  /** Ohne Sitzung aufrufbar (fuer = null). Nur aktive Tokens. Supabase: RPC geraet_oeffentlich(p_token, p_organisation);
   *  der Benutzer ergibt sich dort aus dem JWT. eigeneOrganisation nur, wenn fuer.organisationId die Geräte-Organisation ist
   *  und der Benutzer dort aktives Mitglied ist; die Geräte-ID geht nie an anonyme oder fremde Aufrufer. */
  holeTokenRohdaten(token: string, fuer: { benutzerId: Id; organisationId: Id } | null): Promise<TokenRohdaten | null>;

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

  // I3 (§9.6)
  /** Nur gespeicherte Einstellungen. RLS: ADM/SIF alle, VER eigene Bereiche. */
  listeErinnerungEinstellungen(organisationId: Id): Promise<ErinnerungEinstellung[]>;
  /** Upsert je Bereich. Supabase: Trigger stempelt geaendert_* und schreibt das Ereignis (Parameter ereignis ignoriert). */
  speichereErinnerungEinstellung(daten: { einstellung: ErinnerungEinstellung; ereignis: Ereignis }): Promise<void>;
  /** Nur abgemeldete Arten der Person. RLS: nur eigene Zeilen. */
  listeEigeneAbmeldungen(organisationId: Id, benutzerId: Id): Promise<AbbestellbareMailArt[]>;
  setzeEigeneAbmeldung(daten: { organisationId: Id; benutzerId: Id; art: AbbestellbareMailArt; abgemeldet: boolean; jetzt: IsoDateTime }): Promise<void>;
  /** Supabase: RPC mail_protokoll; 42501 für Nicht-ADM/SIF → RepositoryFehler. */
  listeMailProtokoll(organisationId: Id, filter: WirksamerProtokollFilter): Promise<ProtokollRohdaten>;
}
