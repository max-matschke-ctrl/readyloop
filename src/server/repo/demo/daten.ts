// Demo-Daten (BE-5): fiktive „Elbtal Fördertechnik GmbH“. Alle Datumswerte relativ zu `heute`,
// damit die Statusverteilung stabil bleibt. Feste UUIDs.
import { addTage } from '@/domain/datum';
import { ermittleFristVorschlag, waehleKatalogEintrag } from '@/domain/fristen';
import type {
  Benutzer,
  Bereich,
  DemoRolle,
  Einsatzort,
  Ereignis,
  FestgelegteFrist,
  Geraet,
  GeraeteKategorie,
  GeraetPruefart,
  Id,
  IsoDate,
  IsoDateTime,
  KatalogEintrag,
  Mitgliedschaft,
  Nachweis,
  Organisation,
  PruefErgebnis,
  Standort,
} from '@/domain/types';
import { PRUEFKATALOG_ENTWURF } from '@/server/katalog/pruefkatalog.entwurf';
import { platzhalterPdf, sha256Hex } from '@/server/pdf';

export interface DemoStand {
  organisationen: Organisation[];
  standorte: Standort[];
  bereiche: Bereich[];
  benutzer: Benutzer[];
  mitgliedschaften: Mitgliedschaft[];
  katalog: KatalogEintrag[];
  geraete: Geraet[];
  pruefarten: GeraetPruefart[];
  nachweise: Nachweis[];
  pdfs: Map<Id, Uint8Array>;
  ereignisse: Ereignis[];
}

const uuid = (praefix: string, n: number): Id => `${praefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const DEMO_ORG_ID = uuid('10000000', 1);
const STANDORT_ID = uuid('20000000', 1);
export const DEMO_BEREICH_IDS = {
  lager: uuid('30000000', 1),
  produktion: uuid('30000000', 2),
  verwaltung: uuid('30000000', 3),
} as const;
export const DEMO_BENUTZER_IDS = {
  katrin: uuid('40000000', 1),
  jens: uuid('40000000', 2),
  marco: uuid('40000000', 3),
  tobias: uuid('40000000', 4),
  sabine: uuid('40000000', 5),
} as const;

/** Benutzer je Demo-Rolle. */
export const DEMO_ROLLE_BENUTZER: Record<DemoRolle, Id> = {
  admin: DEMO_BENUTZER_IDS.katrin,
  sifa: DEMO_BENUTZER_IDS.jens,
  verantwortlicher: DEMO_BENUTZER_IDS.marco,
  pruefer: DEMO_BENUTZER_IDS.tobias,
};

type BereichKey = keyof typeof DEMO_BEREICH_IDS;
const BEREICH_NAME: Record<BereichKey, string> = { lager: 'Lager', produktion: 'Produktion', verwaltung: 'Verwaltung' };
const BEREICH_ORT: Record<BereichKey, Einsatzort> = {
  lager: 'lager_logistik',
  produktion: 'werkstatt_fertigung',
  verwaltung: 'buero',
};

interface PruefartSpez {
  schluessel: string | null;
  bezeichnung?: string;
  /** Freigegebene Frist: GBU mit Monaten, Herstellerangabe oder keine. */
  frist: { gbu: number } | 'hersteller' | null;
  herstellerfrist?: { monate: number; quelle: string };
  /** Tage vor heute; null = unbekannt */
  letzte: number | null;
  /** Herkunft der letzten Prüfung ohne Nachweis (Altbestand) */
  altbestand?: boolean;
  zugewiesen?: boolean;
  prueferName?: string;
  /** zusätzlicher älterer Nachweis */
  aeltererNachweis?: { tage: number; ergebnis: PruefErgebnis; prueferName: string };
}

interface GeraetSpez {
  inv: string;
  bezeichnung: string;
  bereich: BereichKey;
  kategorie: GeraeteKategorie;
  gruppe: string;
  hersteller?: string;
  typ?: string;
  seriennummer?: string;
  baujahr?: number;
  pruefarten: PruefartSpez[];
}

const BERGER = 'Tobias Berger, Prüfdienst Berger';
const ELEKTRO = 'Elektroprüfung Richter';

const GERAETE: GeraetSpez[] = [
  { inv: 'L-001', bezeichnung: 'Gabelstapler Linde H25', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'flurfoerderzeug', hersteller: 'Linde', typ: 'H25', seriennummer: 'H2X392W01234', baujahr: 2017,
    pruefarten: [{ schluessel: 'flurfoerderzeug.wiederkehrend', frist: { gbu: 12 }, letzte: 400, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'L-002', bezeichnung: 'Elektro-Hubwagen', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'flurfoerderzeug', hersteller: 'Jungheinrich', typ: 'EJE 116', baujahr: 2020,
    pruefarten: [{ schluessel: 'flurfoerderzeug.wiederkehrend', frist: { gbu: 12 }, letzte: 340, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'L-003', bezeichnung: 'Palettenregal Reihe A', bereich: 'lager', kategorie: 'ortsgebunden', gruppe: 'regal', hersteller: 'SSI Schäfer',
    pruefarten: [{ schluessel: 'regal.experteninspektion', frist: { gbu: 12 }, letzte: 100, altbestand: true }] },
  { inv: 'L-004', bezeichnung: 'Palettenregal Reihe B', bereich: 'lager', kategorie: 'ortsgebunden', gruppe: 'regal', hersteller: 'SSI Schäfer',
    pruefarten: [{ schluessel: 'regal.experteninspektion', frist: { gbu: 12 }, letzte: null }] },
  { inv: 'L-005', bezeichnung: 'Sektionaltor Rampe 1', bereich: 'lager', kategorie: 'ortsgebunden', gruppe: 'tor_kraftbetaetigt', hersteller: 'Hörmann', typ: 'SPU F42', baujahr: 2015,
    pruefarten: [{ schluessel: 'tor_kraftbetaetigt.wiederkehrend', frist: 'hersteller', herstellerfrist: { monate: 6, quelle: 'Betriebsanleitung Kap. 9 (Wartung)' }, letzte: 170, prueferName: 'Torservice Elbe' }] },
  { inv: 'L-006', bezeichnung: 'Anschlagkette 2-Strang', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'lastaufnahmemittel', hersteller: 'RUD', typ: 'VIP 8 mm',
    pruefarten: [
      { schluessel: 'lastaufnahmemittel.wiederkehrend', frist: { gbu: 12 }, letzte: 60, zugewiesen: true, prueferName: BERGER },
      { schluessel: 'lastaufnahmemittel.risspruefung', frist: null, letzte: null, zugewiesen: true },
    ] },
  { inv: 'L-007', bezeichnung: 'Feuerlöscher Lager FL-01', bereich: 'lager', kategorie: 'ortsgebunden', gruppe: 'feuerloescher', hersteller: 'Gloria', typ: 'PD 6 GA',
    pruefarten: [{ schluessel: 'feuerloescher.wartung', frist: { gbu: 24 }, letzte: 500, prueferName: 'Brandschutz Meißner' }] },
  { inv: 'L-008', bezeichnung: 'Stehleiter 6 Stufen', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'leiter', hersteller: 'Zarges',
    pruefarten: [{ schluessel: 'leiter.wiederkehrend', frist: { gbu: 12 }, letzte: 380, prueferName: 'Marco Lindner',
      aeltererNachweis: { tage: 745, ergebnis: 'maengel_weiterbetrieb', prueferName: 'Marco Lindner' } }] },
  { inv: 'P-001', bezeichnung: 'Brückenkran 5 t Halle 2', bereich: 'produktion', kategorie: 'ortsgebunden', gruppe: 'kran_kraftbetrieben', hersteller: 'Demag', typ: 'EKKE 5 t', baujahr: 2009,
    pruefarten: [{ schluessel: 'kran_kraftbetrieben.wiederkehrend', frist: { gbu: 12 }, letzte: 200, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'P-002', bezeichnung: 'Säulenschwenkkran 500 kg', bereich: 'produktion', kategorie: 'ortsgebunden', gruppe: 'kran_kraftbetrieben', hersteller: 'Vetter', baujahr: 2012,
    pruefarten: [{ schluessel: 'kran_kraftbetrieben.wiederkehrend', frist: { gbu: 12 }, letzte: 355, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'P-003', bezeichnung: 'Akku-Bohrschrauber Ladegerät', bereich: 'produktion', kategorie: 'wechselnd', gruppe: 'elektro_ortsveraenderlich', hersteller: 'Makita',
    pruefarten: [{ schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: 120, prueferName: ELEKTRO }] },
  { inv: 'P-004', bezeichnung: 'Winkelschleifer 125 mm', bereich: 'produktion', kategorie: 'wechselnd', gruppe: 'elektro_ortsveraenderlich', hersteller: 'Bosch', typ: 'GWS 12-125',
    pruefarten: [{ schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: 200, prueferName: ELEKTRO }] },
  { inv: 'P-005', bezeichnung: 'Kabeltrommel 25 m', bereich: 'produktion', kategorie: 'wechselnd', gruppe: 'elektro_ortsveraenderlich', hersteller: 'Brennenstuhl',
    pruefarten: [{ schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: null }] },
  { inv: 'P-006', bezeichnung: 'Scherenhubarbeitsbühne', bereich: 'produktion', kategorie: 'ortsgebunden', gruppe: 'hubarbeitsbuehne', hersteller: 'Genie', typ: 'GS-1932', baujahr: 2019,
    pruefarten: [{ schluessel: 'hubarbeitsbuehne.wiederkehrend', frist: null, letzte: null }] },
  { inv: 'P-007', bezeichnung: 'Schutzgasschweißgerät', bereich: 'produktion', kategorie: 'wechselnd', gruppe: 'sonstiges', hersteller: 'Fronius', typ: 'TransSteel 3500',
    pruefarten: [
      { schluessel: null, bezeichnung: 'Wiederholungsprüfung Schweißgerät', frist: null, letzte: null },
      { schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: 30, prueferName: ELEKTRO },
    ] },
  { inv: 'P-008', bezeichnung: 'Auffanggurt-Set 1', bereich: 'produktion', kategorie: 'personenbezogen', gruppe: 'psa_absturz', hersteller: 'Skylotec',
    pruefarten: [{ schluessel: 'psa_absturz.wiederkehrend', frist: { gbu: 12 }, letzte: 90, prueferName: 'PSA-Service Görlitz' }] },
  { inv: 'P-009', bezeichnung: 'Elektrische Anlage Halle 2', bereich: 'produktion', kategorie: 'ortsgebunden', gruppe: 'elektro_ortsfest',
    pruefarten: [{ schluessel: 'elektro_ortsfest.wiederholung', frist: { gbu: 48 }, letzte: 1000, altbestand: true }] },
  { inv: 'V-001', bezeichnung: 'Kaffeevollautomat Teeküche', bereich: 'verwaltung', kategorie: 'ortsgebunden', gruppe: 'elektro_ortsveraenderlich', hersteller: 'Jura',
    pruefarten: [{ schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: 60, prueferName: ELEKTRO }] },
  { inv: 'V-002', bezeichnung: 'Sicherheitsbeleuchtung Treppenhaus', bereich: 'verwaltung', kategorie: 'ortsgebunden', gruppe: 'sicherheitsbeleuchtung',
    pruefarten: [{ schluessel: 'sicherheitsbeleuchtung.wiederkehrend', frist: { gbu: 12 }, letzte: 200, prueferName: ELEKTRO }] },
  { inv: 'V-003', bezeichnung: 'Firmenwagen VW Caddy', bereich: 'verwaltung', kategorie: 'wechselnd', gruppe: 'fahrzeug', hersteller: 'Volkswagen', typ: 'Caddy 2.0 TDI', baujahr: 2021,
    pruefarten: [{ schluessel: 'fahrzeug.uvv', frist: { gbu: 12 }, letzte: 370, prueferName: 'Autohaus Pirna' }] },
];

const zeit = (datum: IsoDate, uhr = '09:00'): IsoDateTime => `${datum}T${uhr}:00.000Z`;

export function erzeugeDemoStand(heute: IsoDate): DemoStand {
  const organisation: Organisation = { id: DEMO_ORG_ID, name: 'Elbtal Fördertechnik GmbH', bg: 'BG Holz und Metall' };
  const standort: Standort = { id: STANDORT_ID, organisationId: DEMO_ORG_ID, name: 'Hauptwerk' };
  const bereiche: Bereich[] = (Object.keys(DEMO_BEREICH_IDS) as BereichKey[]).map((k) => ({
    id: DEMO_BEREICH_IDS[k],
    organisationId: DEMO_ORG_ID,
    standortId: STANDORT_ID,
    name: BEREICH_NAME[k],
    einsatzort: BEREICH_ORT[k],
  }));

  const b = DEMO_BENUTZER_IDS;
  const benutzer: Benutzer[] = [
    { id: b.katrin, name: 'Katrin Vogel', email: 'k.vogel@elbtal-foerdertechnik.example' },
    { id: b.jens, name: 'Dr. Jens Hartmann', email: 'hartmann@sifa-hartmann.example' },
    { id: b.marco, name: 'Marco Lindner', email: 'm.lindner@elbtal-foerdertechnik.example' },
    { id: b.tobias, name: 'Tobias Berger', email: 'berger@pruefdienst-berger.example' },
    { id: b.sabine, name: 'Sabine Krüger', email: 's.krueger@elbtal-foerdertechnik.example' },
  ];
  const m = (n: number, benutzerId: Id, rolle: Mitgliedschaft['rolle'], bereichIds: Id[] = []): Mitgliedschaft => ({
    id: uuid('50000000', n),
    organisationId: DEMO_ORG_ID,
    benutzerId,
    rolle,
    bereichIds,
    prueferTypen: [], // Demo-Qualifikationen folgen mit BE-10
    aktiv: true,
  });
  const mitgliedschaften: Mitgliedschaft[] = [
    m(1, b.katrin, 'admin'),
    m(2, b.jens, 'sifa'),
    m(3, b.marco, 'verantwortlicher', [DEMO_BEREICH_IDS.lager]),
    m(4, b.tobias, 'pruefer'),
    m(5, b.sabine, 'verantwortlicher', [DEMO_BEREICH_IDS.produktion]),
  ];
  const name = (id: Id) => benutzer.find((x) => x.id === id)?.name ?? 'System';

  const katalog = PRUEFKATALOG_ENTWURF.map((k) => ({ ...k, prueferTypen: [...k.prueferTypen] }));
  const geraete: Geraet[] = [];
  const pruefarten: GeraetPruefart[] = [];
  const nachweise: Nachweis[] = [];
  const pdfs = new Map<Id, Uint8Array>();
  const ereignisse: Ereignis[] = [];

  const angelegtDatum = addTage(heute, -800);
  const freigabeDatum = addTage(heute, -798);
  let pruefartNr = 0;
  let nachweisNr = 0;
  let ereignisNr = 0;
  const ereignis = (e: Omit<Ereignis, 'id' | 'organisationId'>) => {
    ereignisNr += 1;
    ereignisse.push({ id: uuid('90000000', ereignisNr), organisationId: DEMO_ORG_ID, ...e });
  };

  GERAETE.forEach((g, gi) => {
    const bereichId = DEMO_BEREICH_IDS[g.bereich];
    const verantwortlich = g.bereich === 'lager' ? b.marco : g.bereich === 'produktion' ? b.sabine : b.katrin;
    const geraet: Geraet = {
      id: uuid('60000000', gi + 1),
      organisationId: DEMO_ORG_ID,
      bereichId,
      bezeichnung: g.bezeichnung,
      inventarnummer: g.inv,
      geraetegruppe: g.gruppe,
      kategorie: g.kategorie,
      hersteller: g.hersteller ?? null,
      typ: g.typ ?? null,
      seriennummer: g.seriennummer ?? null,
      baujahr: g.baujahr ?? null,
      einsatzort: null,
      betriebsstatus: 'in_betrieb',
      angelegtAm: zeit(angelegtDatum, `${String(8 + (gi % 8)).padStart(2, '0')}:${String(gi * 2).padStart(2, '0')}`),
    };
    geraete.push(geraet);
    ereignis({
      geraetId: geraet.id,
      typ: 'geraet_angelegt',
      akteurId: b.katrin,
      akteurName: name(b.katrin),
      zeitpunkt: geraet.angelegtAm,
      daten: { bezeichnung: geraet.bezeichnung, bereichId },
    });

    for (const p of g.pruefarten) {
      pruefartNr += 1;
      const pruefartId = uuid('70000000', pruefartNr);
      const einsatzort = BEREICH_ORT[g.bereich];
      const orientierung = p.schluessel
        ? (waehleKatalogEintrag(katalog, p.schluessel, einsatzort, 'freigegeben') ??
          waehleKatalogEintrag(katalog, p.schluessel, einsatzort, 'entwurf'))
        : null;
      const bezeichnung = p.bezeichnung ?? orientierung?.pruefart ?? 'Prüfung';

      let frist: FestgelegteFrist | null = null;
      const freigabe = { freigegebenVon: b.jens, freigegebenVonName: name(b.jens), freigegebenAm: zeit(freigabeDatum, '10:00') };
      if (p.frist === 'hersteller') {
        const v = ermittleFristVorschlag({
          pruefart: {
            katalogSchluessel: p.schluessel,
            herstellerfristMonate: p.herstellerfrist?.monate ?? null,
            herstellerfristQuelle: p.herstellerfrist?.quelle ?? null,
          },
          einsatzort,
          katalog,
        });
        if (v.art !== 'hersteller') throw new Error(`Demo-Daten: ${g.inv} erwartet Herstellervorschlag`);
        frist = { monate: v.monate, quelle: 'hersteller', stufe: 'C', fundstelle: v.fundstelle, quelleUrl: null,
          katalogEintragId: null, katalogVersion: null, begruendung: null, ...freigabe };
      } else if (p.frist !== null) {
        const begruendung = orientierung?.intervallMonate
          ? `Angelehnt an Katalogentwurf (${orientierung.intervallMonate} Monate, ${orientierung.fundstelle}); Einsatzbedingungen im Bereich ${BEREICH_NAME[g.bereich]} bewertet.`
          : `Katalogentwurf ohne Frist${orientierung ? ` (${orientierung.fundstelle})` : ''}; Festlegung nach Herstellerangaben und Einsatzbedingungen im Bereich ${BEREICH_NAME[g.bereich]}.`;
        frist = { monate: p.frist.gbu, quelle: 'gbu', stufe: 'C', fundstelle: `GBU ${BEREICH_NAME[g.bereich]} 2025`, quelleUrl: null,
          katalogEintragId: orientierung?.id ?? null, katalogVersion: orientierung?.version ?? null, begruendung, ...freigabe };
      }

      const letzte = p.letzte === null ? null : addTage(heute, -p.letzte);
      pruefarten.push({
        id: pruefartId,
        organisationId: DEMO_ORG_ID,
        geraetId: geraet.id,
        katalogSchluessel: p.schluessel,
        bezeichnung,
        herstellerfristMonate: p.herstellerfrist?.monate ?? null,
        herstellerfristQuelle: p.herstellerfrist?.quelle ?? null,
        frist,
        letztePruefung: letzte,
        letztePruefungHerkunft: letzte === null ? 'unbekannt' : p.altbestand ? 'pruefbericht' : 'nachweis',
        zugewiesenerPrueferId: p.zugewiesen ? b.tobias : null,
        gbuDokument: null,
      });
      if (frist) {
        ereignis({
          geraetId: geraet.id,
          typ: 'frist_freigegeben',
          akteurId: frist.freigegebenVon,
          akteurName: frist.freigegebenVonName,
          zeitpunkt: frist.freigegebenAm,
          daten: { pruefartId, pruefart: bezeichnung, alt: null, neu: frist },
        });
      }

      const erfasse = (datum: IsoDate, ergebnis: PruefErgebnis, prueferName: string) => {
        nachweisNr += 1;
        const id = uuid('80000000', nachweisNr);
        const erfasstVon = p.zugewiesen ? b.tobias : verantwortlich;
        const pdf = platzhalterPdf(`${g.inv} ${g.bezeichnung} - ${bezeichnung} - ${datum}`);
        const n: Nachweis = {
          id,
          organisationId: DEMO_ORG_ID,
          geraetId: geraet.id,
          geraetPruefartId: pruefartId,
          pruefdatum: datum,
          ergebnis,
          pruefumfang: bezeichnung,
          prueferName,
          prueferBenutzerId: p.zugewiesen ? b.tobias : null,
          unterschriftImPdf: true,
          pdfDateiname: `${g.inv}_${datum}.pdf`,
          pdfSha256: sha256Hex(pdf),
          fristEmpfehlungMonate: null,
          erfasstVon,
          erfasstAm: zeit(datum, '15:00'),
        };
        nachweise.push(n);
        pdfs.set(id, pdf);
        ereignis({
          geraetId: geraet.id,
          typ: 'nachweis_erfasst',
          akteurId: erfasstVon,
          akteurName: name(erfasstVon),
          zeitpunkt: n.erfasstAm,
          daten: { nachweisId: id, pruefartId, pruefdatum: datum, ergebnis, prueferName },
        });
      };
      if (p.aeltererNachweis) {
        erfasse(addTage(heute, -p.aeltererNachweis.tage), p.aeltererNachweis.ergebnis, p.aeltererNachweis.prueferName);
      }
      if (letzte !== null && !p.altbestand) erfasse(letzte, 'ohne_maengel', p.prueferName ?? 'Unbekannt');
    }
  });

  return {
    organisationen: [organisation],
    standorte: [standort],
    bereiche,
    benutzer,
    mitgliedschaften,
    katalog,
    geraete,
    pruefarten,
    nachweise,
    pdfs,
    ereignisse,
  };
}
