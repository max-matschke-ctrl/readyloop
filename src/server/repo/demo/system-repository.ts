// Demo-System-Repository (BE-25): Lauf, One-Click-Abmeldung und Webhook ohne Sitzung (F-43), In-Memory über alle
// Organisationen. Spiegelt die Regeln der System-RPCs (Lauf-Sperre, Reservierung, Statusübergänge F-41).
import { randomUUID } from 'node:crypto';
import { addTage, isoWocheMontag } from '@/domain/datum';
import {
  MA_HINWEIS_AUFBEWAHRUNG_TAGE,
  MAIL_ART_FUER_ROLLE,
  VERSAND_ERFOLGREICH_DEMO,
  type AbbestellbareMailArt,
  type Id,
  type IsoDate,
  type VersandStatus,
} from '@/domain/types';
import type { ErinnerungsSystemRepository, LaufDaten } from '../types';
import type { DemoStand } from './daten';
import { setzeAbmeldung } from './repository';

const kopie = <T>(wert: T): T => structuredClone(wert);
const TAG_MS = 24 * 60 * 60 * 1000;
const HAENGT_MS = 15 * 60 * 1000;

/** F-41: erlaubte Statusübergänge (gleich wie Trigger app.mail_versand_pruefen). */
export function versandUebergangErlaubt(alt: VersandStatus, neu: VersandStatus): boolean {
  if (alt === neu) return true;
  if (alt === 'vorbereitet') return neu === 'versendet' || neu === 'fehler' || neu === 'vorschau';
  if (alt === 'versendet') return neu === 'zugestellt' || neu === 'bounce' || neu === 'beschwerde';
  if (alt === 'zugestellt') return neu === 'bounce' || neu === 'beschwerde';
  return false;
}

export class DemoSystemRepository implements ErinnerungsSystemRepository {
  constructor(private readonly stand: DemoStand) {}

  private aktivesMitglied(organisationId: Id, benutzerId: Id) {
    return this.stand.mitgliedschaften.find((m) => m.organisationId === organisationId && m.benutzerId === benutzerId && m.aktiv) ?? null;
  }

  async listeOrganisationIds(heute: IsoDate): Promise<Id[]> {
    const ids = [...new Set(this.stand.mitgliedschaften.filter((m) => m.aktiv).map((m) => m.organisationId))].sort();
    const mitVersand = new Set(this.stand.mailVersand.filter((v) => v.laufDatum === heute).map((v) => v.organisationId));
    return [...ids.filter((id) => !mitVersand.has(id)), ...ids.filter((id) => mitVersand.has(id))];
  }

  async holeLaufDaten(organisationId: Id, heute: IsoDate): Promise<LaufDaten> {
    const s = this.stand;
    const organisation = s.organisationen.find((o) => o.id === organisationId);
    if (!organisation) throw new Error('Organisation nicht gefunden');
    const vonOrg = <T extends { organisationId: Id }>(liste: T[]) => liste.filter((x) => x.organisationId === organisationId);
    const mitgliedschaften = vonOrg(s.mitgliedschaften);
    const benutzerIds = new Set(mitgliedschaften.map((m) => m.benutzerId));
    const erfolgreich = new Set(
      vonOrg(s.mailVersand)
        .filter((v) => VERSAND_ERFOLGREICH_DEMO.includes(v.status)) // Demo: vorschau zählt (F-33)
        .map((v) => v.id),
    );
    const fristAb = addTage(heute, -730);
    const wocheAb = isoWocheMontag(heute);
    return kopie({
      organisation,
      bereiche: vonOrg(s.bereiche),
      einstellungen: vonOrg(s.erinnerungEinstellungen),
      mitgliedschaften,
      benutzer: s.benutzer.filter((b) => benutzerIds.has(b.id)),
      katalog: s.katalog,
      geraete: vonOrg(s.geraete),
      pruefarten: vonOrg(s.pruefarten),
      nachweise: vonOrg(s.nachweise),
      anlaesse: vonOrg(s.anlaesse),
      maengel: vonOrg(s.maengel),
      offeneUebernahmen: vonOrg(s.uebernahmen).filter((u) => u.bis === null),
      betriebsstatusEreignisse: vonOrg(s.ereignisse)
        .filter((e) => e.typ === 'betriebsstatus_geaendert')
        .map((e) => ({ id: e.id, geraetId: e.geraetId, zeitpunkt: e.zeitpunkt })),
      abmeldungen: vonOrg(s.mailAbmeldungen)
        .filter((a) => a.abgemeldet)
        .map((a) => ({ benutzerId: a.benutzerId, art: a.art })),
      bisherigePosten: vonOrg(s.erinnerungPosten)
        .filter(
          (p) =>
            erfolgreich.has(p.versandId) &&
            p.empfaengerBenutzerId !== null &&
            (p.art === 'ma_hinweis' ||
              (p.art === 'frist' && p.bezugDatum !== null && p.bezugDatum >= fristAb) ||
              (p.art === 'pruefer_woche' && p.bezugDatum !== null && p.bezugDatum >= wocheAb)),
        )
        .map((p) => ({
          art: p.art,
          stufe: p.stufe,
          geraetId: p.geraetId,
          geraetPruefartId: p.geraetPruefartId,
          bezugDatum: p.bezugDatum,
          empfaengerBenutzerId: p.empfaengerBenutzerId as Id,
          schluessel: p.schluessel,
        })),
    });
  }

  async starteLauf({ laufDatum, ausloeser, erzwingen, jetzt }: Parameters<ErinnerungsSystemRepository['starteLauf']>[0]) {
    const laeufe = this.stand.erinnerungLaeufe;
    const jetztMs = new Date(jetzt).getTime();
    for (const l of laeufe) {
      if (l.status === 'laeuft' && jetztMs - new Date(l.gestartetAm).getTime() > HAENGT_MS) {
        l.status = 'fehler';
        l.beendetAm = jetzt;
      }
    }
    // Abgebrochene Läufe: „vorbereitet“ → fehler (abgebrochen); Posten kommen nach F-33/F-36 erneut.
    const laufend = new Set(laeufe.filter((l) => l.status === 'laeuft').map((l) => l.id));
    for (const v of this.stand.mailVersand) {
      if (v.status === 'vorbereitet' && !laufend.has(v.laufId)) {
        v.status = 'fehler';
        v.fehlerCode = 'abgebrochen';
        v.statusAm = jetzt;
      }
    }
    if (!erzwingen && laeufe.some((l) => l.laufDatum === laufDatum && l.status === 'fertig' && l.ausloeser !== 'manuell')) {
      return { ergebnis: 'bereits_gelaufen' as const };
    }
    if (laeufe.some((l) => l.status === 'laeuft')) return { ergebnis: 'laeuft' as const };
    const lauf = { id: randomUUID(), laufDatum, ausloeser, status: 'laeuft' as const, gestartetAm: jetzt, beendetAm: null };
    laeufe.push(lauf);
    return { ergebnis: 'gestartet' as const, lauf: kopie(lauf) };
  }

  async beendeLauf({ laufId, status, jetzt }: Parameters<ErinnerungsSystemRepository['beendeLauf']>[0]): Promise<void> {
    const l = this.stand.erinnerungLaeufe.find((x) => x.id === laufId && x.status === 'laeuft');
    if (!l) return;
    l.status = status;
    l.beendetAm = jetzt;
  }

  async reserviereVersand({ versand, posten }: Parameters<ErinnerungsSystemRepository['reserviereVersand']>[0]): Promise<boolean> {
    const s = this.stand;
    if (versand.empfaengerBenutzerId === null || posten.length === 0) throw new Error('Versand braucht Empfänger und Posten');
    const lauf = s.erinnerungLaeufe.find((l) => l.id === versand.laufId && l.laufDatum === versand.laufDatum && l.status === 'laeuft');
    if (!lauf) throw new Error('Kein laufender Lauf für dieses Datum');
    const m = this.aktivesMitglied(versand.organisationId, versand.empfaengerBenutzerId);
    if (!m || MAIL_ART_FUER_ROLLE[m.rolle] !== versand.art) throw new Error('Empfänger ist kein aktives Mitglied mit passender Rolle');
    for (const p of posten) {
      const g = s.geraete.find((x) => x.id === p.geraetId);
      if (!g || g.organisationId !== versand.organisationId) throw new Error('Posten gehören zu einer anderen Organisation');
    }
    const konflikt = s.mailVersand.some(
      (v) =>
        v.organisationId === versand.organisationId &&
        v.empfaengerBenutzerId === versand.empfaengerBenutzerId &&
        v.laufDatum === versand.laufDatum,
    );
    if (konflikt) return false;
    s.mailVersand.push(kopie({ ...versand, status: 'vorbereitet' as const, versuche: 0, postenAnzahl: posten.length }));
    s.erinnerungPosten.push(
      ...posten.map((p) =>
        kopie({ ...p, organisationId: versand.organisationId, versandId: versand.id, empfaengerBenutzerId: versand.empfaengerBenutzerId }),
      ),
    );
    return true;
  }

  async setzeVersandStatus(d: Parameters<ErinnerungsSystemRepository['setzeVersandStatus']>[0]): Promise<void> {
    const v = this.stand.mailVersand.find((x) => x.id === d.versandId);
    if (!v) throw new Error('Versand nicht gefunden');
    if (!versandUebergangErlaubt(v.status, d.status)) throw new Error(`Statusübergang ${v.status} → ${d.status} nicht erlaubt`);
    if (d.versuche < v.versuche || d.versuche > 3) throw new Error('Versuche ungültig');
    if (v.anbieterId !== null && d.anbieterId !== null && d.anbieterId !== v.anbieterId) throw new Error('Anbieter-ID ist unveränderlich');
    v.status = d.status;
    v.versuche = d.versuche;
    v.anbieterId = d.anbieterId ?? v.anbieterId;
    v.fehlerCode = d.fehlerCode;
    if (d.status === 'versendet' || d.status === 'vorschau') v.versendetAm = d.jetzt;
    v.statusAm = d.jetzt;
  }

  async setzeStatusPerAnbieterId({ anbieterId, status, jetzt }: Parameters<ErinnerungsSystemRepository['setzeStatusPerAnbieterId']>[0]) {
    const v = this.stand.mailVersand.find((x) => x.anbieterId === anbieterId);
    if (!v || v.status === status || !versandUebergangErlaubt(v.status, status)) return false;
    v.status = status;
    v.statusAm = jetzt;
    return true;
  }

  private passendeRolle(organisationId: Id, benutzerId: Id, art: AbbestellbareMailArt): boolean {
    const m = this.aktivesMitglied(organisationId, benutzerId);
    return m !== null && MAIL_ART_FUER_ROLLE[m.rolle] === art;
  }

  async holeAbmeldeKontext({ organisationId, benutzerId, art }: Parameters<ErinnerungsSystemRepository['holeAbmeldeKontext']>[0]) {
    if (!this.passendeRolle(organisationId, benutzerId, art)) return null;
    const org = this.stand.organisationen.find((o) => o.id === organisationId);
    if (!org) return null;
    const a = this.stand.mailAbmeldungen.find((x) => x.organisationId === organisationId && x.benutzerId === benutzerId && x.art === art);
    return { organisationName: org.name, abgemeldet: a?.abgemeldet ?? false };
  }

  async setzeAbmeldungSystem(d: Parameters<ErinnerungsSystemRepository['setzeAbmeldungSystem']>[0]): Promise<boolean> {
    if (!this.passendeRolle(d.organisationId, d.benutzerId, d.art)) return false;
    setzeAbmeldung(this.stand, d);
    return true;
  }

  /** F-41: Empfänger von MA-Hinweisen nach 90 Tagen entfernen (Versand und Posten). */
  async pseudonymisiereMaHinweise(jetzt: Date): Promise<void> {
    const grenze = jetzt.getTime() - MA_HINWEIS_AUFBEWAHRUNG_TAGE * TAG_MS;
    for (const v of this.stand.mailVersand) {
      if (v.art === 'ma_hinweis' && v.empfaengerBenutzerId !== null && new Date(v.erstelltAm).getTime() < grenze) v.empfaengerBenutzerId = null;
    }
    for (const p of this.stand.erinnerungPosten) {
      if (p.art === 'ma_hinweis' && p.empfaengerBenutzerId !== null && new Date(p.erstelltAm).getTime() < grenze) p.empfaengerBenutzerId = null;
    }
  }
}
