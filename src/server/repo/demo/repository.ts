// In-Memory-Repository für den Demo-Modus (BE-5). Gibt Kopien heraus, damit Aufrufer den Store nicht verändern.
import { randomUUID } from 'node:crypto';
import { mangelUebergangErlaubt } from '@/domain/maengel';
import type { Anlass, Geraet, GeraetToken, Id, Mangel, Uebernahme } from '@/domain/types';
import { SUCHE_MAX, type KurzAuswahl, type KurzRohdaten, type Repository, type TokenRohdaten } from '../types';
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

  // ---- Inkrement I3M ----

  async listeTokens(organisationId: Id): Promise<GeraetToken[]> {
    return kopie(this.stand.tokens.filter((t) => t.organisationId === organisationId));
  }
  /** Liefert alle Zeilen; die Sichtbarkeit nach F-27 setzen die Dienste durch (Supabase zusätzlich RLS). */
  async listeUebernahmen(organisationId: Id, geraetId?: Id): Promise<Uebernahme[]> {
    return kopie(
      this.stand.uebernahmen.filter((u) => u.organisationId === organisationId && (geraetId === undefined || u.geraetId === geraetId)),
    );
  }

  async listeKurzRohdaten(organisationId: Id, auswahl: KurzAuswahl, fuerBenutzerId: Id): Promise<KurzRohdaten[]> {
    const geraete = this.stand.geraete.filter((g) => g.organisationId === organisationId);
    let treffer: Geraet[];
    if (auswahl.art === 'meine') {
      const uebernommen = new Set(
        this.stand.uebernahmen.filter((u) => u.bis === null && u.benutzerId === fuerBenutzerId).map((u) => u.geraetId),
      );
      treffer = geraete.filter((g) => g.zugeordnetAn === fuerBenutzerId || uebernommen.has(g.id));
    } else if (auswahl.art === 'suche') {
      const q = auswahl.suche.trim().toLocaleLowerCase('de');
      if (q.length < 2) return [];
      treffer = geraete
        .filter((g) => [g.bezeichnung, g.inventarnummer, g.seriennummer, g.hersteller].some((f) => f?.toLocaleLowerCase('de').includes(q)))
        .sort((a, b) => a.bezeichnung.localeCompare(b.bezeichnung, 'de'))
        .slice(0, SUCHE_MAX);
    } else {
      const ids = new Set(auswahl.geraetIds);
      treffer = geraete.filter((g) => ids.has(g.id));
    }
    return treffer.map((g) => {
      const offen = this.stand.uebernahmen.find((u) => u.geraetId === g.id && u.bis === null) ?? null;
      const vonMir = offen !== null && offen.benutzerId === fuerBenutzerId;
      return {
        ...this.statusRohdaten(g),
        bereichName: this.stand.bereiche.find((b) => b.id === g.bereichId)?.name ?? '',
        zugeordnetMir: g.zugeordnetAn === fuerBenutzerId,
        offeneUebernahme: offen ? { vonMir, seit: vonMir ? offen.von : null } : null,
      };
    });
  }

  /** Nur aktive Tokens. */
  async holeTokenRohdaten(token: string): Promise<TokenRohdaten | null> {
    const t = this.stand.tokens.find((x) => x.token === token && x.aktiv);
    const g = t ? this.stand.geraete.find((x) => x.id === t.geraetId) : undefined;
    const org = g ? this.stand.organisationen.find((o) => o.id === g.organisationId) : undefined;
    if (!g || !org) return null;
    return { ...this.statusRohdaten(g), organisationName: org.name };
  }

  /** Gemeinsamer Teil von Kurz- und Token-Rohdaten: nur öffentliche Felder (F-24), Prüfername nur beim neuesten Nachweis. */
  private statusRohdaten(g: Geraet): Omit<TokenRohdaten, 'organisationName'> {
    const pruefarten = this.stand.pruefarten.filter((p) => p.geraetId === g.id);
    const nachweise = this.stand.nachweise
      .filter((n) => n.geraetId === g.id)
      .sort((a, b) => b.pruefdatum.localeCompare(a.pruefdatum) || b.erfasstAm.localeCompare(a.erfasstAm));
    const neueste = new Set(pruefarten.map((p) => nachweise.find((n) => n.geraetPruefartId === p.id)?.id).filter(Boolean));
    return kopie({
      geraet: {
        id: g.id,
        organisationId: g.organisationId,
        bezeichnung: g.bezeichnung,
        inventarnummer: g.inventarnummer,
        hersteller: g.hersteller,
        typ: g.typ,
        kategorie: g.kategorie,
        betriebsstatus: g.betriebsstatus,
      },
      pruefarten: pruefarten.map((p) => ({
        id: p.id,
        bezeichnung: p.bezeichnung,
        letztePruefung: p.letztePruefung,
        letztePruefungHerkunft: p.letztePruefungHerkunft,
        frist: p.frist ? { monate: p.frist.monate, quelle: p.frist.quelle, stufe: p.frist.stufe, fundstelle: p.frist.fundstelle } : null,
      })),
      nachweise: nachweise.map((n) => ({
        id: n.id,
        geraetPruefartId: n.geraetPruefartId,
        pruefdatum: n.pruefdatum,
        ergebnis: n.ergebnis,
        erfasstAm: n.erfasstAm,
        prueferName: neueste.has(n.id) ? n.prueferName : null,
      })),
      anlaesse: this.stand.anlaesse
        .filter((a) => a.geraetId === g.id)
        .map((a) => ({ id: a.id, geraetPruefartId: a.geraetPruefartId, datum: a.datum, erfasstAm: a.erfasstAm, aufgehobenAm: a.aufgehobenAm })),
      offeneMaengel: this.stand.maengel.filter((m) => m.geraetId === g.id && m.status !== 'behoben').map((m) => ({ schwere: m.schwere })),
    });
  }

  async starteUebernahme({ uebernahme, vorherige }: Parameters<Repository['starteUebernahme']>[0]): Promise<void> {
    const offen = this.stand.uebernahmen.find((u) => u.geraetId === uebernahme.geraetId && u.bis === null);
    if (offen && (!vorherige || offen.id !== vorherige.id)) throw new Error('Gerät hat bereits eine offene Übernahme');
    if (offen && vorherige) {
      offen.bis = vorherige.bis;
      offen.endeArt = vorherige.endeArt;
      offen.beendetVon = vorherige.beendetVon;
    }
    this.stand.uebernahmen.push(kopie(uebernahme));
  }

  async beendeUebernahme({ uebernahme }: Parameters<Repository['beendeUebernahme']>[0]): Promise<void> {
    const u = this.stand.uebernahmen.find((x) => x.id === uebernahme.id);
    if (!u) throw new Error('Übernahme nicht gefunden');
    if (u.bis !== null) throw new Error('Übernahme bereits beendet');
    // Nur die Endefelder ändern (einmaliges Beenden).
    u.bis = uebernahme.bis;
    u.endeArt = uebernahme.endeArt;
    u.beendetVon = uebernahme.beendetVon;
  }

  async setzeZuordnung({ geraetId, benutzerId, ereignis }: Parameters<Repository['setzeZuordnung']>[0]): Promise<void> {
    const g = this.geraet(geraetId);
    if (benutzerId !== null && g.kategorie !== 'personenbezogen') throw new Error('Nur personenbezogene Geräte');
    g.zugeordnetAn = benutzerId;
    this.stand.ereignisse.push(kopie(ereignis));
  }

  async erneuereToken({ geraetId, neu, ereignis }: Parameters<Repository['erneuereToken']>[0]): Promise<string> {
    this.geraet(geraetId);
    for (const t of this.stand.tokens) {
      if (t.geraetId === geraetId && t.aktiv) {
        t.aktiv = false;
        t.deaktiviertAm = neu.erstelltAm;
      }
    }
    this.stand.tokens.push(kopie({ ...neu, geraetId, aktiv: true, deaktiviertAm: null }));
    this.stand.ereignisse.push(kopie(ereignis));
    return neu.token;
  }

  /** F-20 Austritt: Zuordnungen lösen, offene Übernahmen mit Ende-Art 'austritt'. Ohne Ereignis (Anlass ist mitglied_gespeichert). */
  async loeseNutzungen({ organisationId, benutzerId, jetzt }: Parameters<Repository['loeseNutzungen']>[0]): Promise<void> {
    for (const g of this.stand.geraete) {
      if (g.organisationId === organisationId && g.zugeordnetAn === benutzerId) g.zugeordnetAn = null;
    }
    for (const u of this.stand.uebernahmen) {
      if (u.organisationId === organisationId && u.benutzerId === benutzerId && u.bis === null) {
        u.bis = jetzt;
        u.endeArt = 'austritt';
        u.beendetVon = null;
      }
    }
  }

  async legeGeraetAn({ geraet, pruefarten, ereignis, token }: Parameters<Repository['legeGeraetAn']>[0]) {
    this.stand.geraete.push(kopie(geraet));
    this.stand.pruefarten.push(...kopie(pruefarten));
    this.stand.tokens.push(kopie(token));
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
