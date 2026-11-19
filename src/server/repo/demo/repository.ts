// In-Memory-Repository für den Demo-Modus (BE-5). Gibt Kopien heraus, damit Aufrufer den Store nicht verändern.
import type { Anlass, Id, Mangel } from '@/domain/types';
import type { Repository } from '../types';
import { erzeugeDemoStand, type DemoStand } from './daten';

const kopie = <T>(wert: T): T => structuredClone(wert);

/** Höchstzahl hochgeladener PDFs im Speicher; danach wird das älteste verworfen. Demo-PDFs bleiben erhalten. */
export const DEMO_MAX_HOCHGELADENE_PDFS = 50;

export class DemoRepository implements Repository {
  /** Reihenfolge der hochgeladenen PDFs (älteste zuerst). */
  private readonly hochgeladen: Id[] = [];

  constructor(
    private readonly stand: DemoStand,
    private readonly maxPdfs: number = DEMO_MAX_HOCHGELADENE_PDFS,
  ) {}

  async holeOrganisation(id: Id) {
    return kopie(this.stand.organisationen.find((o) => o.id === id) ?? null);
  }
  async holeBenutzer(id: Id) {
    return kopie(this.stand.benutzer.find((b) => b.id === id) ?? null);
  }
  async listeBenutzer(organisationId: Id) {
    const ids = new Set(this.stand.mitgliedschaften.filter((m) => m.organisationId === organisationId).map((m) => m.benutzerId));
    return kopie(this.stand.benutzer.filter((b) => ids.has(b.id)));
  }
  async listeMitgliedschaften(organisationId: Id) {
    return kopie(this.stand.mitgliedschaften.filter((m) => m.organisationId === organisationId));
  }
  async mitgliedschaftenVonBenutzer(benutzerId: Id) {
    return kopie(this.stand.mitgliedschaften.filter((m) => m.benutzerId === benutzerId));
  }
  async listeBereiche(organisationId: Id) {
    return kopie(this.stand.bereiche.filter((b) => b.organisationId === organisationId));
  }
  async listeKatalog() {
    return kopie(this.stand.katalog);
  }
  async listeGeraete(organisationId: Id) {
    return kopie(this.stand.geraete.filter((g) => g.organisationId === organisationId));
  }
  async holeGeraet(id: Id) {
    return kopie(this.stand.geraete.find((g) => g.id === id) ?? null);
  }
  async listePruefarten(organisationId: Id) {
    return kopie(this.stand.pruefarten.filter((p) => p.organisationId === organisationId));
  }
  async holePruefart(id: Id) {
    return kopie(this.stand.pruefarten.find((p) => p.id === id) ?? null);
  }
  async listeNachweise(organisationId: Id) {
    return kopie(this.stand.nachweise.filter((n) => n.organisationId === organisationId));
  }
  async holeNachweis(id: Id) {
    return kopie(this.stand.nachweise.find((n) => n.id === id) ?? null);
  }
  async holeNachweisPdf(id: Id) {
    const pdf = this.stand.pdfs.get(id);
    return pdf ? new Uint8Array(pdf) : null;
  }
  async listeEreignisse(organisationId: Id, geraetId?: Id) {
    return kopie(
      this.stand.ereignisse.filter(
        (e) => e.organisationId === organisationId && (geraetId === undefined || e.geraetId === geraetId),
      ),
    );
  }

  async legeGeraetAn({ geraet, pruefarten, ereignis }: Parameters<Repository['legeGeraetAn']>[0]) {
    this.stand.geraete.push(kopie(geraet));
    this.stand.pruefarten.push(...kopie(pruefarten));
    this.stand.ereignisse.push(kopie(ereignis));
  }

  /** nachweisId nur für Supabase (Trigger-Kontext); in der Demo steht der Bezug im Ereignis. */
  async setzeFrist({ pruefartId, frist, ereignis }: Parameters<Repository['setzeFrist']>[0]) {
    const p = this.stand.pruefarten.find((x) => x.id === pruefartId);
    if (!p) throw new Error('Prüfart nicht gefunden');
    p.frist = kopie(frist);
    this.stand.ereignisse.push(kopie(ereignis));
  }

  async erfasseNachweis({ nachweis, pdf, letztePruefung, ereignis }: Parameters<Repository['erfasseNachweis']>[0]) {
    const p = this.stand.pruefarten.find((x) => x.id === nachweis.geraetPruefartId);
    if (!p) throw new Error('Prüfart nicht gefunden');
    this.stand.nachweise.push(kopie(nachweis));
    this.stand.pdfs.set(nachweis.id, new Uint8Array(pdf));
    this.hochgeladen.push(nachweis.id);
    while (this.hochgeladen.length > this.maxPdfs) {
      const aeltestes = this.hochgeladen.shift();
      if (aeltestes !== undefined) this.stand.pdfs.delete(aeltestes);
    }
    if (letztePruefung !== null) {
      p.letztePruefung = letztePruefung;
      p.letztePruefungHerkunft = 'nachweis';
    }
    this.stand.ereignisse.push(kopie(ereignis));
  }

  // ---- Inkrement 2: Stubs bis BE-10 ----

  async listeAnlaesse(organisationId: Id): Promise<Anlass[]> {
    void organisationId;
    throw nichtImplementiert();
  }
  async holeAnlass(id: Id): Promise<Anlass | null> {
    void id;
    throw nichtImplementiert();
  }
  async listeMaengel(organisationId: Id): Promise<Mangel[]> {
    void organisationId;
    throw nichtImplementiert();
  }
  async holeMangel(id: Id): Promise<Mangel | null> {
    void id;
    throw nichtImplementiert();
  }
  async speichereBereich(daten: Parameters<Repository['speichereBereich']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async ladeBenutzerEin(daten: Parameters<Repository['ladeBenutzerEin']>[0]): Promise<{ benutzerId: Id; neu: boolean }> {
    void daten;
    throw nichtImplementiert();
  }
  async speichereMitgliedschaft(daten: Parameters<Repository['speichereMitgliedschaft']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async setzePruefer(daten: Parameters<Repository['setzePruefer']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async setzeGbuDokument(daten: Parameters<Repository['setzeGbuDokument']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async verschiebeGeraet(daten: Parameters<Repository['verschiebeGeraet']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async setzeBetriebsstatus(daten: Parameters<Repository['setzeBetriebsstatus']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async erfasseAnlaesse(daten: Parameters<Repository['erfasseAnlaesse']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async hebeAnlassAuf(daten: Parameters<Repository['hebeAnlassAuf']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async erfasseMangel(daten: Parameters<Repository['erfasseMangel']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
  async aktualisiereMangel(daten: Parameters<Repository['aktualisiereMangel']>[0]): Promise<void> {
    void daten;
    throw nichtImplementiert();
  }
}

function nichtImplementiert(): Error {
  return new Error('nicht implementiert (BE-10)');
}

export function erzeugeDemoRepository(heute: string): DemoRepository {
  return new DemoRepository(erzeugeDemoStand(heute));
}

const SPEICHER = globalThis as typeof globalThis & { __readyloopDemoRepository?: DemoRepository };

/** Modul-Singleton auf globalThis: überlebt Hot Reload, nicht den Neustart des Servers. */
export function demoRepository(heute: string): DemoRepository {
  SPEICHER.__readyloopDemoRepository ??= erzeugeDemoRepository(heute);
  return SPEICHER.__readyloopDemoRepository;
}
