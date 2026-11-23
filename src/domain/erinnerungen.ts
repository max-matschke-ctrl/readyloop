// Vertrag §9.4 – E-Mail-Erinnerungen (F-30 bis F-35). Rein und deterministisch, ohne Framework-Abhängigkeit,
// ohne Date.now(): „heute“ kommt immer als Parameter.
import { isoWocheMontag } from './datum';
import { prueferGruppe, VORLAUF_TAGE } from './status';
import {
  ABBESTELLBARE_MAIL_ARTEN,
  DRINGLICHKEITEN,
  ERINNERUNG_STAFFEL_STANDARD,
  ESKALATION_STANDARD,
  ESKALATIONS_EBENEN,
  MAIL_ART_FUER_ROLLE,
  STAFFEL_MAX_TAGE,
  type AbbestellbareMailArt,
  type Betriebsstatus,
  type Bereich,
  type Dringlichkeit,
  type EskalationsEbene,
  type ErinnerungEinstellung,
  type ErinnerungStufe,
  type FristStatus,
  type GeraeteKategorie,
  type Id,
  type IsoDate,
  type MailArt,
  type Nutzung,
  type OeffentlicheFrist,
  type PostenArt,
  type PostenRolle,
  type Rolle,
  type StatusErgebnis,
  type VorNutzungGrund,
} from './types';

// ---------- Einstellungen ----------

export function standardEinstellung(organisationId: Id, bereichId: Id): ErinnerungEinstellung {
  return {
    organisationId,
    bereichId,
    staffelTage: [...ERINNERUNG_STAFFEL_STANDARD],
    eskalationTage: { ...ESKALATION_STANDARD },
    sifaInKopie: true,
    sifaEmpfaengerIds: null,
    adminEmpfaengerIds: null,
    standard: true,
    geaendertVon: null,
    geaendertVonName: null,
    geaendertAm: null,
  };
}

export function istStandard(
  e: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage' | 'sifaInKopie' | 'sifaEmpfaengerIds' | 'adminEmpfaengerIds'>,
): boolean {
  const staffel = [...e.staffelTage].sort((a, b) => b - a);
  return (
    staffel.length === ERINNERUNG_STAFFEL_STANDARD.length &&
    staffel.every((w, i) => w === ERINNERUNG_STAFFEL_STANDARD[i]) &&
    ESKALATIONS_EBENEN.every((ebene) => e.eskalationTage[ebene] === ESKALATION_STANDARD[ebene]) &&
    e.sifaInKopie === true &&
    e.sifaEmpfaengerIds === null &&
    e.adminEmpfaengerIds === null
  );
}

// ---------- Stufen ----------

const ESKALATION_RANG: Record<EskalationsEbene, number> = { verantwortlicher: 1001, sifa: 1002, admin: 1003 };

export function stufeCode(s: ErinnerungStufe): string {
  return s.art === 'vorlauf' ? `v${s.tage}` : `e_${s.ebene}`;
}

export function stufeAusCode(code: string): ErinnerungStufe | null {
  const v = /^v([1-9]\d{0,2})$/.exec(code);
  if (v) {
    const tage = Number(v[1]);
    return tage <= STAFFEL_MAX_TAGE ? { art: 'vorlauf', tage } : null;
  }
  const e = /^e_(\w+)$/.exec(code);
  if (e && (ESKALATIONS_EBENEN as readonly string[]).includes(e[1])) return { art: 'eskalation', ebene: e[1] as EskalationsEbene };
  return null;
}

/** Dringlicher = größer. vorlauf: −tage; e_verantwortlicher 1001, e_sifa 1002, e_admin 1003; 'woche'/'nicht_verwenden' 0.
 *  Unbekannte Codes: −Infinity (nie dringlicher als etwas Bekanntes). */
export function stufeRang(code: string): number {
  if (code === 'woche' || code === 'nicht_verwenden') return 0;
  const s = stufeAusCode(code);
  if (!s) return Number.NEGATIVE_INFINITY;
  return s.art === 'vorlauf' ? -s.tage : ESKALATION_RANG[s.ebene];
}

/** 'v90' → 'Vorlauf 90 Tage'; 'e_verantwortlicher' → 'Fällig – an Verantwortliche'; 'e_sifa' → 'Eskaliert an Sifa';
 *  'e_admin' → 'Eskaliert an Admin/Geschäftsführung'; 'woche' → 'Wochenübersicht'; 'nicht_verwenden' → 'Hinweis „Nicht verwenden“'. */
export function stufeLabel(code: string): string {
  switch (code) {
    case 'e_verantwortlicher':
      return 'Fällig – an Verantwortliche';
    case 'e_sifa':
      return 'Eskaliert an Sifa';
    case 'e_admin':
      return 'Eskaliert an Admin/Geschäftsführung';
    case 'woche':
      return 'Wochenübersicht';
    case 'nicht_verwenden':
      return 'Hinweis „Nicht verwenden“';
  }
  const s = stufeAusCode(code);
  if (s?.art === 'vorlauf') return `Vorlauf ${s.tage} Tage`;
  return code;
}

/** F-31/F-32: dringlichste erreichte Stufe oder null. r ≥ 1 → Vorlauf; r ≤ 0 → Eskalation mit u = −r. */
export function faelligeStufe(
  restTage: number,
  e: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage'>,
): ErinnerungStufe | null {
  if (restTage >= 1) {
    const erreicht = e.staffelTage.filter((s) => restTage <= s);
    if (erreicht.length === 0) return null;
    return { art: 'vorlauf', tage: Math.min(...erreicht) };
  }
  const u = -restTage;
  for (const ebene of [...ESKALATIONS_EBENEN].reverse()) {
    if (u >= e.eskalationTage[ebene]) return { art: 'eskalation', ebene };
  }
  return null;
}

/** F-38. status 'vor_nutzung_pruefen' → 'nicht_verwenden'; r < 0 → 'ueberfaellig'; 0 → 'heute_faellig';
 *  1–30 → 'bald_faellig'; > 30 → 'vorlauf'; restTage null → 'ohne_termin'. */
export function dringlichkeitAus(status: Pick<StatusErgebnis, 'status' | 'restTage'>): Dringlichkeit {
  if (status.status === 'vor_nutzung_pruefen') return 'nicht_verwenden';
  const r = status.restTage;
  if (r === null) return 'ohne_termin';
  if (r < 0) return 'ueberfaellig';
  if (r === 0) return 'heute_faellig';
  if (r <= VORLAUF_TAGE) return 'bald_faellig';
  return 'vorlauf';
}

/** F-35: null, wenn nutzung ≠ 'nicht_verwenden'. Erste zutreffende Regel. */
export function zustandsKennung(e: {
  nutzung: Nutzung;
  betriebsstatus: Betriebsstatus;
  letztesBetriebsstatusEreignisId: Id | null;
  gesamtStatus: FristStatus;
  gesamtStatusGrund: VorNutzungGrund | null;
  fruehestesUeberschrittenesFaelligAm: IsoDate | null;
  aeltesterGefaehrlicherMangelId: Id | null;
  aeltesterOffenerAnlassId: Id | null;
  letzterNichtBestandenNachweisId: Id | null;
}): string | null {
  if (e.nutzung !== 'nicht_verwenden') return null;
  if (e.betriebsstatus !== 'in_betrieb') return `ausser_betrieb:${e.letztesBetriebsstatusEreignisId ?? 'ohne'}`;
  if (e.gesamtStatus === 'ueberfaellig') return `ueberfaellig:${e.fruehestesUeberschrittenesFaelligAm ?? 'ohne'}`;
  if (e.gesamtStatus === 'vor_nutzung_pruefen') {
    switch (e.gesamtStatusGrund) {
      case 'gefaehrlicher_mangel':
        return `mangel:${e.aeltesterGefaehrlicherMangelId ?? 'ohne'}`;
      case 'anlass':
        return `anlass:${e.aeltesterOffenerAnlassId ?? 'ohne'}`;
      case 'nicht_bestanden':
        return `nicht_bestanden:${e.letzterNichtBestandenNachweisId ?? 'ohne'}`;
      case 'ausser_betrieb':
        return `ausser_betrieb:${e.letztesBetriebsstatusEreignisId ?? 'ohne'}`;
      case null:
        return 'vor_nutzung_pruefen:ohne';
    }
  }
  return `${e.gesamtStatus}:ohne`;
}

/** F-33 */
export function postenSchluessel(
  p:
    | { art: 'frist'; geraetPruefartId: Id; stufe: string; faelligAm: IsoDate; empfaengerId: Id }
    | { art: 'pruefer_woche'; geraetPruefartId: Id; montag: IsoDate; empfaengerId: Id }
    | { art: 'ma_hinweis'; geraetId: Id; zustandsKennung: string; empfaengerId: Id },
): string {
  switch (p.art) {
    case 'frist':
      return `frist:${p.geraetPruefartId}:${p.stufe}:${p.faelligAm}:${p.empfaengerId}`;
    case 'pruefer_woche':
      return `pruefer:${p.geraetPruefartId}:woche:${p.montag}:${p.empfaengerId}`;
    case 'ma_hinweis':
      return `ma:${p.geraetId}:${p.zustandsKennung}:${p.empfaengerId}`;
  }
}

// ---------- Plan (rein) ----------

export interface PlanMitglied {
  benutzerId: Id;
  name: string; // nur für Protokoll/Tests – NIE im Mailinhalt
  email: string;
  rolle: Rolle;
  bereichIds: Id[]; // nur verantwortlicher
}

export interface PlanPruefart {
  geraetPruefartId: Id;
  geraetId: Id;
  bereichId: Id;
  geraetBezeichnung: string;
  inventarnummer: string | null;
  pruefartBezeichnung: string;
  betriebsstatus: Betriebsstatus;
  status: StatusErgebnis; // F-9 im Kontext
  frist: OeffentlicheFrist | null; // nur freigegebene Frist
  zugewiesenerPrueferId: Id | null;
  katalogEntwurf: boolean; // katalogSchluessel gesetzt und kein freigegebener Eintrag dieses Schlüssels
}

export interface PlanMaGeraet {
  geraetId: Id;
  bereichId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  kategorie: GeraeteKategorie;
  zugeordnetAn: Id | null; // aktives MA-Mitglied
  uebernommenVon: Id | null; // Benutzer-ID der offenen Übernahme (aktives MA-Mitglied)
  nutzung: Nutzung;
  grundText: string; // 'Überfällig', 'Gefährlicher Mangel offen', 'Außer Betrieb', …
  zustandsKennung: string | null;
}

export interface BisherigerPosten {
  art: PostenArt;
  stufe: string;
  geraetId: Id;
  geraetPruefartId: Id | null;
  bezugDatum: IsoDate | null;
  empfaengerBenutzerId: Id;
  schluessel: string;
}

export interface PlanEingabe {
  heute: IsoDate;
  organisationId: Id;
  bereiche: Pick<Bereich, 'id' | 'name'>[];
  einstellungen: ErinnerungEinstellung[]; // fehlende Bereiche → standardEinstellung
  mitglieder: PlanMitglied[]; // nur aktive
  pruefarten: PlanPruefart[];
  maGeraete: PlanMaGeraet[]; // nur Geräte mit Halter
  abmeldungen: { benutzerId: Id; art: AbbestellbareMailArt }[]; // nur abgemeldet = true
  bisherige: BisherigerPosten[]; // nur Posten mit Versandstatus in VERSAND_ERFOLGREICH
}

export interface PostenPlan {
  schluessel: string;
  art: PostenArt;
  stufe: string;
  rolle: PostenRolle;
  dringlichkeit: Dringlichkeit;
  geraetId: Id;
  geraetPruefartId: Id | null;
  bereichId: Id;
  bereichName: string;
  geraetBezeichnung: string;
  inventarnummer: string | null;
  pruefartBezeichnung: string | null;
  bezugDatum: IsoDate | null;
  faelligAm: IsoDate | null;
  restTage: number | null;
  status: FristStatus | null; // null bei ma_hinweis
  frist: OeffentlicheFrist | null;
  hinweise: string[]; // stufeLabel bei Eskalation, 'Bereich ohne Verantwortlichen', Nutzungsgrund, 'Bitte zurückgeben'
  katalogEntwurf: boolean;
  pfad: string; // relativ: `/geraete/${geraetId}` | '/pruefer' | '/meine-geraete'
}

export interface DigestPlan {
  art: MailArt;
  empfaenger: PlanMitglied;
  posten: PostenPlan[]; // DRINGLICHKEITEN, dann faelligAm (null zuletzt), bereichName, geraetBezeichnung, pruefartBezeichnung
  abbestellbar: boolean;
}

export const HINWEIS_OHNE_VERANTWORTLICHEN = 'Bereich ohne Verantwortlichen';
export const HINWEIS_ZURUECKGEBEN = 'Bitte zurückgeben';

const vergleich = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const textVergleich = (a: string | null, b: string | null) => (a ?? '').localeCompare(b ?? '', 'de') || vergleich(a ?? '', b ?? '');

/** DRINGLICHKEITEN, dann faelligAm (null zuletzt), bereichName, geraetBezeichnung, pruefartBezeichnung, Schlüssel. */
export function vergleichePosten(a: PostenPlan, b: PostenPlan): number {
  const d = DRINGLICHKEITEN.indexOf(a.dringlichkeit) - DRINGLICHKEITEN.indexOf(b.dringlichkeit);
  if (d !== 0) return d;
  if (a.faelligAm !== b.faelligAm) {
    if (a.faelligAm === null) return 1;
    if (b.faelligAm === null) return -1;
    return vergleich(a.faelligAm, b.faelligAm);
  }
  return (
    textVergleich(a.bereichName, b.bereichName) ||
    textVergleich(a.geraetBezeichnung, b.geraetBezeichnung) ||
    textVergleich(a.pruefartBezeichnung, b.pruefartBezeichnung) ||
    vergleich(a.schluessel, b.schluessel)
  );
}

/** Ausgewählte aktive Personen; nicht mehr aktive werden ignoriert; leer → alle aktiven der Rolle (F-33). */
function waehle(alle: PlanMitglied[], auswahl: Id[] | null): PlanMitglied[] {
  if (auswahl === null) return alle;
  const gewaehlt = alle.filter((m) => auswahl.includes(m.benutzerId));
  return gewaehlt.length > 0 ? gewaehlt : alle;
}

/** F-30 bis F-35. Deterministisch; höchstens ein Digest je Empfänger; Digests nach benutzerId sortiert; ohne Posten kein Digest. */
export function planeErinnerungen(eingabe: PlanEingabe): DigestPlan[] {
  const { heute } = eingabe;
  const mitglieder = [...eingabe.mitglieder].sort((a, b) => vergleich(a.benutzerId, b.benutzerId));
  const mitgliedNachId = new Map(mitglieder.map((m) => [m.benutzerId, m]));
  const nachRolle = (rolle: Rolle) => mitglieder.filter((m) => m.rolle === rolle);
  const alleSifa = nachRolle('sifa');
  const alleAdmin = nachRolle('admin');
  const bereichName = new Map(eingabe.bereiche.map((b) => [b.id, b.name]));
  const einstellung = (bereichId: Id) =>
    eingabe.einstellungen.find((e) => e.bereichId === bereichId) ?? standardEinstellung(eingabe.organisationId, bereichId);
  const abgemeldet = new Set(eingabe.abmeldungen.map((a) => `${a.benutzerId}|${a.art}`));

  // Bereits erfolgreich gesendete Stufen je (Prüfart, Fälligkeit, Empfänger) und Schlüssel.
  const hoechsterRang = new Map<string, number>();
  const prueferWoche = new Set<Id>();
  const montag = isoWocheMontag(heute);
  const gesendeteSchluessel = new Set<string>();
  for (const b of eingabe.bisherige) {
    gesendeteSchluessel.add(b.schluessel);
    if (b.art === 'frist' && b.geraetPruefartId !== null && b.bezugDatum !== null) {
      const k = `${b.geraetPruefartId}|${b.bezugDatum}|${b.empfaengerBenutzerId}`;
      hoechsterRang.set(k, Math.max(hoechsterRang.get(k) ?? Number.NEGATIVE_INFINITY, stufeRang(b.stufe)));
    }
    if (b.art === 'pruefer_woche' && b.bezugDatum === montag) prueferWoche.add(b.empfaengerBenutzerId);
  }

  const posten = new Map<Id, Map<string, PostenPlan>>(); // Empfänger → Schlüssel → Posten
  const fuege = (empfaengerId: Id, p: PostenPlan) => {
    let eigene = posten.get(empfaengerId);
    if (!eigene) posten.set(empfaengerId, (eigene = new Map()));
    eigene.set(p.schluessel, p);
  };

  // ---- Fristerinnerungen (F-31, F-32, F-33)
  for (const pa of eingabe.pruefarten) {
    if (pa.betriebsstatus !== 'in_betrieb') continue;
    if (pa.status.restTage === null || pa.status.faelligAm === null) continue;
    const e = einstellung(pa.bereichId);
    const stufe = faelligeStufe(pa.status.restTage, e);
    if (!stufe) continue;
    const code = stufeCode(stufe);
    const rang = stufeRang(code);
    const faelligAm = pa.status.faelligAm;

    const ver = mitglieder.filter((m) => m.rolle === 'verantwortlicher' && m.bereichIds.includes(pa.bereichId));
    const sifa = waehle(alleSifa, e.sifaEmpfaengerIds);
    const admin = waehle(alleAdmin, e.adminEmpfaengerIds);
    const hinweise: string[] = [];
    let zustaendig: PlanMitglied[];
    let kopie: PlanMitglied[];
    if (stufe.art === 'vorlauf' || stufe.ebene === 'verantwortlicher') {
      if (ver.length > 0) {
        zustaendig = ver;
        kopie = e.sifaInKopie ? sifa : [];
      } else {
        zustaendig = sifa.length > 0 ? sifa : admin;
        kopie = [];
        hinweise.push(HINWEIS_OHNE_VERANTWORTLICHEN);
      }
    } else if (stufe.ebene === 'sifa') {
      zustaendig = sifa.length > 0 ? sifa : admin;
      kopie = ver;
    } else {
      zustaendig = admin;
      kopie = [...sifa, ...ver];
    }
    if (stufe.art === 'eskalation') hinweise.unshift(stufeLabel(code));

    const rollen = new Map<Id, PostenRolle>();
    for (const m of kopie) rollen.set(m.benutzerId, 'kopie');
    for (const m of zustaendig) rollen.set(m.benutzerId, 'zustaendig');
    for (const [empfaengerId, rolle] of rollen) {
      const bisher = hoechsterRang.get(`${pa.geraetPruefartId}|${faelligAm}|${empfaengerId}`) ?? Number.NEGATIVE_INFINITY;
      if (rang <= bisher) continue;
      fuege(empfaengerId, {
        schluessel: postenSchluessel({ art: 'frist', geraetPruefartId: pa.geraetPruefartId, stufe: code, faelligAm, empfaengerId }),
        art: 'frist',
        stufe: code,
        rolle,
        dringlichkeit: dringlichkeitAus(pa.status),
        geraetId: pa.geraetId,
        geraetPruefartId: pa.geraetPruefartId,
        bereichId: pa.bereichId,
        bereichName: bereichName.get(pa.bereichId) ?? '',
        geraetBezeichnung: pa.geraetBezeichnung,
        inventarnummer: pa.inventarnummer,
        pruefartBezeichnung: pa.pruefartBezeichnung,
        bezugDatum: faelligAm,
        faelligAm,
        restTage: pa.status.restTage,
        status: pa.status.status,
        frist: pa.frist,
        hinweise: [...hinweise],
        katalogEntwurf: pa.katalogEntwurf,
        pfad: `/geraete/${pa.geraetId}`,
      });
    }
  }

  // ---- Prüfer-Wochenübersicht (F-34)
  for (const prf of nachRolle('pruefer')) {
    if (prueferWoche.has(prf.benutzerId)) continue;
    if (abgemeldet.has(`${prf.benutzerId}|pruefer_woche`)) continue;
    for (const pa of eingabe.pruefarten) {
      if (pa.zugewiesenerPrueferId !== prf.benutzerId || prueferGruppe(pa.status.status) !== 'faellig') continue;
      fuege(prf.benutzerId, {
        schluessel: postenSchluessel({ art: 'pruefer_woche', geraetPruefartId: pa.geraetPruefartId, montag, empfaengerId: prf.benutzerId }),
        art: 'pruefer_woche',
        stufe: 'woche',
        rolle: 'zustaendig',
        dringlichkeit: dringlichkeitAus(pa.status),
        geraetId: pa.geraetId,
        geraetPruefartId: pa.geraetPruefartId,
        bereichId: pa.bereichId,
        bereichName: bereichName.get(pa.bereichId) ?? '',
        geraetBezeichnung: pa.geraetBezeichnung,
        inventarnummer: pa.inventarnummer,
        pruefartBezeichnung: pa.pruefartBezeichnung,
        bezugDatum: montag,
        faelligAm: pa.status.faelligAm,
        restTage: pa.status.restTage,
        status: pa.status.status,
        frist: pa.frist,
        hinweise: [],
        katalogEntwurf: pa.katalogEntwurf,
        pfad: '/pruefer',
      });
    }
  }

  // ---- Hinweis an Mitarbeiter (F-35): nur der Halter, einmal je Zustand
  for (const g of eingabe.maGeraete) {
    if (g.nutzung !== 'nicht_verwenden' || g.zustandsKennung === null) continue;
    const halter = new Map<Id, boolean>(); // Benutzer → übernommen
    if (g.zugeordnetAn !== null) halter.set(g.zugeordnetAn, false);
    if (g.uebernommenVon !== null) halter.set(g.uebernommenVon, true);
    for (const [benutzerId, uebernommen] of halter) {
      const ma = mitgliedNachId.get(benutzerId);
      if (!ma || ma.rolle !== 'mitarbeiter') continue;
      if (abgemeldet.has(`${benutzerId}|ma_hinweis`)) continue;
      const schluessel = postenSchluessel({ art: 'ma_hinweis', geraetId: g.geraetId, zustandsKennung: g.zustandsKennung, empfaengerId: benutzerId });
      if (gesendeteSchluessel.has(schluessel)) continue;
      fuege(benutzerId, {
        schluessel,
        art: 'ma_hinweis',
        stufe: 'nicht_verwenden',
        rolle: 'zustaendig',
        dringlichkeit: 'nicht_verwenden',
        geraetId: g.geraetId,
        geraetPruefartId: null,
        bereichId: g.bereichId,
        bereichName: bereichName.get(g.bereichId) ?? '',
        geraetBezeichnung: g.bezeichnung,
        inventarnummer: g.inventarnummer,
        pruefartBezeichnung: null,
        bezugDatum: null,
        faelligAm: null,
        restTage: null,
        status: null,
        frist: null,
        hinweise: uebernommen ? [g.grundText, HINWEIS_ZURUECKGEBEN] : [g.grundText],
        katalogEntwurf: false,
        pfad: '/meine-geraete',
      });
    }
  }

  // ---- Digests: je Empfänger höchstens einer (Rollen sind je Organisation exklusiv → eine Art)
  const digests: DigestPlan[] = [];
  for (const m of mitglieder) {
    const eigene = posten.get(m.benutzerId);
    if (!eigene || eigene.size === 0) continue;
    const art = MAIL_ART_FUER_ROLLE[m.rolle];
    digests.push({
      art,
      empfaenger: m,
      posten: [...eigene.values()].sort(vergleichePosten),
      abbestellbar: (ABBESTELLBARE_MAIL_ARTEN as readonly MailArt[]).includes(art),
    });
  }
  return digests;
}
