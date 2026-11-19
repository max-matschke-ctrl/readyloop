// In-Memory-Repository für den Demo-Modus (BE-5). Gibt Kopien heraus, damit Aufrufer den Store nicht verändern.
import type { Id } from '@/domain/types';
import type { Repository } from '../types';
import { erzeugeDemoStand, type DemoStand } from './daten';

const kopie = <T>(wert: T): T => structuredClone(wert);

export class DemoRepository implements Repository {
  constructor(private readonly stand: DemoStand) {}

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
    if (letztePruefung !== null) {
      p.letztePruefung = letztePruefung;
      p.letztePruefungHerkunft = 'nachweis';
    }
    this.stand.ereignisse.push(kopie(ereignis));
  }
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
