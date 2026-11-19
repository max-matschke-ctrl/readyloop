// Repository-Interface (intern, BE-5). I1: In-Memory-Demo; I2: Supabase-Adapter mit gleicher Schnittstelle.
// Nachweise und Ereignisse sind append-only: es gibt bewusst keine Methoden zum Ändern oder Löschen.
import type {
  Bereich,
  Benutzer,
  Ereignis,
  FestgelegteFrist,
  Geraet,
  GeraetPruefart,
  Id,
  IsoDate,
  KatalogEintrag,
  Mitgliedschaft,
  Nachweis,
  Organisation,
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
  setzeFrist(daten: { pruefartId: Id; frist: FestgelegteFrist; ereignis: Ereignis }): Promise<void>;
  erfasseNachweis(daten: {
    nachweis: Nachweis;
    pdf: Uint8Array;
    /** gesetzt, wenn F-7 die letzte Prüfung fortschreibt */
    letztePruefung: IsoDate | null;
    ereignis: Ereignis;
  }): Promise<void>;
}
