// Dienste I3 (BE-25, §9.9): Einstellungen je Bereich (F-39), eigene Benachrichtigungen und Abmeldung (F-40),
// Versandprotokoll mit Maskierung (F-41), Abmeldeseite per Token (F-40/F-43), Mail-Vorschau (F-37).
// Rein serverseitig, ohne Next-Abhängigkeit; testbar mit dem Demo-Repository.
import { addTage } from '@/domain/datum';
import { istStandard, standardEinstellung, stufeLabel } from '@/domain/erinnerungen';
import { can, darfAbbestellen } from '@/domain/rechte';
import type { ErinnerungEinstellungEingabe } from '@/domain/schemas';
import {
  ABBESTELLBARE_MAIL_ARTEN,
  MAIL_ART_BESCHREIBUNG,
  MAIL_ART_FUER_ROLLE,
  MAIL_ART_LABEL,
  PFLICHTMAIL_BEGRUENDUNG,
  PROTOKOLL_PRO_SEITE,
  VERSAND_PROBLEME,
  type AbbestellbareMailArt,
  type AbmeldeSeite,
  type ActionState,
  type Bereich,
  type BereichsRegel,
  type Benutzer,
  type EigeneBenachrichtigungen,
  type ErinnerungEinstellung,
  type ErinnerungEinstellungAnsicht,
  type Id,
  type IsoDate,
  type MailModus,
  type MailVorschauSeite,
  type Mitgliedschaft,
  type PersonOption,
  type ProtokollEintrag,
  type ProtokollFilter,
  type ProtokollSeite,
  type Rolle,
  type Sitzung,
} from '@/domain/types';
import { neuesEreignis } from './dienste-basis';
import { pruefeAbmeldeToken } from './mail/abmelden';
import { listeVorschauMails } from './mail/vorschau';
import type { ErinnerungsSystemRepository, Repository, WirksamerProtokollFilter } from './repo/types';

export const WARNUNG_OHNE_VER = 'Kein aktiver Verantwortlicher – Erinnerungen gehen an die Sifa.';
export const WARNUNG_OHNE_VER_UND_SIF = 'Kein aktiver Verantwortlicher und keine aktive Sifa – Erinnerungen gehen an die Admins.';
export const WARNUNG_OHNE_SIF = 'Keine aktive Sifa – Eskalationen an die Sifa gehen an die Admins.';
export const WARNUNG_SIF_AUSWAHL = 'Ausgewählte Sifa nicht mehr aktiv – Erinnerungen gehen an alle aktiven Sifa.';
export const WARNUNG_ADM_AUSWAHL = 'Ausgewählte Admins nicht mehr aktiv – Eskalationen gehen an alle aktiven Admins.';
export const MELDUNG_UNGUELTIGER_LINK = 'Dieser Link ist nicht gültig.';

const keinRecht: ActionState = { status: 'fehler', meldung: 'Keine Berechtigung.' };

// ---------------------------------------------------------------------------
// Einstellungen je Bereich (F-39)
// ---------------------------------------------------------------------------

interface Personen {
  mitglieder: Mitgliedschaft[];
  name: Map<Id, string>;
}

function optionen(p: Personen, rolle: Rolle, bereichId?: Id): PersonOption[] {
  return p.mitglieder
    .filter((m) => m.aktiv && m.rolle === rolle && (bereichId === undefined || m.bereichIds.includes(bereichId)))
    .map((m) => ({ benutzerId: m.benutzerId, name: p.name.get(m.benutzerId) ?? '', rolle: m.rolle }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de') || a.benutzerId.localeCompare(b.benutzerId));
}

function ansichtAus(bereich: Bereich, gespeichert: ErinnerungEinstellung | undefined, p: Personen): ErinnerungEinstellungAnsicht {
  const einstellung = gespeichert ?? standardEinstellung(bereich.organisationId, bereich.id);
  const verantwortliche = optionen(p, 'verantwortlicher', bereich.id);
  const sifaOptionen = optionen(p, 'sifa');
  const adminOptionen = optionen(p, 'admin');
  const warnungen: string[] = [];
  if (verantwortliche.length === 0) warnungen.push(sifaOptionen.length > 0 ? WARNUNG_OHNE_VER : WARNUNG_OHNE_VER_UND_SIF);
  if (sifaOptionen.length === 0) warnungen.push(WARNUNG_OHNE_SIF);
  const aktiv = (ids: Id[] | null, opt: PersonOption[]) => ids === null || ids.some((id) => opt.some((o) => o.benutzerId === id));
  if (sifaOptionen.length > 0 && !aktiv(einstellung.sifaEmpfaengerIds, sifaOptionen)) warnungen.push(WARNUNG_SIF_AUSWAHL);
  if (adminOptionen.length > 0 && !aktiv(einstellung.adminEmpfaengerIds, adminOptionen)) warnungen.push(WARNUNG_ADM_AUSWAHL);
  return { bereich, einstellung, verantwortliche, sifaOptionen, adminOptionen, warnungen };
}

async function ladePersonen(repo: Repository, org: Id): Promise<Personen> {
  const [mitglieder, benutzer] = await Promise.all([repo.listeMitgliedschaften(org), repo.listeBenutzer(org)]);
  return { mitglieder: mitglieder.filter((m) => m.organisationId === org), name: new Map(benutzer.map((b: Benutzer) => [b.id, b.name])) };
}

export async function listeErinnerungEinstellungen(sitzung: Sitzung, repo: Repository): Promise<ErinnerungEinstellungAnsicht[]> {
  if (!can(sitzung.rolle, 'erinnerung.einstellen')) return [];
  const org = sitzung.organisation.id;
  const [bereiche, einstellungen, personen] = await Promise.all([repo.listeBereiche(org), repo.listeErinnerungEinstellungen(org), ladePersonen(repo, org)]);
  return bereiche
    .filter((b) => b.organisationId === org)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .map((b) => ansichtAus(b, einstellungen.find((e) => e.bereichId === b.id), personen));
}

export async function holeErinnerungEinstellung(sitzung: Sitzung, repo: Repository, bereichId: Id): Promise<ErinnerungEinstellungAnsicht | null> {
  if (!can(sitzung.rolle, 'erinnerung.einstellen')) return null;
  const org = sitzung.organisation.id;
  const [bereiche, einstellungen, personen] = await Promise.all([repo.listeBereiche(org), repo.listeErinnerungEinstellungen(org), ladePersonen(repo, org)]);
  const bereich = bereiche.find((b) => b.id === bereichId && b.organisationId === org);
  if (!bereich) return null;
  return ansichtAus(bereich, einstellungen.find((e) => e.bereichId === bereichId), personen);
}

/** F-39: 'standard' setzt auf Standardwerte zurück. Auswahl nur aktive Mitglieder der Rolle; 'alle' speichert null. */
export async function speichereErinnerungEinstellung(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: ErinnerungEinstellungEingabe | 'standard',
  bereichId: Id,
  jetzt: Date,
): Promise<ActionState> {
  if (!can(sitzung.rolle, 'erinnerung.einstellen')) return keinRecht;
  const org = sitzung.organisation.id;
  const [bereiche, einstellungen, personen] = await Promise.all([repo.listeBereiche(org), repo.listeErinnerungEinstellungen(org), ladePersonen(repo, org)]);
  const bereich = bereiche.find((b) => b.id === bereichId && b.organisationId === org);
  if (!bereich) return { status: 'fehler', meldung: 'Bereich nicht gefunden.' };

  let werte: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage' | 'sifaInKopie' | 'sifaEmpfaengerIds' | 'adminEmpfaengerIds'>;
  if (eingabe === 'standard') {
    werte = standardEinstellung(org, bereichId);
  } else {
    if (eingabe.bereichId !== bereichId) return { status: 'fehler', meldung: 'Bereich passt nicht zum Formular.' };
    const auswahl = (ids: Id[], rolle: Rolle) => {
      const erlaubt = new Set(optionen(personen, rolle).map((o) => o.benutzerId));
      const eindeutig = [...new Set(ids)].sort();
      return { ids: eindeutig, ungueltig: eindeutig.some((id) => !erlaubt.has(id)) };
    };
    const sifa = auswahl(eingabe.sifaEmpfaenger, 'sifa');
    const admin = auswahl(eingabe.adminEmpfaenger, 'admin');
    const feldfehler: Partial<Record<string, string[]>> = {};
    if (eingabe.sifaAuswahl === 'auswahl' && sifa.ungueltig) feldfehler.sifaEmpfaenger = ['Nur aktive Sifa dieses Betriebs auswählbar.'];
    if (eingabe.adminAuswahl === 'auswahl' && admin.ungueltig) feldfehler.adminEmpfaenger = ['Nur aktive Admins dieses Betriebs auswählbar.'];
    if (Object.keys(feldfehler).length > 0) return { status: 'fehler', meldung: 'Bitte die markierten Felder prüfen.', feldfehler };
    werte = {
      staffelTage: [...eingabe.staffel].sort((a, b) => b - a),
      eskalationTage: { verantwortlicher: eingabe.eskalationVerantwortlicher, sifa: eingabe.eskalationSifa, admin: eingabe.eskalationAdmin },
      sifaInKopie: eingabe.sifaInKopie,
      sifaEmpfaengerIds: eingabe.sifaAuswahl === 'alle' ? null : sifa.ids,
      adminEmpfaengerIds: eingabe.adminAuswahl === 'alle' ? null : admin.ids,
    };
  }
  const alt = einstellungen.find((e) => e.bereichId === bereichId) ?? null;
  const neu: ErinnerungEinstellung = {
    organisationId: org,
    bereichId,
    ...werte,
    staffelTage: [...werte.staffelTage],
    eskalationTage: { ...werte.eskalationTage },
    standard: istStandard(werte),
    geaendertVon: sitzung.benutzer.id,
    geaendertVonName: sitzung.benutzer.name,
    geaendertAm: jetzt.toISOString(),
  };
  const ereignis = neuesEreignis(sitzung, null, 'erinnerung_einstellung_gespeichert', { bereichId, bereich: bereich.name, alt, neu }, jetzt);
  await repo.speichereErinnerungEinstellung({ einstellung: neu, ereignis });
  return { status: 'ok', meldung: eingabe === 'standard' ? 'Auf Standard zurückgesetzt' : 'Erinnerungen gespeichert', id: bereichId };
}

// ---------------------------------------------------------------------------
// Eigene Benachrichtigungen und Abmeldung (F-40)
// ---------------------------------------------------------------------------

export async function holeEigeneBenachrichtigungen(sitzung: Sitzung, repo: Repository, modus: MailModus): Promise<EigeneBenachrichtigungen> {
  const org = sitzung.organisation.id;
  const art = MAIL_ART_FUER_ROLLE[sitzung.rolle];
  const abbestellbar = (ABBESTELLBARE_MAIL_ARTEN as readonly string[]).includes(art);
  const abmeldungen = abbestellbar ? await repo.listeEigeneAbmeldungen(org, sitzung.benutzer.id) : [];

  let bereichsRegeln: BereichsRegel[] = [];
  if (sitzung.rolle === 'admin' || sitzung.rolle === 'sifa' || sitzung.rolle === 'verantwortlicher') {
    const [bereiche, einstellungen] = await Promise.all([repo.listeBereiche(org), repo.listeErinnerungEinstellungen(org)]);
    bereichsRegeln = bereiche
      .filter((b) => b.organisationId === org && (sitzung.rolle !== 'verantwortlicher' || sitzung.bereichIds.includes(b.id)))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map((b) => {
        const e = einstellungen.find((x) => x.bereichId === b.id) ?? standardEinstellung(org, b.id);
        return {
          bereichName: b.name,
          staffelTage: [...e.staffelTage],
          eskalationTage: { ...e.eskalationTage },
          sifaInKopie: e.sifaInKopie,
          standard: e.standard,
        };
      });
  }
  return {
    organisationName: sitzung.organisation.name,
    email: sitzung.benutzer.email,
    rolle: sitzung.rolle,
    benachrichtigung: {
      art,
      label: MAIL_ART_LABEL[art],
      beschreibung: MAIL_ART_BESCHREIBUNG[art],
      abbestellbar,
      abgemeldet: abbestellbar && abmeldungen.includes(art as AbbestellbareMailArt),
      pflichtBegruendung: abbestellbar ? null : PFLICHTMAIL_BEGRUENDUNG,
    },
    bereichsRegeln,
    mailModus: modus,
  };
}

export async function setzeBenachrichtigung(
  sitzung: Sitzung,
  repo: Repository,
  art: AbbestellbareMailArt,
  abgemeldet: boolean,
  jetzt: Date,
): Promise<ActionState> {
  if (!can(sitzung.rolle, 'benachrichtigung.eigene') || !darfAbbestellen(sitzung.rolle, art)) {
    return { status: 'fehler', meldung: 'Diese Mail kann nicht abbestellt werden.' };
  }
  await repo.setzeEigeneAbmeldung({ organisationId: sitzung.organisation.id, benutzerId: sitzung.benutzer.id, art, abgemeldet, jetzt: jetzt.toISOString() });
  return { status: 'ok', meldung: abgemeldet ? 'Abbestellt' : 'Wieder bestellt' };
}

// ---------------------------------------------------------------------------
// Versandprotokoll (F-41): Maskierung im Dienst (Supabase zusätzlich im RPC)
// ---------------------------------------------------------------------------

export function wirksamerProtokollFilter(heute: IsoDate, filter: ProtokollFilter): WirksamerProtokollFilter {
  const bis = filter.bis ?? heute;
  const von = filter.von ?? addTage(bis, -30);
  return {
    von: von <= bis ? von : bis,
    bis: von <= bis ? bis : von,
    seite: filter.seite ?? 1,
    ...(filter.status !== undefined ? { status: filter.status } : {}),
    ...(filter.art !== undefined ? { art: filter.art } : {}),
    ...(filter.bereichId !== undefined ? { bereichId: filter.bereichId } : {}),
  };
}

export async function listeMailProtokoll(
  sitzung: Sitzung,
  repo: Repository,
  heute: IsoDate,
  filter: ProtokollFilter,
  modus: MailModus,
): Promise<ProtokollSeite> {
  if (!can(sitzung.rolle, 'erinnerung.protokoll')) throw new Error('Keine Berechtigung für das Versandprotokoll');
  const org = sitzung.organisation.id;
  const wirksam = wirksamerProtokollFilter(heute, filter);
  const [roh, geraete, pruefarten, bereiche] = await Promise.all([
    repo.listeMailProtokoll(org, wirksam),
    repo.listeGeraete(org),
    repo.listePruefarten(org),
    repo.listeBereiche(org),
  ]);
  const geraet = new Map(geraete.map((g) => [g.id, g]));
  const pruefart = new Map(pruefarten.map((p) => [p.id, p.bezeichnung]));
  const bereich = new Map(bereiche.map((b) => [b.id, b.name]));

  const eintraege: ProtokollEintrag[] = roh.versand
    .filter((v) => v.organisationId === org)
    .map((v) => {
      const ma = v.art === 'ma_hinweis';
      const nameSichtbar = !ma || VERSAND_PROBLEME.includes(v.status);
      return {
        versandId: v.id,
        laufDatum: v.laufDatum,
        art: v.art,
        status: v.status,
        statusAm: v.statusAm,
        versuche: v.versuche,
        fehlerCode: v.fehlerCode,
        empfaenger:
          nameSichtbar && v.empfaengerBenutzerId !== null && v.empfaengerName && v.empfaengerRolle
            ? { name: v.empfaengerName, rolle: v.empfaengerRolle }
            : null,
        postenAnzahl: v.postenAnzahl,
        posten: ma
          ? []
          : roh.posten
              .filter((p) => p.versandId === v.id && p.art !== 'ma_hinweis')
              .map((p) => {
                const g = geraet.get(p.geraetId);
                return {
                  geraetId: p.geraetId,
                  geraetBezeichnung: g?.bezeichnung ?? '',
                  inventarnummer: g?.inventarnummer ?? null,
                  bereichName: bereich.get(p.bereichId) ?? '',
                  pruefartBezeichnung: p.geraetPruefartId ? (pruefart.get(p.geraetPruefartId) ?? null) : null,
                  stufe: p.stufe,
                  stufeLabel: stufeLabel(p.stufe),
                  faelligAm: p.art === 'frist' ? p.bezugDatum : null,
                  rolle: p.rolle,
                };
              }),
      };
    });
  return {
    eintraege,
    gesamt: roh.gesamt,
    seite: wirksam.seite ?? 1,
    proSeite: PROTOKOLL_PRO_SEITE,
    filter: wirksam,
    letzterLauf: roh.letzterLauf,
    mailModus: modus,
  };
}

// ---------------------------------------------------------------------------
// Mail-Vorschau (F-37) – nur Mails der aktuellen Organisation
// ---------------------------------------------------------------------------

export function mailVorschauSeite(sitzung: Sitzung, heute: IsoDate, datumWaehlbar: boolean): MailVorschauSeite {
  if (!can(sitzung.rolle, 'mail.vorschau')) throw new Error('Keine Berechtigung für die Mail-Vorschau');
  return { mails: listeVorschauMails(sitzung.organisation.name), heute, datumWaehlbar };
}

// ---------------------------------------------------------------------------
// Abmeldung per Token ohne Sitzung (F-40, F-43)
// ---------------------------------------------------------------------------

export async function holeAbmeldeSeite(system: ErinnerungsSystemRepository, token: string): Promise<AbmeldeSeite | null> {
  const d = pruefeAbmeldeToken(token);
  if (!d) return null;
  const kontext = await system.holeAbmeldeKontext(d);
  if (!kontext) return null;
  return { token, organisationName: kontext.organisationName, art: d.art, artLabel: MAIL_ART_LABEL[d.art], abgemeldet: kontext.abgemeldet };
}

export async function abmeldenPerToken(
  system: ErinnerungsSystemRepository,
  token: string,
  abgemeldet: boolean,
  jetzt: Date,
): Promise<ActionState> {
  const d = pruefeAbmeldeToken(token);
  if (!d) return { status: 'fehler', meldung: MELDUNG_UNGUELTIGER_LINK };
  const ok = await system.setzeAbmeldungSystem({ ...d, abgemeldet, jetzt: jetzt.toISOString() });
  if (!ok) return { status: 'fehler', meldung: MELDUNG_UNGUELTIGER_LINK };
  return { status: 'ok', meldung: abgemeldet ? 'Sie erhalten diese Mails nicht mehr.' : 'Sie erhalten diese Mails wieder.' };
}
