// Demo-Daten (BE-5): fiktive „Elbtal Fördertechnik GmbH“. Alle Datumswerte relativ zu `heute`,
// damit die Statusverteilung stabil bleibt. Feste UUIDs.
import { addTage } from '@/domain/datum';
import { ermittleFristVorschlag, waehleKatalogEintrag } from '@/domain/fristen';
import type {
  Anlass,
  Benutzer,
  Bereich,
  DemoRolle,
  Einsatzort,
  Ereignis,
  FestgelegteFrist,
  Geraet,
  GeraeteKategorie,
  GeraetPruefart,
  GeraetToken,
  Id,
  IsoDate,
  IsoDateTime,
  KatalogEintrag,
  Mangel,
  Mitgliedschaft,
  Nachweis,
  Organisation,
  PruefErgebnis,
  Standort,
  Uebernahme,
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
  anlaesse: Anlass[];
  maengel: Mangel[];
  uebernahmen: Uebernahme[]; // I3M (F-23, F-27)
  tokens: GeraetToken[]; // I3M (F-24)
}

const uuid = (praefix: string, n: number): Id => `${praefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const DEMO_ORG_ID = uuid('10000000', 1);
/** Zweite Organisation (I2): Prüfer Berger arbeitet für beide Betriebe. */
export const DEMO_ORG2_ID = uuid('10000000', 2);
const STANDORT_ID = uuid('20000000', 1);
const STANDORT2_ID = uuid('20000000', 2);
export const DEMO_BEREICH_IDS = {
  lager: uuid('30000000', 1),
  produktion: uuid('30000000', 2),
  verwaltung: uuid('30000000', 3),
  werkstatt: uuid('30000000', 4),
} as const;
export const DEMO_BENUTZER_IDS = {
  katrin: uuid('40000000', 1),
  jens: uuid('40000000', 2),
  marco: uuid('40000000', 3),
  tobias: uuid('40000000', 4),
  sabine: uuid('40000000', 5),
  uwe: uuid('40000000', 6),
  jonas: uuid('40000000', 8), // Mitarbeiter, Demo-Rolle „Mitarbeiter“ (I3M)
  aylin: uuid('40000000', 9), // Mitarbeiterin, kein Demo-Login (I3M)
} as const;

/** Benutzer je Demo-Rolle. */
export const DEMO_ROLLE_BENUTZER: Record<DemoRolle, Id> = {
  admin: DEMO_BENUTZER_IDS.katrin,
  sifa: DEMO_BENUTZER_IDS.jens,
  verantwortlicher: DEMO_BENUTZER_IDS.marco,
  pruefer: DEMO_BENUTZER_IDS.tobias,
  mitarbeiter: DEMO_BENUTZER_IDS.jonas,
};

type BereichKey = keyof typeof DEMO_BEREICH_IDS;
const BEREICH_NAME: Record<BereichKey, string> = { lager: 'Lager', produktion: 'Produktion', verwaltung: 'Verwaltung', werkstatt: 'Werkstatt' };
const BEREICH_ORT: Record<BereichKey, Einsatzort> = {
  lager: 'lager_logistik',
  produktion: 'werkstatt_fertigung',
  verwaltung: 'buero',
  werkstatt: 'werkstatt_fertigung',
};
const BEREICH_ORG: Record<BereichKey, Id> = { lager: DEMO_ORG_ID, produktion: DEMO_ORG_ID, verwaltung: DEMO_ORG_ID, werkstatt: DEMO_ORG2_ID };

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
  /** zusätzlicher neuerer Nachweis ohne Fortschreibung (z. B. nicht bestanden) */
  neuererNachweis?: { tage: number; ergebnis: PruefErgebnis; prueferName: string };
  /** Frist-Empfehlung im letzten Nachweis (F-13) */
  empfehlung?: number;
  gbuDokument?: { titel: string; url: string | null };
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
  ausserBetrieb?: boolean;
  pruefarten: PruefartSpez[];
}

const BERGER = 'Tobias Berger, Prüfdienst Berger';
const ELEKTRO = 'Elektroprüfung Richter';

const GERAETE: GeraetSpez[] = [
  { inv: 'L-001', bezeichnung: 'Gabelstapler Linde H25', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'flurfoerderzeug', hersteller: 'Linde', typ: 'H25', seriennummer: 'H2X392W01234', baujahr: 2017,
    pruefarten: [{ schluessel: 'flurfoerderzeug.wiederkehrend', frist: { gbu: 12 }, letzte: 400, zugewiesen: true, prueferName: BERGER, empfehlung: 6 }] },
  { inv: 'L-002', bezeichnung: 'Elektro-Hubwagen', bereich: 'lager', kategorie: 'wechselnd', gruppe: 'flurfoerderzeug', hersteller: 'Jungheinrich', typ: 'EJE 116', baujahr: 2020,
    pruefarten: [{ schluessel: 'flurfoerderzeug.wiederkehrend', frist: { gbu: 12 }, letzte: 340, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'L-003', bezeichnung: 'Palettenregal Reihe A', bereich: 'lager', kategorie: 'ortsgebunden', gruppe: 'regal', hersteller: 'SSI Schäfer',
    pruefarten: [{ schluessel: 'regal.experteninspektion', frist: { gbu: 12 }, letzte: 100, altbestand: true,
      gbuDokument: { titel: 'GBU Lager 2025, Abschn. 3 Regale', url: null } }] },
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
    pruefarten: [{ schluessel: 'elektro_ortsveraenderlich.wiederholung', frist: { gbu: 6 }, letzte: 200, prueferName: ELEKTRO,
      neuererNachweis: { tage: 10, ergebnis: 'nicht_bestanden', prueferName: ELEKTRO } }] },
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
    ausserBetrieb: true,
    pruefarten: [{ schluessel: 'fahrzeug.uvv', frist: { gbu: 12 }, letzte: 370, prueferName: 'Autohaus Pirna' }] },
  // Zweite Organisation „Muster Metallbau GmbH“ (I2)
  { inv: 'M-001', bezeichnung: 'Säulenbohrmaschine', bereich: 'werkstatt', kategorie: 'ortsgebunden', gruppe: 'elektro_ortsfest', hersteller: 'Alzmetall', typ: 'AX 3', baujahr: 2014,
    pruefarten: [{ schluessel: 'elektro_ortsfest.wiederholung', frist: { gbu: 48 }, letzte: 300, zugewiesen: true, prueferName: BERGER }] },
  { inv: 'M-002', bezeichnung: 'Hallenkran 2 t', bereich: 'werkstatt', kategorie: 'ortsgebunden', gruppe: 'kran_kraftbetrieben', hersteller: 'Abus', baujahr: 2011,
    pruefarten: [{ schluessel: 'kran_kraftbetrieben.wiederkehrend', frist: { gbu: 12 }, letzte: 350, zugewiesen: true, prueferName: BERGER }] },
];

const zeit = (datum: IsoDate, uhr = '09:00'): IsoDateTime => `${datum}T${uhr}:00.000Z`;

export function erzeugeDemoStand(heute: IsoDate): DemoStand {
  const organisationen: Organisation[] = [
    { id: DEMO_ORG_ID, name: 'Elbtal Fördertechnik GmbH', bg: 'BG Holz und Metall' },
    { id: DEMO_ORG2_ID, name: 'Muster Metallbau GmbH', bg: 'BG Holz und Metall' },
  ];
  const standorte: Standort[] = [
    { id: STANDORT_ID, organisationId: DEMO_ORG_ID, name: 'Hauptwerk' },
    { id: STANDORT2_ID, organisationId: DEMO_ORG2_ID, name: 'Werk' },
  ];
  const bereiche: Bereich[] = (Object.keys(DEMO_BEREICH_IDS) as BereichKey[]).map((k) => ({
    id: DEMO_BEREICH_IDS[k],
    organisationId: BEREICH_ORG[k],
    standortId: BEREICH_ORG[k] === DEMO_ORG_ID ? STANDORT_ID : STANDORT2_ID,
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
    { id: b.uwe, name: 'Uwe Schmidt', email: 'u.schmidt@muster-metallbau.example' },
  ];
  const m = (
    n: number,
    organisationId: Id,
    benutzerId: Id,
    rolle: Mitgliedschaft['rolle'],
    extra: Partial<Pick<Mitgliedschaft, 'bereichIds' | 'prueferTypen'>> = {},
  ): Mitgliedschaft => ({
    id: uuid('50000000', n),
    organisationId,
    benutzerId,
    rolle,
    bereichIds: extra.bereichIds ?? [],
    prueferTypen: extra.prueferTypen ?? [],
    aktiv: true,
  });
  const BERGER_TYPEN: Mitgliedschaft['prueferTypen'] = ['efk', 'sachkundiger'];
  const mitgliedschaften: Mitgliedschaft[] = [
    m(1, DEMO_ORG_ID, b.katrin, 'admin'),
    m(2, DEMO_ORG_ID, b.jens, 'sifa'),
    m(3, DEMO_ORG_ID, b.marco, 'verantwortlicher', { bereichIds: [DEMO_BEREICH_IDS.lager] }),
    m(4, DEMO_ORG_ID, b.tobias, 'pruefer', { prueferTypen: BERGER_TYPEN }),
    m(5, DEMO_ORG_ID, b.sabine, 'verantwortlicher', { bereichIds: [DEMO_BEREICH_IDS.produktion] }),
    m(6, DEMO_ORG2_ID, b.uwe, 'verantwortlicher', { bereichIds: [DEMO_BEREICH_IDS.werkstatt] }),
    m(7, DEMO_ORG2_ID, b.tobias, 'pruefer', { prueferTypen: BERGER_TYPEN }),
  ];
  // Org 2: Admin Petra Wolf (kein Demo-Login), Verantwortlicher Werkstatt Uwe Schmidt (gibt dort Fristen frei).
  benutzer.push({ id: uuid('40000000', 7), name: 'Petra Wolf', email: 'p.wolf@muster-metallbau.example' });
  mitgliedschaften.push(m(8, DEMO_ORG2_ID, uuid('40000000', 7), 'admin'));
  // I3M: Mitarbeiter (fiktiv). Jonas Richter = Demo-Rolle „Mitarbeiter“; Aylin Demir ohne Demo-Login.
  benutzer.push(
    { id: b.jonas, name: 'Jonas Richter', email: 'j.richter@elbtal-foerdertechnik.example' },
    { id: b.aylin, name: 'Aylin Demir', email: 'a.demir@elbtal-foerdertechnik.example' },
  );
  mitgliedschaften.push(m(9, DEMO_ORG_ID, b.jonas, 'mitarbeiter'), m(10, DEMO_ORG_ID, b.aylin, 'mitarbeiter'));
  const name = (id: Id) => benutzer.find((x) => x.id === id)?.name ?? 'System';

  const katalog = PRUEFKATALOG_ENTWURF.map((k) => ({ ...k, prueferTypen: [...k.prueferTypen] }));
  const geraete: Geraet[] = [];
  const pruefarten: GeraetPruefart[] = [];
  const nachweise: Nachweis[] = [];
  const pdfs = new Map<Id, Uint8Array>();
  const ereignisse: Ereignis[] = [];
  const anlaesse: Anlass[] = [];
  const maengel: Mangel[] = [];

  const angelegtDatum = addTage(heute, -800);
  const freigabeDatum = addTage(heute, -798);
  let pruefartNr = 0;
  let nachweisNr = 0;
  let ereignisNr = 0;
  const ereignis = (organisationId: Id, e: Omit<Ereignis, 'id' | 'organisationId'>) => {
    ereignisNr += 1;
    ereignisse.push({ id: uuid('90000000', ereignisNr), organisationId, ...e });
  };
  const pruefartenVon = new Map<string, Id[]>();
  const nachweiseVon = new Map<string, Nachweis[]>();
  const geraetVon = new Map<string, Geraet>();

  GERAETE.forEach((g, gi) => {
    const bereichId = DEMO_BEREICH_IDS[g.bereich];
    const org = BEREICH_ORG[g.bereich];
    const verantwortlich =
      g.bereich === 'lager' ? b.marco : g.bereich === 'produktion' ? b.sabine : g.bereich === 'werkstatt' ? b.uwe : b.katrin;
    const anleger = org === DEMO_ORG_ID ? b.katrin : uuid('40000000', 7);
    const freigeber = org === DEMO_ORG_ID ? b.jens : b.uwe;
    const geraet: Geraet = {
      id: uuid('60000000', gi + 1),
      organisationId: org,
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
      angelegtAm: zeit(angelegtDatum, `${String(8 + (gi % 8)).padStart(2, '0')}:${String((gi * 2) % 60).padStart(2, '0')}`),
      zugeordnetAn: null,
    };
    geraete.push(geraet);
    geraetVon.set(g.inv, geraet);
    pruefartenVon.set(g.inv, []);
    nachweiseVon.set(g.inv, []);
    ereignis(org, {
      geraetId: geraet.id,
      typ: 'geraet_angelegt',
      akteurId: anleger,
      akteurName: name(anleger),
      zeitpunkt: geraet.angelegtAm,
      daten: { bezeichnung: geraet.bezeichnung, bereichId },
    });

    for (const p of g.pruefarten) {
      pruefartNr += 1;
      const pruefartId = uuid('70000000', pruefartNr);
      pruefartenVon.get(g.inv)!.push(pruefartId);
      const einsatzort = BEREICH_ORT[g.bereich];
      const orientierung = p.schluessel
        ? (waehleKatalogEintrag(katalog, p.schluessel, einsatzort, 'freigegeben') ??
          waehleKatalogEintrag(katalog, p.schluessel, einsatzort, 'entwurf'))
        : null;
      const bezeichnung = p.bezeichnung ?? orientierung?.pruefart ?? 'Prüfung';

      let frist: FestgelegteFrist | null = null;
      const freigabe = { freigegebenVon: freigeber, freigegebenVonName: name(freigeber), freigegebenAm: zeit(freigabeDatum, '10:00') };
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
        organisationId: org,
        geraetId: geraet.id,
        katalogSchluessel: p.schluessel,
        bezeichnung,
        herstellerfristMonate: p.herstellerfrist?.monate ?? null,
        herstellerfristQuelle: p.herstellerfrist?.quelle ?? null,
        frist,
        letztePruefung: letzte,
        letztePruefungHerkunft: letzte === null ? 'unbekannt' : p.altbestand ? 'pruefbericht' : 'nachweis',
        zugewiesenerPrueferId: p.zugewiesen ? b.tobias : null,
        gbuDokument: p.gbuDokument ? { ...p.gbuDokument } : null,
      });
      if (frist) {
        ereignis(org, {
          geraetId: geraet.id,
          typ: 'frist_freigegeben',
          akteurId: frist.freigegebenVon,
          akteurName: frist.freigegebenVonName,
          zeitpunkt: frist.freigegebenAm,
          daten: { pruefartId, pruefart: bezeichnung, alt: null, neu: frist, nachweisId: null, richtung: 'erstmalig' },
        });
      }
      if (p.gbuDokument) {
        ereignis(org, {
          geraetId: geraet.id,
          typ: 'gbu_dokument_gesetzt',
          akteurId: freigeber,
          akteurName: name(freigeber),
          zeitpunkt: zeit(freigabeDatum, '10:05'),
          daten: { pruefartId, pruefart: bezeichnung, alt: null, neu: p.gbuDokument },
        });
      }

      const erfasse = (datum: IsoDate, ergebnis: PruefErgebnis, prueferName: string, empfehlung: number | null = null) => {
        nachweisNr += 1;
        const id = uuid('80000000', nachweisNr);
        const erfasstVon = p.zugewiesen ? b.tobias : verantwortlich;
        const pdf = platzhalterPdf(`${g.inv} ${g.bezeichnung} - ${bezeichnung} - ${datum}`);
        const n: Nachweis = {
          id,
          organisationId: org,
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
          fristEmpfehlungMonate: empfehlung,
          erfasstVon,
          erfasstAm: zeit(datum, '15:00'),
        };
        nachweise.push(n);
        nachweiseVon.get(g.inv)!.push(n);
        pdfs.set(id, pdf);
        ereignis(org, {
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
      if (letzte !== null && !p.altbestand) erfasse(letzte, 'ohne_maengel', p.prueferName ?? 'Unbekannt', p.empfehlung ?? null);
      if (p.neuererNachweis) {
        erfasse(addTage(heute, -p.neuererNachweis.tage), p.neuererNachweis.ergebnis, p.neuererNachweis.prueferName);
      }
    }

    if (g.ausserBetrieb) {
      geraet.betriebsstatus = 'ausser_betrieb';
      ereignis(org, {
        geraetId: geraet.id,
        typ: 'betriebsstatus_geaendert',
        akteurId: b.katrin,
        akteurName: name(b.katrin),
        zeitpunkt: zeit(addTage(heute, -20), '08:30'),
        daten: { alt: 'in_betrieb', neu: 'ausser_betrieb', begruendung: 'Unfallschaden, Fahrzeug in der Werkstatt' },
      });
    }
  });

  // ---- Anlässe (F-10) ----
  const p001 = geraetVon.get('P-001')!;
  const anlassDatum = addTage(heute, -3);
  const anlass: Anlass = {
    id: uuid('a0000000', 1),
    organisationId: DEMO_ORG_ID,
    geraetId: p001.id,
    geraetPruefartId: pruefartenVon.get('P-001')![0],
    art: 'unfall_schadensfall',
    datum: anlassDatum,
    beschreibung: 'Anfahrschaden am Katzfahrwerk',
    erfasstVon: b.sabine,
    erfasstVonName: name(b.sabine),
    erfasstAm: zeit(anlassDatum, '11:00'),
    aufgehobenVon: null,
    aufgehobenVonName: null,
    aufgehobenAm: null,
    aufhebungsgrund: null,
  };
  anlaesse.push(anlass);
  ereignis(DEMO_ORG_ID, {
    geraetId: p001.id,
    typ: 'anlass_erfasst',
    akteurId: anlass.erfasstVon,
    akteurName: anlass.erfasstVonName,
    zeitpunkt: anlass.erfasstAm,
    daten: { anlassId: anlass.id, pruefartId: anlass.geraetPruefartId, pruefart: 'Wiederkehrende Prüfung', art: anlass.art, datum: anlass.datum },
  });

  // ---- Mängel (F-14) ----
  let mangelNr = 0;
  const mangel = (
    inv: string,
    teil: Pick<Mangel, 'beschreibung' | 'schwere' | 'termin' | 'verantwortlichId'> & {
      nachweisId?: Id | null;
      erfasstTage: number;
      erfasstVon: Id;
      kenntnisTage?: number;
      behoben?: { tage: number; durch: string; behebung: string };
    },
  ) => {
    mangelNr += 1;
    const g = geraetVon.get(inv)!;
    const erfasstAm = zeit(addTage(heute, -teil.erfasstTage), '16:00');
    const kenntnisAm = teil.kenntnisTage !== undefined ? zeit(addTage(heute, -teil.kenntnisTage), '09:30') : null;
    const behobenAm = teil.behoben ? addTage(heute, -teil.behoben.tage) : null;
    const verantwortlich = teil.verantwortlichId;
    const neu: Mangel = {
      id: uuid('b0000000', mangelNr),
      organisationId: g.organisationId,
      geraetId: g.id,
      geraetPruefartId: pruefartenVon.get(inv)![0],
      nachweisId: teil.nachweisId ?? null,
      beschreibung: teil.beschreibung,
      schwere: teil.schwere,
      termin: teil.termin,
      status: behobenAm ? 'behoben' : kenntnisAm ? 'in_bearbeitung' : 'offen',
      verantwortlichId: verantwortlich,
      erfasstVon: teil.erfasstVon,
      erfasstVonName: name(teil.erfasstVon),
      erfasstAm,
      kenntnisVon: kenntnisAm ? verantwortlich : null,
      kenntnisVonName: kenntnisAm && verantwortlich ? name(verantwortlich) : null,
      kenntnisAm,
      behobenAm,
      behobenDurch: teil.behoben?.durch ?? null,
      behebung: teil.behoben?.behebung ?? null,
      behebungErfasstVon: behobenAm ? verantwortlich : null,
      behebungErfasstVonName: behobenAm && verantwortlich ? name(verantwortlich) : null,
      behebungErfasstAm: behobenAm ? zeit(behobenAm, '17:00') : null,
    };
    maengel.push(neu);
    ereignis(g.organisationId, {
      geraetId: g.id, typ: 'mangel_erfasst', akteurId: neu.erfasstVon, akteurName: neu.erfasstVonName, zeitpunkt: erfasstAm,
      daten: { mangelId: neu.id, pruefartId: neu.geraetPruefartId, nachweisId: neu.nachweisId, schwere: neu.schwere, termin: neu.termin },
    });
    if (kenntnisAm && verantwortlich) {
      ereignis(g.organisationId, {
        geraetId: g.id, typ: 'mangel_kenntnis', akteurId: verantwortlich, akteurName: name(verantwortlich), zeitpunkt: kenntnisAm,
        daten: { mangelId: neu.id, verantwortlichId: verantwortlich, verantwortlichName: name(verantwortlich), terminAlt: neu.termin, terminNeu: neu.termin },
      });
    }
    if (behobenAm && verantwortlich) {
      ereignis(g.organisationId, {
        geraetId: g.id, typ: 'mangel_behoben', akteurId: verantwortlich, akteurName: name(verantwortlich), zeitpunkt: neu.behebungErfasstAm!,
        daten: { mangelId: neu.id, behobenAm, behobenDurch: neu.behobenDurch },
      });
    }
  };
  const p004Nachweis = nachweiseVon.get('P-004')!.find((n) => n.ergebnis === 'nicht_bestanden')!;
  mangel('P-004', { beschreibung: 'Schutzhaube gebrochen', schwere: 'gefaehrlich', termin: heute, verantwortlichId: b.sabine,
    nachweisId: p004Nachweis.id, erfasstTage: 10, erfasstVon: b.sabine });
  mangel('L-006', { beschreibung: 'Kettenglied verformt, Einhängehaken ohne Sicherung', schwere: 'erheblich', termin: addTage(heute, 20),
    verantwortlichId: b.marco, nachweisId: null, erfasstTage: 25, erfasstVon: b.tobias, kenntnisTage: 24 });
  const l008Alt = nachweiseVon.get('L-008')!.find((n) => n.ergebnis === 'maengel_weiterbetrieb')!;
  mangel('L-008', { beschreibung: 'Rutschhemmende Fußkappe fehlt', schwere: 'gering', termin: addTage(heute, -655),
    verantwortlichId: b.marco, nachweisId: l008Alt.id, erfasstTage: 745, erfasstVon: b.marco,
    behoben: { tage: 700, durch: 'Marco Lindner', behebung: 'Fußkappen ersetzt (Ersatzteil Zarges)' } });
  mangel('L-003', { beschreibung: 'Anfahrschutz Stütze A3 lose', schwere: 'gering', termin: addTage(heute, -5),
    verantwortlichId: b.marco, nachweisId: null, erfasstTage: 40, erfasstVon: b.marco });

  // ---- I3M: Zuordnung, Übernahmen, Tokens (F-22, F-23, F-24) ----
  const p008 = geraetVon.get('P-008')!;
  p008.zugeordnetAn = b.jonas;
  ereignis(DEMO_ORG_ID, {
    geraetId: p008.id, typ: 'zuordnung_geaendert', akteurId: b.sabine, akteurName: name(b.sabine),
    zeitpunkt: zeit(addTage(heute, -60), '08:00'), daten: { zugeordnet: true },
  });

  const uebernahmen: Uebernahme[] = [];
  const uebernahme = (inv: string, wer: Id | null, vonTage: number, ende?: { tage: number; art: Uebernahme['endeArt'] }) => {
    const g = geraetVon.get(inv)!;
    uebernahmen.push({
      id: uuid('c0000000', uebernahmen.length + 1),
      organisationId: g.organisationId,
      geraetId: g.id,
      benutzerId: wer,
      benutzerName: wer ? name(wer) : null,
      von: zeit(addTage(heute, -vonTage), '06:30'),
      bis: ende ? zeit(addTage(heute, -ende.tage), '15:45') : null,
      endeArt: ende?.art ?? null,
      beendetVon: ende && wer ? wer : null,
    });
  };
  uebernahme('L-002', b.jonas, 3);
  uebernahme('L-008', b.jonas, 40);
  uebernahme('P-003', b.aylin, 1);
  uebernahme('L-006', b.aylin, 20, { tage: 18, art: 'rueckgabe' });
  uebernahme('P-004', null, 130, { tage: 120, art: 'rueckgabe' }); // nach 90 Tagen pseudonymisiert (F-27)

  // Nur Demo: lesbare Tokens 'demo' + Inventarnummer ohne Bindestrich, mit 'x' auf 22 Zeichen. Echte: neuerToken().
  const demoToken = (inv: string, zusatz = '') => `demo${inv.replace('-', '')}${zusatz}`.padEnd(22, 'x');
  const tokens: GeraetToken[] = [];
  for (const g of geraete) {
    const inv = g.inventarnummer!;
    if (inv === 'L-001') {
      tokens.push({
        id: uuid('d0000000', tokens.length + 1), organisationId: g.organisationId, geraetId: g.id, token: demoToken(inv, 'alt'),
        aktiv: false, erstelltAm: g.angelegtAm, deaktiviertAm: zeit(addTage(heute, -30), '10:00'),
      });
      ereignis(g.organisationId, {
        geraetId: g.id, typ: 'etikett_erneuert', akteurId: b.marco, akteurName: name(b.marco),
        zeitpunkt: zeit(addTage(heute, -30), '10:00'), daten: {},
      });
    }
    tokens.push({
      id: uuid('d0000000', tokens.length + 1), organisationId: g.organisationId, geraetId: g.id, token: demoToken(inv),
      aktiv: true, erstelltAm: inv === 'L-001' ? zeit(addTage(heute, -30), '10:00') : g.angelegtAm, deaktiviertAm: null,
    });
  }

  return {
    organisationen,
    standorte,
    bereiche,
    benutzer,
    mitgliedschaften,
    katalog,
    geraete,
    pruefarten,
    nachweise,
    pdfs,
    ereignisse,
    anlaesse,
    maengel,
    uebernahmen,
    tokens,
  };
}
