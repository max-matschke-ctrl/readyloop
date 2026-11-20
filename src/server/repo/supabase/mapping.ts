// Mapping Postgres (snake_case) ↔ Vertrag (BE-13). Reine Funktionen, ohne Supabase-Abhängigkeit.
import type {
  Anlass,
  Benutzer,
  Bereich,
  Ereignis,
  FestgelegteFrist,
  GbuDokument,
  Geraet,
  GeraetPruefart,
  GeraetToken,
  KatalogEintrag,
  Mangel,
  Mitgliedschaft,
  Nachweis,
  Organisation,
  Uebernahme,
} from '@/domain/types';
import type { KurzRohdaten, TokenRohdaten } from '../types';

// ---------- Zeilentypen (Spalten wie in den Migrationen) ----------

export interface OrganisationZeile { id: string; name: string; bg: string | null }
export interface BereichZeile { id: string; organisation_id: string; standort_id: string; name: string; einsatzort: Bereich['einsatzort'] }
export interface MitgliedschaftZeile {
  id: string;
  organisation_id: string;
  benutzer_id: string;
  anzeigename: string;
  email: string;
  rolle: Mitgliedschaft['rolle'];
  aktiv: boolean;
  pruefer_typen: Mitgliedschaft['prueferTypen'];
}
/** Lesbare Spalten für Mitglieder: email nur über RPC mitglied_emails (Admins, Befund I2-5). */
export type MitgliedschaftLeseZeile = Omit<MitgliedschaftZeile, 'email'>;
export interface KatalogZeile {
  id: string;
  schluessel: string;
  version: number;
  geraetegruppe: string;
  geraetegruppe_label: string;
  pruefart: string;
  einsatzort: KatalogEintrag['einsatzort'];
  intervall_monate: number | null;
  stufe: KatalogEintrag['stufe'];
  fundstelle: string;
  quelle_url: string;
  pruefer_typen: KatalogEintrag['prueferTypen'];
  hinweis: string | null;
  freigabestatus: KatalogEintrag['freigabestatus'];
  freigegeben_von: string | null;
  freigegeben_am: string | null;
}
export interface GeraetZeile {
  id: string;
  organisation_id: string;
  bereich_id: string;
  bezeichnung: string;
  inventarnummer: string | null;
  geraetegruppe: string;
  kategorie: Geraet['kategorie'];
  hersteller: string | null;
  typ: string | null;
  seriennummer: string | null;
  baujahr: number | null;
  einsatzort: Geraet['einsatzort'];
  betriebsstatus: Geraet['betriebsstatus'];
  angelegt_am: string;
  zugeordnet_an: string | null;
}
export interface FristSpalten {
  frist_monate: number | null;
  frist_quelle: FestgelegteFrist['quelle'] | null;
  frist_stufe: FestgelegteFrist['stufe'] | null;
  frist_fundstelle: string | null;
  frist_quelle_url: string | null;
  frist_katalog_eintrag_id: string | null;
  frist_katalog_version: number | null;
  frist_begruendung: string | null;
}
export interface PruefartZeile extends FristSpalten {
  id: string;
  organisation_id: string;
  geraet_id: string;
  katalog_schluessel: string | null;
  bezeichnung: string;
  herstellerfrist_monate: number | null;
  herstellerfrist_quelle: string | null;
  frist_freigegeben_von: string | null;
  frist_freigegeben_von_name: string | null;
  frist_freigegeben_am: string | null;
  letzte_pruefung: string | null;
  letzte_pruefung_herkunft: GeraetPruefart['letztePruefungHerkunft'];
  zugewiesener_pruefer_id: string | null;
  gbu_dokument_titel: string | null;
  gbu_dokument_url: string | null;
}
export interface NachweisZeile {
  id: string;
  organisation_id: string;
  geraet_id: string;
  geraet_pruefart_id: string;
  pruefdatum: string;
  ergebnis: Nachweis['ergebnis'];
  pruefumfang: string;
  pruefer_name: string;
  pruefer_benutzer_id: string | null;
  unterschrift_im_pdf: boolean;
  pdf_pfad: string;
  pdf_dateiname: string;
  pdf_sha256: string;
  frist_empfehlung_monate: number | null;
  erfasst_von: string;
  erfasst_am: string;
}
export interface EreignisZeile {
  id: string;
  organisation_id: string;
  geraet_id: string | null;
  typ: Ereignis['typ'];
  akteur_id: string | null;
  akteur_name: string;
  zeitpunkt: string;
  daten: Record<string, unknown>;
}
export interface AnlassZeile {
  id: string;
  organisation_id: string;
  geraet_id: string;
  geraet_pruefart_id: string;
  art: Anlass['art'];
  datum: string;
  beschreibung: string;
  erfasst_von: string;
  erfasst_von_name: string;
  erfasst_am: string;
  aufgehoben_von: string | null;
  aufgehoben_von_name: string | null;
  aufgehoben_am: string | null;
  aufhebungsgrund: string | null;
}
export interface MangelZeile {
  id: string;
  organisation_id: string;
  geraet_id: string;
  geraet_pruefart_id: string | null;
  nachweis_id: string | null;
  beschreibung: string;
  schwere: Mangel['schwere'];
  termin: string;
  status: Mangel['status'];
  verantwortlich_id: string | null;
  erfasst_von: string;
  erfasst_von_name: string;
  erfasst_am: string;
  kenntnis_von: string | null;
  kenntnis_von_name: string | null;
  kenntnis_am: string | null;
  behoben_am: string | null;
  behoben_durch: string | null;
  behebung: string | null;
  behebung_erfasst_von: string | null;
  behebung_erfasst_von_name: string | null;
  behebung_erfasst_am: string | null;
}

// I3M
export interface GeraetTokenZeile {
  id: string;
  organisation_id: string;
  geraet_id: string;
  token: string;
  aktiv: boolean;
  erstellt_am: string;
  deaktiviert_am: string | null;
}
export interface UebernahmeZeile {
  id: string;
  organisation_id: string;
  geraet_id: string;
  benutzer_id: string | null;
  benutzer_name: string | null;
  von: string;
  bis: string | null;
  ende_art: Uebernahme['endeArt'];
  beendet_von: string | null;
}
/** JSON aus app.geraet_status_json (geraet_oeffentlich, ma_kurzansichten), snake_case. */
export interface StatusRohJson {
  geraet: {
    id: string;
    organisation_id: string;
    bezeichnung: string;
    inventarnummer: string | null;
    hersteller: string | null;
    typ: string | null;
    kategorie: Geraet['kategorie'];
    betriebsstatus: Geraet['betriebsstatus'];
  };
  pruefarten: {
    id: string;
    bezeichnung: string;
    letzte_pruefung: string | null;
    letzte_pruefung_herkunft: GeraetPruefart['letztePruefungHerkunft'];
    frist: { monate: number; quelle: FestgelegteFrist['quelle']; stufe: FestgelegteFrist['stufe']; fundstelle: string } | null;
  }[];
  nachweise: {
    id: string;
    geraet_pruefart_id: string;
    pruefdatum: string;
    ergebnis: Nachweis['ergebnis'];
    erfasst_am: string;
    pruefer_name: string | null;
  }[];
  anlaesse: { id: string; geraet_pruefart_id: string; datum: string; erfasst_am: string; aufgehoben_am: string | null }[];
  offene_maengel: { schwere: Mangel['schwere'] }[];
}
export interface KurzRohJson extends StatusRohJson {
  bereich_name: string;
  zugeordnet_mir: boolean;
  offene_uebernahme: { von_mir: boolean; seit: string | null } | null;
}
export interface TokenRohJson extends StatusRohJson {
  organisation_name: string;
}

/** Spaltenlisten für select() – nur benötigte Spalten. */
export const SPALTEN = {
  organisation: 'id, name, bg',
  bereich: 'id, organisation_id, standort_id, name, einsatzort',
  mitgliedschaft: 'id, organisation_id, benutzer_id, anzeigename, rolle, aktiv, pruefer_typen', // ohne email (nur Admin, RPC)
  katalog:
    'id, schluessel, version, geraetegruppe, geraetegruppe_label, pruefart, einsatzort, intervall_monate, stufe, fundstelle, quelle_url, pruefer_typen, hinweis, freigabestatus, freigegeben_von, freigegeben_am',
  geraet:
    'id, organisation_id, bereich_id, bezeichnung, inventarnummer, geraetegruppe, kategorie, hersteller, typ, seriennummer, baujahr, einsatzort, betriebsstatus, angelegt_am, zugeordnet_an',
  pruefart:
    'id, organisation_id, geraet_id, katalog_schluessel, bezeichnung, herstellerfrist_monate, herstellerfrist_quelle, frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_quelle_url, frist_katalog_eintrag_id, frist_katalog_version, frist_begruendung, frist_freigegeben_von, frist_freigegeben_von_name, frist_freigegeben_am, letzte_pruefung, letzte_pruefung_herkunft, zugewiesener_pruefer_id, gbu_dokument_titel, gbu_dokument_url',
  nachweis:
    'id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id, unterschrift_im_pdf, pdf_pfad, pdf_dateiname, pdf_sha256, frist_empfehlung_monate, erfasst_von, erfasst_am',
  ereignis: 'id, organisation_id, geraet_id, typ, akteur_id, akteur_name, zeitpunkt, daten',
  anlass:
    'id, organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung, erfasst_von, erfasst_von_name, erfasst_am, aufgehoben_von, aufgehoben_von_name, aufgehoben_am, aufhebungsgrund',
  mangel:
    'id, organisation_id, geraet_id, geraet_pruefart_id, nachweis_id, beschreibung, schwere, termin, status, verantwortlich_id, erfasst_von, erfasst_von_name, erfasst_am, kenntnis_von, kenntnis_von_name, kenntnis_am, behoben_am, behoben_durch, behebung, behebung_erfasst_von, behebung_erfasst_von_name, behebung_erfasst_am',
  token: 'id, organisation_id, geraet_id, token, aktiv, erstellt_am, deaktiviert_am',
  uebernahme: 'id, organisation_id, geraet_id, benutzer_id, benutzer_name, von, bis, ende_art, beendet_von',
} as const;

// ---------- Hilfen ----------

/** Postgres-timestamptz ('2026-11-19 08:30:00+00' o. ä.) → ISO 8601 UTC mit Millisekunden. */
export function isoZeit(wert: string): string {
  const d = new Date(wert);
  if (Number.isNaN(d.getTime())) throw new Error(`Ungültiger Zeitpunkt: ${wert}`);
  return d.toISOString();
}
const isoZeitOderNull = (w: string | null) => (w === null ? null : isoZeit(w));
/** date-Spalten kommen als 'YYYY-MM-DD'; Sicherheitshalber kürzen. */
const datum = (w: string) => w.slice(0, 10);
const datumOderNull = (w: string | null) => (w === null ? null : datum(w));

/** Pfad im Bucket 'nachweise' (Prüfart im Pfad, damit Storage-RLS pro Prüfart greift). */
export function nachweisPfad(n: Pick<Nachweis, 'organisationId' | 'geraetId' | 'geraetPruefartId' | 'id'>): string {
  return `${n.organisationId}/${n.geraetId}/${n.geraetPruefartId}/${n.id}.pdf`;
}

// ---------- Stammdaten ----------

export const zuOrganisation = (z: OrganisationZeile): Organisation => ({ id: z.id, name: z.name, bg: z.bg });

export const zuBereich = (z: BereichZeile): Bereich => ({
  id: z.id,
  organisationId: z.organisation_id,
  standortId: z.standort_id,
  name: z.name,
  einsatzort: z.einsatzort,
});
export const vonBereich = (b: Bereich): BereichZeile => ({
  id: b.id,
  organisation_id: b.organisationId,
  standort_id: b.standortId,
  name: b.name,
  einsatzort: b.einsatzort,
});

export function zuMitgliedschaft(z: MitgliedschaftLeseZeile, bereichIds: string[]): Mitgliedschaft {
  return {
    id: z.id,
    organisationId: z.organisation_id,
    benutzerId: z.benutzer_id,
    rolle: z.rolle,
    bereichIds: z.rolle === 'verantwortlicher' ? [...bereichIds].sort() : [],
    prueferTypen: z.rolle === 'pruefer' ? [...(z.pruefer_typen ?? [])] : [],
    aktiv: z.aktiv,
  };
}
export function vonMitgliedschaft(m: Mitgliedschaft, b: Benutzer): MitgliedschaftZeile {
  return {
    id: m.id,
    organisation_id: m.organisationId,
    benutzer_id: m.benutzerId,
    anzeigename: b.name,
    email: b.email,
    rolle: m.rolle,
    aktiv: m.aktiv,
    pruefer_typen: [...m.prueferTypen],
  };
}
/**
 * Benutzer im Kontext einer Organisation: Name = anzeigename (F-8). E-Mail nur für Admins (mitglied_emails),
 * sonst '' (Befund I2-5).
 */
export const zuBenutzer = (z: Pick<MitgliedschaftZeile, 'benutzer_id' | 'anzeigename'>, email = ''): Benutzer => ({
  id: z.benutzer_id,
  name: z.anzeigename,
  email,
});

export const zuKatalog = (z: KatalogZeile): KatalogEintrag => ({
  id: z.id,
  schluessel: z.schluessel,
  version: z.version,
  geraetegruppe: z.geraetegruppe,
  geraetegruppeLabel: z.geraetegruppe_label,
  pruefart: z.pruefart,
  einsatzort: z.einsatzort,
  intervallMonate: z.intervall_monate,
  stufe: z.stufe,
  fundstelle: z.fundstelle,
  quelleUrl: z.quelle_url,
  prueferTypen: [...z.pruefer_typen],
  hinweis: z.hinweis,
  freigabestatus: z.freigabestatus,
  freigegebenVon: z.freigegeben_von,
  freigegebenAm: datumOderNull(z.freigegeben_am),
});

// ---------- Geräte, Prüfarten ----------

export const zuGeraet = (z: GeraetZeile): Geraet => ({
  id: z.id,
  organisationId: z.organisation_id,
  bereichId: z.bereich_id,
  bezeichnung: z.bezeichnung,
  inventarnummer: z.inventarnummer,
  geraetegruppe: z.geraetegruppe,
  kategorie: z.kategorie,
  hersteller: z.hersteller,
  typ: z.typ,
  seriennummer: z.seriennummer,
  baujahr: z.baujahr,
  einsatzort: z.einsatzort,
  betriebsstatus: z.betriebsstatus,
  angelegtAm: isoZeit(z.angelegt_am),
  zugeordnetAn: z.zugeordnet_an ?? null,
});
export const vonGeraet = (g: Geraet): GeraetZeile => ({
  id: g.id,
  organisation_id: g.organisationId,
  bereich_id: g.bereichId,
  bezeichnung: g.bezeichnung,
  inventarnummer: g.inventarnummer,
  geraetegruppe: g.geraetegruppe,
  kategorie: g.kategorie,
  hersteller: g.hersteller,
  typ: g.typ,
  seriennummer: g.seriennummer,
  baujahr: g.baujahr,
  einsatzort: g.einsatzort,
  betriebsstatus: g.betriebsstatus,
  angelegt_am: g.angelegtAm,
  zugeordnet_an: g.zugeordnetAn,
});

/** Frist-Snapshot aus den Spalten; null, solange nicht freigegeben. */
export function zuFrist(z: PruefartZeile): FestgelegteFrist | null {
  if (z.frist_monate === null || z.frist_quelle === null || z.frist_stufe === null || z.frist_fundstelle === null) return null;
  return {
    monate: z.frist_monate,
    quelle: z.frist_quelle,
    stufe: z.frist_stufe,
    fundstelle: z.frist_fundstelle,
    quelleUrl: z.frist_quelle_url,
    katalogEintragId: z.frist_katalog_eintrag_id,
    katalogVersion: z.frist_katalog_version,
    begruendung: z.frist_begruendung,
    freigegebenVon: z.frist_freigegeben_von ?? '',
    freigegebenVonName: z.frist_freigegeben_von_name ?? '',
    freigegebenAm: z.frist_freigegeben_am ? isoZeit(z.frist_freigegeben_am) : '',
  };
}
/** Nur die vom Client schreibbaren Frist-Spalten; Freigabe-Metadaten stempelt der Trigger. */
export function vonFrist(f: FestgelegteFrist | null): FristSpalten {
  return {
    frist_monate: f?.monate ?? null,
    frist_quelle: f?.quelle ?? null,
    frist_stufe: f?.stufe ?? null,
    frist_fundstelle: f?.fundstelle ?? null,
    frist_quelle_url: f?.quelleUrl ?? null,
    frist_katalog_eintrag_id: f?.katalogEintragId ?? null,
    frist_katalog_version: f?.katalogVersion ?? null,
    frist_begruendung: f?.begruendung ?? null,
  };
}

export const zuGbuDokument = (z: Pick<PruefartZeile, 'gbu_dokument_titel' | 'gbu_dokument_url'>): GbuDokument | null =>
  z.gbu_dokument_titel === null ? null : { titel: z.gbu_dokument_titel, url: z.gbu_dokument_url };
export const vonGbuDokument = (d: GbuDokument | null): Pick<PruefartZeile, 'gbu_dokument_titel' | 'gbu_dokument_url'> => ({
  gbu_dokument_titel: d?.titel ?? null,
  gbu_dokument_url: d?.url ?? null,
});

export const zuPruefart = (z: PruefartZeile): GeraetPruefart => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  katalogSchluessel: z.katalog_schluessel,
  bezeichnung: z.bezeichnung,
  herstellerfristMonate: z.herstellerfrist_monate,
  herstellerfristQuelle: z.herstellerfrist_quelle,
  frist: zuFrist(z),
  letztePruefung: datumOderNull(z.letzte_pruefung),
  letztePruefungHerkunft: z.letzte_pruefung_herkunft,
  zugewiesenerPrueferId: z.zugewiesener_pruefer_id,
  gbuDokument: zuGbuDokument(z),
});
export const vonPruefart = (p: GeraetPruefart): PruefartZeile => ({
  id: p.id,
  organisation_id: p.organisationId,
  geraet_id: p.geraetId,
  katalog_schluessel: p.katalogSchluessel,
  bezeichnung: p.bezeichnung,
  herstellerfrist_monate: p.herstellerfristMonate,
  herstellerfrist_quelle: p.herstellerfristQuelle,
  ...vonFrist(p.frist),
  frist_freigegeben_von: p.frist?.freigegebenVon ?? null,
  frist_freigegeben_von_name: p.frist?.freigegebenVonName ?? null,
  frist_freigegeben_am: p.frist?.freigegebenAm ?? null,
  letzte_pruefung: p.letztePruefung,
  letzte_pruefung_herkunft: p.letztePruefungHerkunft,
  zugewiesener_pruefer_id: p.zugewiesenerPrueferId,
  ...vonGbuDokument(p.gbuDokument),
});

// ---------- Nachweise, Ereignisse ----------

export const zuNachweis = (z: NachweisZeile): Nachweis => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  geraetPruefartId: z.geraet_pruefart_id,
  pruefdatum: datum(z.pruefdatum),
  ergebnis: z.ergebnis,
  pruefumfang: z.pruefumfang,
  prueferName: z.pruefer_name,
  prueferBenutzerId: z.pruefer_benutzer_id,
  unterschriftImPdf: z.unterschrift_im_pdf,
  pdfDateiname: z.pdf_dateiname,
  pdfSha256: z.pdf_sha256,
  fristEmpfehlungMonate: z.frist_empfehlung_monate,
  erfasstVon: z.erfasst_von,
  erfasstAm: isoZeit(z.erfasst_am),
});
export const vonNachweis = (n: Nachweis): NachweisZeile => ({
  id: n.id,
  organisation_id: n.organisationId,
  geraet_id: n.geraetId,
  geraet_pruefart_id: n.geraetPruefartId,
  pruefdatum: n.pruefdatum,
  ergebnis: n.ergebnis,
  pruefumfang: n.pruefumfang,
  pruefer_name: n.prueferName,
  pruefer_benutzer_id: n.prueferBenutzerId,
  unterschrift_im_pdf: n.unterschriftImPdf,
  pdf_pfad: nachweisPfad(n),
  pdf_dateiname: n.pdfDateiname,
  pdf_sha256: n.pdfSha256,
  frist_empfehlung_monate: n.fristEmpfehlungMonate,
  erfasst_von: n.erfasstVon,
  erfasst_am: n.erfasstAm,
});

export const zuEreignis = (z: EreignisZeile): Ereignis => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  typ: z.typ,
  akteurId: z.akteur_id ?? '',
  akteurName: z.akteur_name,
  zeitpunkt: isoZeit(z.zeitpunkt),
  daten: z.daten ?? {},
});

// ---------- Anlass, Mangel ----------

export const zuAnlass = (z: AnlassZeile): Anlass => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  geraetPruefartId: z.geraet_pruefart_id,
  art: z.art,
  datum: datum(z.datum),
  beschreibung: z.beschreibung,
  erfasstVon: z.erfasst_von,
  erfasstVonName: z.erfasst_von_name,
  erfasstAm: isoZeit(z.erfasst_am),
  aufgehobenVon: z.aufgehoben_von,
  aufgehobenVonName: z.aufgehoben_von_name,
  aufgehobenAm: isoZeitOderNull(z.aufgehoben_am),
  aufhebungsgrund: z.aufhebungsgrund,
});
export const vonAnlass = (a: Anlass): AnlassZeile => ({
  id: a.id,
  organisation_id: a.organisationId,
  geraet_id: a.geraetId,
  geraet_pruefart_id: a.geraetPruefartId,
  art: a.art,
  datum: a.datum,
  beschreibung: a.beschreibung,
  erfasst_von: a.erfasstVon,
  erfasst_von_name: a.erfasstVonName,
  erfasst_am: a.erfasstAm,
  aufgehoben_von: a.aufgehobenVon,
  aufgehoben_von_name: a.aufgehobenVonName,
  aufgehoben_am: a.aufgehobenAm,
  aufhebungsgrund: a.aufhebungsgrund,
});

export const zuMangel = (z: MangelZeile): Mangel => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  geraetPruefartId: z.geraet_pruefart_id,
  nachweisId: z.nachweis_id,
  beschreibung: z.beschreibung,
  schwere: z.schwere,
  termin: datum(z.termin),
  status: z.status,
  verantwortlichId: z.verantwortlich_id,
  erfasstVon: z.erfasst_von,
  erfasstVonName: z.erfasst_von_name,
  erfasstAm: isoZeit(z.erfasst_am),
  kenntnisVon: z.kenntnis_von,
  kenntnisVonName: z.kenntnis_von_name,
  kenntnisAm: isoZeitOderNull(z.kenntnis_am),
  behobenAm: datumOderNull(z.behoben_am),
  behobenDurch: z.behoben_durch,
  behebung: z.behebung,
  behebungErfasstVon: z.behebung_erfasst_von,
  behebungErfasstVonName: z.behebung_erfasst_von_name,
  behebungErfasstAm: isoZeitOderNull(z.behebung_erfasst_am),
});
export const vonMangel = (m: Mangel): MangelZeile => ({
  id: m.id,
  organisation_id: m.organisationId,
  geraet_id: m.geraetId,
  geraet_pruefart_id: m.geraetPruefartId,
  nachweis_id: m.nachweisId,
  beschreibung: m.beschreibung,
  schwere: m.schwere,
  termin: m.termin,
  status: m.status,
  verantwortlich_id: m.verantwortlichId,
  erfasst_von: m.erfasstVon,
  erfasst_von_name: m.erfasstVonName,
  erfasst_am: m.erfasstAm,
  kenntnis_von: m.kenntnisVon,
  kenntnis_von_name: m.kenntnisVonName,
  kenntnis_am: m.kenntnisAm,
  behoben_am: m.behobenAm,
  behoben_durch: m.behobenDurch,
  behebung: m.behebung,
  behebung_erfasst_von: m.behebungErfasstVon,
  behebung_erfasst_von_name: m.behebungErfasstVonName,
  behebung_erfasst_am: m.behebungErfasstAm,
});

// ---------- I3M: Token, Übernahme, Rohdaten der Kurz-/öffentlichen Ansicht ----------

export const zuGeraetToken = (z: GeraetTokenZeile): GeraetToken => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  token: z.token,
  aktiv: z.aktiv,
  erstelltAm: isoZeit(z.erstellt_am),
  deaktiviertAm: isoZeitOderNull(z.deaktiviert_am),
});
export const vonGeraetToken = (t: GeraetToken): GeraetTokenZeile => ({
  id: t.id,
  organisation_id: t.organisationId,
  geraet_id: t.geraetId,
  token: t.token,
  aktiv: t.aktiv,
  erstellt_am: t.erstelltAm,
  deaktiviert_am: t.deaktiviertAm,
});

export const zuUebernahme = (z: UebernahmeZeile): Uebernahme => ({
  id: z.id,
  organisationId: z.organisation_id,
  geraetId: z.geraet_id,
  benutzerId: z.benutzer_id,
  benutzerName: z.benutzer_name,
  von: isoZeit(z.von),
  bis: isoZeitOderNull(z.bis),
  endeArt: z.ende_art,
  beendetVon: z.beendet_von,
});
export const vonUebernahme = (u: Uebernahme): UebernahmeZeile => ({
  id: u.id,
  organisation_id: u.organisationId,
  geraet_id: u.geraetId,
  benutzer_id: u.benutzerId,
  benutzer_name: u.benutzerName,
  von: u.von,
  bis: u.bis,
  ende_art: u.endeArt,
  beendet_von: u.beendetVon,
});

function zuStatusRoh(j: StatusRohJson): Omit<TokenRohdaten, 'organisationName'> {
  return {
    geraet: {
      id: j.geraet.id,
      organisationId: j.geraet.organisation_id,
      bezeichnung: j.geraet.bezeichnung,
      inventarnummer: j.geraet.inventarnummer,
      hersteller: j.geraet.hersteller,
      typ: j.geraet.typ,
      kategorie: j.geraet.kategorie,
      betriebsstatus: j.geraet.betriebsstatus,
    },
    pruefarten: (j.pruefarten ?? []).map((p) => ({
      id: p.id,
      bezeichnung: p.bezeichnung,
      letztePruefung: datumOderNull(p.letzte_pruefung),
      letztePruefungHerkunft: p.letzte_pruefung_herkunft,
      frist: p.frist ? { monate: p.frist.monate, quelle: p.frist.quelle, stufe: p.frist.stufe, fundstelle: p.frist.fundstelle } : null,
    })),
    nachweise: (j.nachweise ?? []).map((n) => ({
      id: n.id,
      geraetPruefartId: n.geraet_pruefart_id,
      pruefdatum: datum(n.pruefdatum),
      ergebnis: n.ergebnis,
      erfasstAm: isoZeit(n.erfasst_am),
      prueferName: n.pruefer_name,
    })),
    anlaesse: (j.anlaesse ?? []).map((a) => ({
      id: a.id,
      geraetPruefartId: a.geraet_pruefart_id,
      datum: datum(a.datum),
      erfasstAm: isoZeit(a.erfasst_am),
      aufgehobenAm: isoZeitOderNull(a.aufgehoben_am),
    })),
    offeneMaengel: (j.offene_maengel ?? []).map((m) => ({ schwere: m.schwere })),
  };
}
function vonStatusRoh(r: Omit<TokenRohdaten, 'organisationName'>): StatusRohJson {
  return {
    geraet: {
      id: r.geraet.id,
      organisation_id: r.geraet.organisationId,
      bezeichnung: r.geraet.bezeichnung,
      inventarnummer: r.geraet.inventarnummer,
      hersteller: r.geraet.hersteller,
      typ: r.geraet.typ,
      kategorie: r.geraet.kategorie,
      betriebsstatus: r.geraet.betriebsstatus,
    },
    pruefarten: r.pruefarten.map((p) => ({
      id: p.id,
      bezeichnung: p.bezeichnung,
      letzte_pruefung: p.letztePruefung,
      letzte_pruefung_herkunft: p.letztePruefungHerkunft,
      frist: p.frist ? { ...p.frist } : null,
    })),
    nachweise: r.nachweise.map((n) => ({
      id: n.id,
      geraet_pruefart_id: n.geraetPruefartId,
      pruefdatum: n.pruefdatum,
      ergebnis: n.ergebnis,
      erfasst_am: n.erfasstAm,
      pruefer_name: n.prueferName,
    })),
    anlaesse: r.anlaesse.map((a) => ({
      id: a.id,
      geraet_pruefart_id: a.geraetPruefartId,
      datum: a.datum,
      erfasst_am: a.erfasstAm,
      aufgehoben_am: a.aufgehobenAm,
    })),
    offene_maengel: r.offeneMaengel.map((m) => ({ schwere: m.schwere })),
  };
}

export const zuKurzRohdaten = (j: KurzRohJson): KurzRohdaten => ({
  ...zuStatusRoh(j),
  bereichName: j.bereich_name,
  zugeordnetMir: j.zugeordnet_mir === true,
  offeneUebernahme: j.offene_uebernahme
    ? { vonMir: j.offene_uebernahme.von_mir === true, seit: j.offene_uebernahme.von_mir ? isoZeitOderNull(j.offene_uebernahme.seit) : null }
    : null,
});
export const vonKurzRohdaten = (r: KurzRohdaten): KurzRohJson => ({
  ...vonStatusRoh(r),
  bereich_name: r.bereichName,
  zugeordnet_mir: r.zugeordnetMir,
  offene_uebernahme: r.offeneUebernahme ? { von_mir: r.offeneUebernahme.vonMir, seit: r.offeneUebernahme.seit } : null,
});

export const zuTokenRohdaten = (j: TokenRohJson): TokenRohdaten => ({ ...zuStatusRoh(j), organisationName: j.organisation_name });
export const vonTokenRohdaten = (r: TokenRohdaten): TokenRohJson => ({ ...vonStatusRoh(r), organisation_name: r.organisationName });

// ---------- Fehler ----------

/** Deutsche Meldung zu Postgres-Fehlercodes. Fachliche Trigger-Meldungen (23514) sind bereits deutsch. */
export function pgFehlerText(code: string | undefined, nachricht?: string): string {
  switch (code) {
    case '23505':
      return 'Eintrag bereits vorhanden.';
    case '42501':
      return 'Keine Berechtigung für diese Aktion.';
    case '23514':
      return nachricht && /[äöüÄÖÜß]|\b(Frist|Prüf|Mangel|Anlass|Admin|Mitglied|Termin|Gerät|Bereich)/.test(nachricht)
        ? `${nachricht.replace(/\.$/, '')}.`
        : 'Die Eingabe verletzt eine fachliche Regel.';
    case '23503':
      return 'Bezug nicht gefunden.';
    case 'PGRST116':
      return 'Eintrag nicht gefunden.';
    default:
      return 'Datenbankfehler. Bitte erneut versuchen.';
  }
}

/** Fehler aus dem Supabase-Repository mit deutscher Meldung (Actions zeigen meldung an). */
export class RepositoryFehler extends Error {
  constructor(
    readonly meldung: string,
    readonly code?: string,
  ) {
    super(`${meldung}${code ? ` (${code})` : ''}`);
    this.name = 'RepositoryFehler';
  }
}
