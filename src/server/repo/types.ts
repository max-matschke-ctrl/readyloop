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
  Id,
  IsoDate,
  KatalogEintrag,
  Mangel,
  Mitgliedschaft,
  Nachweis,
  Organisation,
  WaehlbarerBetriebsstatus,
} from '@/domain/types';

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
  legeGeraetAn(daten: { geraet: Geraet; pruefarten: GeraetPruefart[]; ereignis: Ereignis }): Promise<void>;
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
}
