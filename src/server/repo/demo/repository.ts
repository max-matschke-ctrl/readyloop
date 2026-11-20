// In-Memory-Repository für den Demo-Modus (BE-5). Gibt Kopien heraus, damit Aufrufer den Store nicht verändern.
import { randomUUID } from 'node:crypto';
import { mangelUebergangErlaubt } from '@/domain/maengel';
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

  // ---- Inkrement 2 ----

  async listeAnlaesse(organisationId: Id): Promise<Anlass[]> {
    return kopie(this.stand.anlaesse.filter((a) => a.organisationId === organisationId));
  }
  async holeAnlass(id: Id): Promise<Anlass | null> {
    return kopie(this.stand.anlaesse.find((a) => a.id === id) ?? null);
  }
  async listeMaengel(organisationId: Id): Promise<Mangel[]> {
    return kopie(this.stand.maengel.filter((m) => m.organisationId === organisationId));
  }
  async holeMangel(id: Id): Promise<Mangel | null> {
    return kopie(this.stand.maengel.find((m) => m.id === id) ?? null);
  }

  async speichereBereich({ bereich, neu, ereignis }: Parameters<Repository['speichereBereich']>[0]): Promise<void> {
    const vorhanden = this.stand.bereiche.find((b) => b.id === bereich.id);
    if (neu) {
      if (vorhanden) throw new Error('Bereich existiert bereits');
      const standortId = bereich.standortId || this.stand.standorte.find((s) => s.organisationId === bereich.organisationId)?.id;
      if (!standortId) throw new Error('Kein Standort');
      this.stand.bereiche.push(kopie({ ...bereich, standortId }));
    } else {
      if (!vorhanden) throw new Error('Bereich nicht gefunden');
      vorhanden.name = bereich.name;
      vorhanden.einsatzort = bereich.einsatzort;
    }
    this.stand.ereignisse.push(kopie(ereignis));
  }

  /** Demo: kein Versand. Unbekannte E-Mail → neuer Benutzer. */
  async ladeBenutzerEin({ email, name }: Parameters<Repository['ladeBenutzerEin']>[0]) {
    const vorhanden = this.stand.benutzer.find((b) => b.email.toLowerCase() === email.toLowerCase());
    if (vorhanden) return { benutzerId: vorhanden.id, neu: false };
    const id = randomUUID();
    this.stand.benutzer.push({ id, name, email: email.toLowerCase() });
    return { benutzerId: id, neu: true };
  }

  async speichereMitgliedschaft({ mitgliedschaft, benutzer, neu, ereignis }: Parameters<Repository['speichereMitgliedschaft']>[0]) {
    const doppelt = this.stand.mitgliedschaften.find(
      (m) => m.organisationId === mitgliedschaft.organisationId && m.benutzerId === mitgliedschaft.benutzerId && m.id !== mitgliedschaft.id,
    );
    if (doppelt) throw new Error('Mitgliedschaft existiert bereits');
    const i = this.stand.mitgliedschaften.findIndex((m) => m.id === mitgliedschaft.id);
    if (neu !== (i < 0)) throw new Error(neu ? 'Mitgliedschaft existiert bereits' : 'Mitgliedschaft nicht gefunden');
    if (i < 0) this.stand.mitgliedschaften.push(kopie(mitgliedschaft));
    else this.stand.mitgliedschaften[i] = kopie(mitgliedschaft);
    const b = this.stand.benutzer.find((x) => x.id === benutzer.id);
    if (b) b.name = benutzer.name;
    else this.stand.benutzer.push(kopie(benutzer));
    this.stand.ereignisse.push(kopie(ereignis));
  }

  private pruefart(id: Id) {
    const p = this.stand.pruefarten.find((x) => x.id === id);
    if (!p) throw new Error('Prüfart nicht gefunden');
    return p;
  }
  private geraet(id: Id) {
    const g = this.stand.geraete.find((x) => x.id === id);
    if (!g) throw new Error('Gerät nicht gefunden');
    return g;
  }

  async setzePruefer({ pruefartId, prueferId, ereignis }: Parameters<Repository['setzePruefer']>[0]) {
    this.pruefart(pruefartId).zugewiesenerPrueferId = prueferId;
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async setzeGbuDokument({ pruefartId, gbuDokument, ereignis }: Parameters<Repository['setzeGbuDokument']>[0]) {
    this.pruefart(pruefartId).gbuDokument = kopie(gbuDokument);
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async verschiebeGeraet({ geraetId, bereichId, ereignis }: Parameters<Repository['verschiebeGeraet']>[0]) {
    this.geraet(geraetId).bereichId = bereichId;
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async setzeBetriebsstatus({ geraetId, betriebsstatus, ereignis }: Parameters<Repository['setzeBetriebsstatus']>[0]) {
    this.geraet(geraetId).betriebsstatus = betriebsstatus;
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async erfasseAnlaesse({ anlaesse, ereignisse }: Parameters<Repository['erfasseAnlaesse']>[0]) {
    this.stand.anlaesse.push(...kopie(anlaesse));
    this.stand.ereignisse.push(...kopie(ereignisse));
  }
  async hebeAnlassAuf({ anlass, ereignis }: Parameters<Repository['hebeAnlassAuf']>[0]) {
    const a = this.stand.anlaesse.find((x) => x.id === anlass.id);
    if (!a) throw new Error('Anlass nicht gefunden');
    if (a.aufgehobenAm !== null) throw new Error('Anlass bereits aufgehoben');
    // Nur die Aufhebungsfelder ändern (Anlässe sind sonst unveränderlich).
    a.aufgehobenVon = anlass.aufgehobenVon;
    a.aufgehobenVonName = anlass.aufgehobenVonName;
    a.aufgehobenAm = anlass.aufgehobenAm;
    a.aufhebungsgrund = anlass.aufhebungsgrund;
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async erfasseMangel({ mangel, ereignis }: Parameters<Repository['erfasseMangel']>[0]) {
    this.stand.maengel.push(kopie(mangel));
    this.stand.ereignisse.push(kopie(ereignis));
  }
  async aktualisiereMangel({ mangel, ereignis }: Parameters<Repository['aktualisiereMangel']>[0]) {
    const i = this.stand.maengel.findIndex((x) => x.id === mangel.id);
    if (i < 0) throw new Error('Mangel nicht gefunden');
    const alt = this.stand.maengel[i];
    if (!mangelUebergangErlaubt(alt.status, mangel.status)) throw new Error(`Übergang ${alt.status} → ${mangel.status} nicht erlaubt`);
    // Beschreibung, Schwere und Bezug bleiben unverändert (F-14).
    this.stand.maengel[i] = kopie({
      ...mangel,
      geraetId: alt.geraetId,
      geraetPruefartId: alt.geraetPruefartId,
      nachweisId: alt.nachweisId,
      beschreibung: alt.beschreibung,
      schwere: alt.schwere,
      erfasstVon: alt.erfasstVon,
      erfasstVonName: alt.erfasstVonName,
      erfasstAm: alt.erfasstAm,
    });
    this.stand.ereignisse.push(kopie(ereignis));
  }

  // ---- Inkrement I3M (Stubs) ----
  async listeTokens(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async listeUebernahmen(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async listeKurzRohdaten(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async holeTokenRohdaten(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async starteUebernahme(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async beendeUebernahme(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async setzeZuordnung(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async erneuereToken(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
  async loeseNutzungen(): Promise<never> { throw new Error('nicht implementiert (BE-16)'); }
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
