// BE-10: Dienste Inkrement 2 gegen das Demo-Repository (Abnahme docs/backlog.md §4 BE-10).
import { beforeEach, describe, expect, it } from 'vitest';
import { addTage } from '@/domain/datum';
import { betriebsstatusSetzenSchema } from '@/domain/schemas';
import type { DemoRolle, FristStatus, Sitzung } from '@/domain/types';
import {
  anlassAufheben,
  anlassErfassen,
  betriebsstatusSetzen,
  fristFreigeben,
  gbuDokumentSetzen,
  geraetVerschieben,
  holeGeraetDetail,
  listeGeraete,
  listePrueferAufgaben,
  listePrueferOptionen,
  nachweisErfassen,
  prueferZuweisen,
  sitzungFuerDemoRolle,
} from '@/server/dienste';
import {
  holeMangel,
  holeMangelFormular,
  listeMaengel,
  listeMangelVerantwortliche,
  mangelBeheben,
  mangelErfassen,
  mangelKenntnisNehmen,
} from '@/server/dienste-maengel';
import {
  bereichSpeichern,
  holeMitglied,
  listeBereicheVerwaltung,
  listeMitglieder,
  MITGLIED_NACH_EINLADUNG_FEHLER,
  mitgliedAendern,
  mitgliedEinladen,
} from '@/server/dienste-verwaltung';
import { platzhalterPdf } from '@/server/pdf';
import { DEMO_BENUTZER_IDS, DEMO_BEREICH_IDS, DEMO_ORG2_ID, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { erzeugeDemoRepository, type DemoRepository } from '@/server/repo/demo/repository';

const HEUTE = '2026-11-19';
const JETZT = new Date('2026-11-19T10:00:00Z');
const ZEIT = { heute: HEUTE, jetzt: JETZT };
const SPAETER = new Date('2026-11-19T11:00:00Z');
let repo: DemoRepository;

const sitzung = async (rolle: DemoRolle, org?: string): Promise<Sitzung> => {
  const s = await sitzungFuerDemoRolle(repo, rolle, org);
  if (!s) throw new Error(rolle);
  return s;
};
const geraetVon = async (inv: string) => {
  const e = (await listeGeraete(await sitzung('admin'), repo, HEUTE)).find((g) => g.geraet.inventarnummer === inv);
  if (!e) throw new Error(inv);
  return e.geraet.id;
};
const detail = async (inv: string, rolle: DemoRolle = 'admin') =>
  (await holeGeraetDetail(await sitzung(rolle), repo, HEUTE, await geraetVon(inv)))!;
const pruefartVon = async (inv: string, i = 0) => (await detail(inv)).pruefarten[i].pruefart.id;
const pdf = { name: 'bericht.pdf', inhalt: platzhalterPdf('Test') };
const nachweis = (geraetPruefartId: string, teil: Record<string, unknown> = {}) => ({
  geraetPruefartId,
  pruefdatum: HEUTE,
  ergebnis: 'ohne_maengel' as const,
  pruefumfang: 'Wiederkehrende Prüfung',
  prueferName: 'Tobias Berger',
  unterschriftImPdf: true as const,
  pdf,
  ...teil,
});
const mangelEingabe = (geraetId: string, teil: Record<string, unknown> = {}) => ({
  geraetId,
  geraetPruefartId: null,
  nachweisId: null,
  beschreibung: 'Kette angerissen',
  schwere: 'erheblich' as const,
  termin: addTage(HEUTE, 30),
  verantwortlichId: DEMO_BENUTZER_IDS.marco,
  zurueck: null,
  ...teil,
});

beforeEach(() => {
  repo = erzeugeDemoRepository(HEUTE);
});

describe('Demo-Daten I2', () => {
  it('Statusverteilung erste Organisation; weiterhin 20 Geräte', async () => {
    const liste = await listeGeraete(await sitzung('admin'), repo, HEUTE);
    expect(liste).toHaveLength(20);
    const zahl = (s: FristStatus) => liste.filter((g) => g.gesamtStatus === s).map((g) => g.geraet.inventarnummer).sort();
    expect(zahl('ueberfaellig')).toEqual(['L-001', 'L-008']);
    expect(zahl('vor_nutzung_pruefen')).toEqual(['P-001', 'P-004', 'V-003']);
    expect(zahl('unbekannt')).toHaveLength(2);
    expect(zahl('gbu')).toHaveLength(3);
    expect(zahl('bald_faellig')).toHaveLength(3);
    expect(zahl('ok').length).toBeGreaterThanOrEqual(2);
  });

  it('Gründe für vor_nutzung_pruefen, Mängel und Hinweise', async () => {
    expect((await detail('P-001')).gesamtStatusGrund).toBe('anlass');
    expect((await detail('P-001')).pruefarten[0].offeneAnlaesse).toHaveLength(1);
    const p004 = await detail('P-004');
    expect(p004.gesamtStatusGrund).toBe('nicht_bestanden');
    expect(p004.maengel[0]).toMatchObject({ schwere: 'gefaehrlich', status: 'offen', verantwortlichName: 'Sabine Krüger' });
    expect(p004.pruefarten[0].maengelErfassenFuerNachweisId).toBeNull();
    expect((await detail('V-003')).gesamtStatusGrund).toBe('ausser_betrieb');
    const l003 = await detail('L-003');
    expect(l003.gesamtStatus).toBe('ok');
    expect(l003.maengel[0].terminUeberschritten).toBe(true);
    expect(l003.pruefarten[0].pruefart.gbuDokument?.titel).toBe('GBU Lager 2025, Abschn. 3 Regale');
    expect((await detail('L-001')).pruefarten[0]).toMatchObject({
      fristHinweis: 'empfehlung_abweichend',
      letzterNachweis: { fristEmpfehlungMonate: 6 },
    });
    expect((await detail('L-006')).maengel[0]).toMatchObject({ status: 'in_bearbeitung', verantwortlichName: 'Marco Lindner' });
    expect((await detail('L-008')).maengel[0].status).toBe('behoben');
    const liste = await listeGeraete(await sitzung('admin'), repo, HEUTE);
    expect(liste.find((g) => g.geraet.inventarnummer === 'L-003')!.offeneMaengel).toBe(1);
    expect(liste.find((g) => g.geraet.inventarnummer === 'L-008')!.offeneMaengel).toBe(0);
  });

  it('Qualifikationswarnung für Berger an Kranen (zbp gefordert)', async () => {
    const w = (await detail('P-001')).pruefarten[0].qualifikationsWarnung;
    expect(w).toContain('Zur Prüfung befähigte Person');
    expect(w).toContain('Elektrofachkraft, Sachkundiger');
    expect((await detail('L-006')).pruefarten[0].qualifikationsWarnung).toContain('Zur Prüfung befähigte Person');
    expect((await detail('L-001')).pruefarten[0].qualifikationsWarnung).toBeNull(); // Stapler: zbp oder Sachkundiger
  });

  it('Prüfer Berger: Organisation 2 → 2 Aufgaben, Organisation 1 → 6; organisationen alphabetisch', async () => {
    const org2 = await sitzung('pruefer', DEMO_ORG2_ID);
    expect(org2.organisation.name).toBe('Muster Metallbau GmbH');
    expect(await listePrueferAufgaben(org2, repo, HEUTE)).toHaveLength(2);
    const org1 = await sitzung('pruefer');
    expect(org1.organisation.id).toBe(DEMO_ORG_ID);
    expect(org1.organisationen.map((o) => o.name)).toEqual(['Elbtal Fördertechnik GmbH', 'Muster Metallbau GmbH']);
    expect(await listePrueferAufgaben(org1, repo, HEUTE)).toHaveLength(6);
    expect((await sitzung('admin', DEMO_ORG2_ID)).organisation.id).toBe(DEMO_ORG_ID); // Admin nur in Org 1
  });
});

describe('prueferZuweisen', () => {
  it('VER Lager für Produktion-Prüfart → Fehler', async () => {
    const r = await prueferZuweisen(await sitzung('verantwortlicher'), repo, { geraetPruefartId: await pruefartVon('P-003'), prueferId: DEMO_BENUTZER_IDS.tobias }, JETZT);
    expect(r.ok).toBe(false);
  });
  it('ADM → ok + Ereignis pruefer_zugewiesen; Prüfer sieht Aufgabe', async () => {
    const id = await pruefartVon('L-003');
    const r = await prueferZuweisen(await sitzung('admin'), repo, { geraetPruefartId: id, prueferId: DEMO_BENUTZER_IDS.tobias }, JETZT);
    expect(r.ok).toBe(true);
    const d = await detail('L-003');
    expect(d.verlauf[0]).toMatchObject({ typ: 'pruefer_zugewiesen', daten: { pruefartId: id, alt: null, neu: DEMO_BENUTZER_IDS.tobias, neuName: 'Tobias Berger' } });
    expect(await listePrueferAufgaben(await sitzung('pruefer'), repo, HEUTE)).toHaveLength(7);
    // Entfernen
    expect((await prueferZuweisen(await sitzung('verantwortlicher'), repo, { geraetPruefartId: id, prueferId: null }, JETZT)).ok).toBe(true);
    expect(await listePrueferAufgaben(await sitzung('pruefer'), repo, HEUTE)).toHaveLength(6);
  });
  it('an Sifa-Benutzer → Fehler; an deaktivierten Prüfer → Fehler', async () => {
    const id = await pruefartVon('L-003');
    const adm = await sitzung('admin');
    expect(await prueferZuweisen(adm, repo, { geraetPruefartId: id, prueferId: DEMO_BENUTZER_IDS.jens }, JETZT)).toMatchObject({ ok: false, feld: 'prueferId' });
    const berger = (await listeMitglieder(adm, repo)).find((m) => m.benutzer.id === DEMO_BENUTZER_IDS.tobias)!;
    const aus = await mitgliedAendern(adm, repo, { mitgliedschaftId: berger.mitgliedschaftId, name: 'Tobias Berger', rolle: 'pruefer', bereichIds: [], prueferTypen: ['efk'], aktiv: false }, JETZT);
    expect(aus.ok).toBe(true);
    expect(await prueferZuweisen(adm, repo, { geraetPruefartId: id, prueferId: DEMO_BENUTZER_IDS.tobias }, JETZT)).toMatchObject({ ok: false, feld: 'prueferId' });
    expect(await listePrueferOptionen(adm, repo)).toEqual([]);
    expect(await sitzungFuerDemoRolle(repo, 'pruefer')).not.toBeNull(); // Org 2 bleibt aktiv
    expect((await sitzungFuerDemoRolle(repo, 'pruefer'))!.organisation.id).toBe(DEMO_ORG2_ID);
  });
  it('Befund I2-2: deaktivierter zugewiesener Prüfer → Zuweisung bleibt, zugewiesenerPrueferAktiv false', async () => {
    const adm = await sitzung('admin');
    const vorher = (await detail('L-001')).pruefarten[0];
    expect(vorher).toMatchObject({ zugewiesenerPrueferName: 'Tobias Berger', zugewiesenerPrueferAktiv: true });
    expect(vorher.pruefart.zugewiesenerPrueferId).toBe(DEMO_BENUTZER_IDS.tobias);
    expect((await detail('L-003')).pruefarten[0].zugewiesenerPrueferAktiv).toBe(false); // nicht zugewiesen
    const berger = (await listeMitglieder(adm, repo)).find((m) => m.benutzer.id === DEMO_BENUTZER_IDS.tobias)!;
    const aus = await mitgliedAendern(adm, repo, { mitgliedschaftId: berger.mitgliedschaftId, name: 'Tobias Berger', rolle: 'pruefer', bereichIds: [], prueferTypen: ['efk'], aktiv: false }, JETZT);
    expect(aus.ok).toBe(true);
    const nachher = (await detail('L-001')).pruefarten[0];
    expect(nachher.pruefart.zugewiesenerPrueferId).toBe(DEMO_BENUTZER_IDS.tobias); // nicht still entfernt
    expect(nachher).toMatchObject({ zugewiesenerPrueferName: 'Tobias Berger', zugewiesenerPrueferAktiv: false });
    expect((await repo.listeEreignisse(DEMO_ORG_ID)).some((e) => e.typ === 'pruefer_zugewiesen' && e.zeitpunkt === JETZT.toISOString())).toBe(false);
    // Prüfer in Org 1 hat keine Aufgaben mehr (Sitzung fällt auf Org 2)
    expect((await sitzungFuerDemoRolle(repo, 'pruefer'))!.organisation.id).toBe(DEMO_ORG2_ID);
  });
  it('listePrueferOptionen nur mit pruefer.zuweisen', async () => {
    expect(await listePrueferOptionen(await sitzung('admin'), repo)).toEqual([
      { benutzerId: DEMO_BENUTZER_IDS.tobias, name: 'Tobias Berger', prueferTypen: ['efk', 'sachkundiger'] },
    ]);
    expect(await listePrueferOptionen(await sitzung('sifa'), repo)).toEqual([]);
  });
});

describe('gbuDokumentSetzen', () => {
  it('SIF setzt und entfernt Verweis mit Ereignis; ADM darf nicht', async () => {
    const id = await pruefartVon('P-006');
    const sif = await sitzung('sifa');
    expect((await gbuDokumentSetzen(sif, repo, { geraetPruefartId: id, titel: 'GBU Produktion 2025', url: 'https://intranet.example/gbu' }, JETZT)).ok).toBe(true);
    expect((await detail('P-006')).pruefarten[0].pruefart.gbuDokument).toEqual({ titel: 'GBU Produktion 2025', url: 'https://intranet.example/gbu' });
    expect((await gbuDokumentSetzen(sif, repo, { geraetPruefartId: id, titel: null, url: null }, SPAETER)).ok).toBe(true);
    const d = await detail('P-006');
    expect(d.pruefarten[0].pruefart.gbuDokument).toBeNull();
    expect(d.verlauf[0]).toMatchObject({ typ: 'gbu_dokument_gesetzt', daten: { neu: null } });
    expect((await gbuDokumentSetzen(await sitzung('admin'), repo, { geraetPruefartId: id, titel: 'X', url: null }, JETZT)).ok).toBe(false);
    expect(await gbuDokumentSetzen(sif, repo, { geraetPruefartId: id, titel: 'X', url: 'http://x' }, JETZT)).toMatchObject({ ok: false, feld: 'url' });
  });
});

describe('geraetVerschieben', () => {
  it('VER Lager → Produktion: Fehler', async () => {
    const r = await geraetVerschieben(await sitzung('verantwortlicher'), repo, { geraetId: await geraetVon('L-007'), bereichId: DEMO_BEREICH_IDS.produktion, begruendung: null }, JETZT);
    expect(r).toMatchObject({ ok: false, feld: 'bereichId' });
  });
  it('ADM L-007 → Produktion: Bereich geändert, Frist unverändert, Ereignis, Lager-VER sieht es nicht mehr', async () => {
    const vorher = await detail('L-007');
    const r = await geraetVerschieben(await sitzung('admin'), repo, { geraetId: vorher.geraet.id, bereichId: DEMO_BEREICH_IDS.produktion, begruendung: 'Umzug' }, JETZT);
    expect(r).toMatchObject({ ok: true, nochSichtbar: true });
    const nachher = await detail('L-007');
    expect(nachher.bereich.name).toBe('Produktion');
    expect(nachher.pruefarten[0].pruefart.frist).toEqual(vorher.pruefarten[0].pruefart.frist);
    expect(nachher.nachweise).toHaveLength(vorher.nachweise.length);
    expect(nachher.verlauf[0]).toMatchObject({ typ: 'geraet_verschoben', daten: { vonBereich: 'Lager', nachBereich: 'Produktion', begruendung: 'Umzug' } });
    expect(await holeGeraetDetail(await sitzung('verantwortlicher'), repo, HEUTE, vorher.geraet.id)).toBeNull();
    expect(await listeGeraete(await sitzung('verantwortlicher'), repo, HEUTE)).toHaveLength(7);
  });
});

describe('betriebsstatusSetzen', () => {
  it('V-003 → in_betrieb → überfällig; ausgemustert → Validierungsfehler', async () => {
    const id = await geraetVon('V-003');
    const r = await betriebsstatusSetzen(await sitzung('admin'), repo, { geraetId: id, betriebsstatus: 'in_betrieb', begruendung: null }, JETZT);
    expect(r.ok).toBe(true);
    const d = await detail('V-003');
    expect(d.gesamtStatus).toBe('ueberfaellig');
    expect(d.verlauf[0]).toMatchObject({ typ: 'betriebsstatus_geaendert', daten: { alt: 'ausser_betrieb', neu: 'in_betrieb' } });
    expect(betriebsstatusSetzenSchema.safeParse({ geraetId: id, betriebsstatus: 'ausgemustert', begruendung: '' }).success).toBe(false);
    expect((await betriebsstatusSetzen(await sitzung('sifa'), repo, { geraetId: id, betriebsstatus: 'ausser_betrieb', begruendung: null }, JETZT)).ok).toBe(false);
  });
});

describe('Anlass', () => {
  it('anlassErfassen L-003 → vor_nutzung_pruefen; Nachweis ohne_maengel heute → ok, Anlass erledigt', async () => {
    const ver = await sitzung('verantwortlicher');
    const g = await geraetVon('L-003');
    const p = await pruefartVon('L-003');
    const r = await anlassErfassen(ver, repo, { geraetId: g, geraetPruefartIds: [p], art: 'unfall_schadensfall', datum: HEUTE, beschreibung: 'Stapler hat Regal gerammt' }, ZEIT);
    expect(r.ok).toBe(true);
    let d = await detail('L-003');
    expect(d.pruefarten[0].status).toMatchObject({ status: 'vor_nutzung_pruefen', grund: 'anlass' });
    expect(d.verlauf[0]).toMatchObject({ typ: 'anlass_erfasst', daten: { art: 'unfall_schadensfall', datum: HEUTE } });
    expect((await nachweisErfassen(ver, repo, nachweis(p), { ...ZEIT, jetzt: SPAETER })).ok).toBe(true);
    d = await detail('L-003');
    expect(d.pruefarten[0].status.status).toBe('ok');
    expect(d.anlaesse[0]).toMatchObject({ offen: false, erledigtDurchNachweisId: d.nachweise[0].id });
  });
  it('Datum in der Zukunft, fremde Prüfart, ADM → Fehler', async () => {
    const ver = await sitzung('verantwortlicher');
    const g = await geraetVon('L-003');
    const p = await pruefartVon('L-003');
    const basis = { geraetId: g, geraetPruefartIds: [p], art: 'sonstiges' as const, datum: HEUTE, beschreibung: 'Test Anlass' };
    expect(await anlassErfassen(ver, repo, { ...basis, datum: addTage(HEUTE, 1) }, ZEIT)).toMatchObject({ ok: false, feld: 'datum' });
    expect(await anlassErfassen(ver, repo, { ...basis, geraetPruefartIds: [await pruefartVon('L-001')] }, ZEIT)).toMatchObject({ ok: false, feld: 'geraetPruefartIds' });
    expect((await anlassErfassen(await sitzung('admin'), repo, basis, ZEIT)).ok).toBe(false);
    expect((await anlassErfassen(await sitzung('pruefer'), repo, basis, ZEIT)).ok).toBe(false);
  });
  it('anlassAufheben: Grund < 10 Zeichen → Fehler; gültig → nicht mehr offen, Verlauf; zweites Mal → Fehler', async () => {
    const sif = await sitzung('sifa');
    const anlass = (await detail('P-001')).anlaesse[0];
    expect(await anlassAufheben(sif, repo, { anlassId: anlass.id, grund: 'zu kurz' }, JETZT)).toMatchObject({ ok: false, feld: 'grund' });
    expect((await anlassAufheben(sif, repo, { anlassId: anlass.id, grund: 'Schaden war am Nachbarkran' }, JETZT)).ok).toBe(true);
    const d = await detail('P-001');
    expect(d.anlaesse[0]).toMatchObject({ offen: false, aufgehobenVonName: 'Dr. Jens Hartmann', aufhebungsgrund: 'Schaden war am Nachbarkran' });
    expect(d.gesamtStatus).toBe('ok');
    expect(d.verlauf[0]).toMatchObject({ typ: 'anlass_aufgehoben', daten: { grund: 'Schaden war am Nachbarkran' } });
    expect((await anlassAufheben(sif, repo, { anlassId: anlass.id, grund: 'Schaden war am Nachbarkran' }, JETZT)).ok).toBe(false);
  });
  it('Befund I2-1: Nachweis am selben Tag, aber VOR dem Anlass erfasst → Anlass bleibt offen und ist aufhebbar', async () => {
    const ver = await sitzung('verantwortlicher');
    const g = await geraetVon('L-003');
    const p = await pruefartVon('L-003');
    expect((await nachweisErfassen(ver, repo, nachweis(p), ZEIT)).ok).toBe(true);
    const r = await anlassErfassen(ver, repo, { geraetId: g, geraetPruefartIds: [p], art: 'unfall_schadensfall', datum: HEUTE, beschreibung: 'Stapler hat Regal gerammt' }, { ...ZEIT, jetzt: SPAETER });
    expect(r.ok).toBe(true);
    const d = await detail('L-003');
    expect(d.anlaesse[0]).toMatchObject({ offen: true, erledigtDurchNachweisId: null });
    expect(d.pruefarten[0].status).toMatchObject({ status: 'vor_nutzung_pruefen', grund: 'anlass' });
    expect((await anlassAufheben(ver, repo, { anlassId: d.anlaesse[0].id, grund: 'Schaden betraf Nachbarregal' }, SPAETER)).ok).toBe(true);
  });
  it('Befund I2-3: durch Nachweis erledigter Anlass kann nicht aufgehoben werden', async () => {
    const ver = await sitzung('verantwortlicher');
    const g = await geraetVon('L-003');
    const p = await pruefartVon('L-003');
    const r = await anlassErfassen(ver, repo, { geraetId: g, geraetPruefartIds: [p], art: 'sonstiges', datum: HEUTE, beschreibung: 'Sturm über Nacht' }, ZEIT);
    expect(r.ok).toBe(true);
    expect((await nachweisErfassen(ver, repo, nachweis(p), { ...ZEIT, jetzt: SPAETER })).ok).toBe(true);
    const anlassId = (await detail('L-003')).anlaesse[0].id;
    expect(await anlassAufheben(ver, repo, { anlassId, grund: 'nachträglich aufheben wollen' }, SPAETER)).toMatchObject({ ok: false, fehler: 'Der Anlass ist nicht mehr offen.' });
    expect((await detail('L-003')).anlaesse[0]).toMatchObject({ offen: false, aufhebungsgrund: null });
  });
  it('Nachweis nicht_bestanden lässt Anlass offen', async () => {
    const p = await pruefartVon('P-001');
    expect((await nachweisErfassen(await sitzung('pruefer'), repo, nachweis(p, { ergebnis: 'nicht_bestanden' }), ZEIT)).ok).toBe(true);
    const d = await detail('P-001');
    expect(d.anlaesse[0].offen).toBe(true);
    expect(d.pruefarten[0].maengelErfassenFuerNachweisId).toBe(d.nachweise[0].id);
  });
});

describe('Mängel', () => {
  it('PRF ohne Prüfart → Fehler; mit zugewiesener Prüfart → ok, verantwortlichId null', async () => {
    const prf = await sitzung('pruefer');
    const g = await geraetVon('L-006');
    expect(await mangelErfassen(prf, repo, mangelEingabe(g), ZEIT)).toMatchObject({ ok: false, feld: 'geraetPruefartId' });
    const r = await mangelErfassen(prf, repo, mangelEingabe(g, { geraetPruefartId: await pruefartVon('L-006', 1) }), ZEIT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = await holeMangel(await sitzung('admin'), repo, HEUTE, r.id);
    expect(m).toMatchObject({ verantwortlichId: null, status: 'offen', erfasstVonName: 'Tobias Berger' });
    expect((await detail('L-006')).verlauf[0]).toMatchObject({ typ: 'mangel_erfasst', daten: { mangelId: r.id } });
  });
  it('PRF an nicht zugewiesener Prüfart → Fehler', async () => {
    const r = await mangelErfassen(await sitzung('pruefer'), repo, mangelEingabe(await geraetVon('L-003'), { geraetPruefartId: await pruefartVon('L-003') }), ZEIT);
    expect(r.ok).toBe(false);
  });
  it('aus Nachweis eines anderen Geräts → Fehler; Termin gestern → Fehler; ohne Verantwortlichen (VER) → Fehler', async () => {
    const ver = await sitzung('verantwortlicher');
    const fremd = (await detail('L-001')).nachweise[0].id;
    expect(await mangelErfassen(ver, repo, mangelEingabe(await geraetVon('L-002'), { nachweisId: fremd }), ZEIT)).toMatchObject({ ok: false, feld: 'nachweisId' });
    expect(await mangelErfassen(ver, repo, mangelEingabe(await geraetVon('L-002'), { termin: addTage(HEUTE, -1) }), ZEIT)).toMatchObject({ ok: false, feld: 'termin' });
    expect(await mangelErfassen(ver, repo, mangelEingabe(await geraetVon('L-002'), { verantwortlichId: null }), ZEIT)).toMatchObject({ ok: false, feld: 'verantwortlichId' });
    expect(await mangelErfassen(ver, repo, mangelEingabe(await geraetVon('L-002'), { verantwortlichId: DEMO_BENUTZER_IDS.tobias }), ZEIT)).toMatchObject({ ok: false, feld: 'verantwortlichId' });
    expect((await mangelErfassen(ver, repo, mangelEingabe(await geraetVon('P-003')), ZEIT)).ok).toBe(false);
  });
  it('aus Nachweis: Prüfart des Nachweises, Hinweis „Mängel noch nicht erfasst“ verschwindet', async () => {
    const prf = await sitzung('pruefer');
    const p = await pruefartVon('L-001');
    expect((await nachweisErfassen(prf, repo, nachweis(p, { ergebnis: 'maengel_weiterbetrieb', fristEmpfehlungMonate: 6 }), ZEIT)).ok).toBe(true);
    let d = await detail('L-001');
    const nid = d.nachweise[0].id;
    expect(d.pruefarten[0].maengelErfassenFuerNachweisId).toBe(nid);
    const form = await holeMangelFormular(prf, repo, HEUTE, d.geraet.id, { nachweisId: nid });
    expect(form).toMatchObject({ vorbelegtePruefartId: p, verantwortliche: [], nachweis: { id: nid } });
    expect(await holeMangelFormular(prf, repo, HEUTE, await geraetVon('L-002'), { nachweisId: nid })).toBeNull();
    expect((await mangelErfassen(prf, repo, mangelEingabe(d.geraet.id, { nachweisId: nid, verantwortlichId: DEMO_BENUTZER_IDS.marco }), ZEIT)).ok).toBe(true);
    d = await detail('L-001');
    expect(d.pruefarten[0].maengelErfassenFuerNachweisId).toBeNull();
    expect(d.maengel.find((m) => m.nachweisId === nid)).toMatchObject({ geraetPruefartId: p, verantwortlichId: null });
  });
  it('Kenntnis → in_bearbeitung gestempelt; Beheben in der Zukunft → Fehler; zweites Beheben → Fehler', async () => {
    const ver = await sitzung('verantwortlicher');
    const id = (await detail('L-003')).maengel[0].id;
    const k = await mangelKenntnisNehmen(ver, repo, { mangelId: id, verantwortlichId: DEMO_BENUTZER_IDS.marco, termin: addTage(HEUTE, 7) }, ZEIT);
    expect(k.ok).toBe(true);
    expect(await holeMangel(ver, repo, HEUTE, id)).toMatchObject({ status: 'in_bearbeitung', kenntnisVonName: 'Marco Lindner', kenntnisAm: JETZT.toISOString(), termin: addTage(HEUTE, 7), terminUeberschritten: false });
    expect((await mangelKenntnisNehmen(ver, repo, { mangelId: id, verantwortlichId: DEMO_BENUTZER_IDS.marco, termin: HEUTE }, ZEIT)).ok).toBe(false);
    const beheben = { mangelId: id, behobenDurch: 'Regalservice Elbe', behebung: 'Anfahrschutz neu verschraubt' };
    expect(await mangelBeheben(ver, repo, { ...beheben, behobenAm: addTage(HEUTE, 1) }, ZEIT)).toMatchObject({ ok: false, feld: 'behobenAm' });
    expect(await mangelBeheben(ver, repo, { ...beheben, behobenAm: addTage(HEUTE, -100) }, ZEIT)).toMatchObject({ ok: false, feld: 'behobenAm' });
    expect((await mangelBeheben(ver, repo, { ...beheben, behobenAm: HEUTE }, { heute: HEUTE, jetzt: SPAETER })).ok).toBe(true);
    expect((await mangelBeheben(ver, repo, { ...beheben, behobenAm: HEUTE }, ZEIT)).ok).toBe(false);
    const typen = (await detail('L-003')).verlauf.slice(0, 2).map((e) => e.typ);
    expect(typen).toEqual(['mangel_behoben', 'mangel_kenntnis']);
  });
  it('offen → behoben direkt; PRF darf nicht bearbeiten', async () => {
    const id = (await detail('P-004')).maengel[0].id;
    expect((await mangelBeheben(await sitzung('pruefer'), repo, { mangelId: id, behobenAm: HEUTE, behobenDurch: 'X Firma', behebung: 'Haube getauscht' }, ZEIT)).ok).toBe(false);
    expect((await mangelBeheben(await sitzung('admin'), repo, { mangelId: id, behobenAm: HEUTE, behobenDurch: 'Elektro Richter', behebung: 'Haube getauscht' }, ZEIT)).ok).toBe(true);
    const d = await detail('P-004');
    expect(d.gesamtStatusGrund).toBe('nicht_bestanden'); // gefährlicher Mangel behoben, Nachprüfung fehlt
  });
  it('Liste: VER sieht nur Lager-Mängel, Filter, Sortierung; Prüfer nur zugewiesene', async () => {
    const ver = await listeMaengel(await sitzung('verantwortlicher'), repo, HEUTE);
    expect(ver.map((m) => m.geraetBezeichnung)).toEqual(['Anschlagkette 2-Strang', 'Palettenregal Reihe A']);
    expect(ver.every((m) => m.bereichName === 'Lager')).toBe(true);
    const adm = await sitzung('admin');
    expect((await listeMaengel(adm, repo, HEUTE)).map((m) => m.schwere)).toEqual(['gefaehrlich', 'erheblich', 'gering']);
    expect(await listeMaengel(adm, repo, HEUTE, { status: 'behoben' })).toHaveLength(1);
    expect(await listeMaengel(adm, repo, HEUTE, { status: 'alle', bereichId: DEMO_BEREICH_IDS.produktion })).toHaveLength(1);
    expect(await listeMaengel(adm, repo, HEUTE, { schwere: 'gering' })).toHaveLength(1);
    expect((await listeMaengel(await sitzung('pruefer'), repo, HEUTE)).map((m) => m.geraetBezeichnung)).toEqual(['Anschlagkette 2-Strang']);
    expect(await holeMangel(await sitzung('verantwortlicher'), repo, HEUTE, (await detail('P-004')).maengel[0].id)).toBeNull();
  });
  it('Verantwortlichen-Liste: aktive admin/sifa/verantwortlicher, alphabetisch', async () => {
    expect((await listeMangelVerantwortliche(await sitzung('sifa'), repo)).map((p) => p.name)).toEqual([
      'Dr. Jens Hartmann', 'Katrin Vogel', 'Marco Lindner', 'Sabine Krüger',
    ]);
    expect(await listeMangelVerantwortliche(await sitzung('pruefer'), repo)).toEqual([]);
  });
});

describe('Verwaltung', () => {
  const einladen = (teil: Record<string, unknown> = {}) => ({
    email: 'neu@example.org',
    name: 'Nora Neumann',
    rolle: 'verantwortlicher' as const,
    bereichIds: [DEMO_BEREICH_IDS.lager],
    prueferTypen: [] as never[],
    ...teil,
  });

  it('neue E-Mail → neu; bekannte E-Mail anderer Organisation → Zugang ohne Einladung', async () => {
    const adm = await sitzung('admin');
    const r = await mitgliedEinladen(adm, repo, einladen(), JETZT);
    expect(r).toMatchObject({ ok: true, neu: true, meldung: 'Einladung an neu@example.org versendet.' });
    const uwe = await mitgliedEinladen(adm, repo, einladen({ email: 'U.Schmidt@muster-metallbau.example', name: 'Uwe Schmidt', rolle: 'pruefer', bereichIds: [DEMO_BEREICH_IDS.lager], prueferTypen: ['zbp'] }), JETZT);
    expect(uwe).toMatchObject({ ok: true, neu: false, meldung: 'Uwe Schmidt hat bereits ein Konto; Zugang angelegt.' });
    const m = (await listeMitglieder(adm, repo)).find((x) => x.benutzer.id === DEMO_BENUTZER_IDS.uwe)!;
    expect(m).toMatchObject({ rolle: 'pruefer', bereichIds: [], prueferTypen: ['zbp'] });
    const ev = (await repo.listeEreignisse(DEMO_ORG_ID)).filter((e) => e.typ === 'mitglied_gespeichert');
    expect(ev.map((e) => e.daten.eingeladen)).toEqual([true, false]);
  });
  it('bekannte E-Mail in derselben Organisation → Fehler email; VER ohne Bereich → Fehler bereichIds', async () => {
    const adm = await sitzung('admin');
    expect(await mitgliedEinladen(adm, repo, einladen({ email: 'm.lindner@elbtal-foerdertechnik.example' }), JETZT)).toMatchObject({ ok: false, feld: 'email' });
    expect(await mitgliedEinladen(adm, repo, einladen({ bereichIds: [] }), JETZT)).toMatchObject({ ok: false, feld: 'bereichIds' });
    expect((await mitgliedEinladen(await sitzung('sifa'), repo, einladen(), JETZT)).ok).toBe(false);
  });
  it('Befund I2-6: Fehler nach Einladung → „Konto angelegt, Zugang bitte erneut speichern.“; erneutes Speichern ok', async () => {
    const adm = await sitzung('admin');
    let scheitern = true;
    const wackelig = Object.assign(Object.create(repo) as DemoRepository, {
      speichereMitgliedschaft: async (d: Parameters<DemoRepository['speichereMitgliedschaft']>[0]) => {
        if (scheitern) throw new Error('Netzwerk');
        return repo.speichereMitgliedschaft(d);
      },
    });
    expect(await mitgliedEinladen(adm, wackelig, einladen(), JETZT)).toEqual({ ok: false, fehler: MITGLIED_NACH_EINLADUNG_FEHLER });
    expect((await listeMitglieder(adm, repo)).some((m) => m.benutzer.email === 'neu@example.org')).toBe(false);
    scheitern = false;
    expect(await mitgliedEinladen(adm, wackelig, einladen(), JETZT)).toMatchObject({ ok: true, neu: false });
    expect((await listeMitglieder(adm, repo)).filter((m) => m.benutzer.email === 'neu@example.org')).toHaveLength(1);
  });
  it('mitgliedAendern: letzter Admin auf sifa → Fehler; eigene Mitgliedschaft deaktivieren → Fehler', async () => {
    const adm = await sitzung('admin');
    const eigen = (await holeMitglied(adm, repo, adm.mitgliedschaftId))!;
    expect(eigen.istEigeneMitgliedschaft).toBe(true);
    const basis = { mitgliedschaftId: eigen.mitgliedschaftId, name: 'Katrin Vogel', rolle: 'admin' as const, bereichIds: [], prueferTypen: [], aktiv: true };
    expect(await mitgliedAendern(adm, repo, { ...basis, rolle: 'sifa' }, JETZT)).toMatchObject({ ok: false, feld: 'rolle' });
    expect(await mitgliedAendern(adm, repo, { ...basis, aktiv: false }, JETZT)).toMatchObject({ ok: false, feld: 'aktiv' });
    expect((await mitgliedAendern(adm, repo, { ...basis, name: 'Katrin Vogel-Berg' }, JETZT)).ok).toBe(true);
    expect((await holeMitglied(adm, repo, adm.mitgliedschaftId))!.benutzer.name).toBe('Katrin Vogel-Berg');
  });
  it('letzter aktiver Admin: auch durch anderen Admin nicht herabstufbar', async () => {
    const adm = await sitzung('admin');
    const zweit = await mitgliedEinladen(adm, repo, einladen({ email: 'admin2@example.org', name: 'Zweite Admin', rolle: 'admin', bereichIds: [] }), JETZT);
    expect(zweit.ok).toBe(true);
    if (!zweit.ok) return;
    // Zweite Admin stuft Katrin herab → erlaubt (es bleibt ein Admin)
    const zweiteSitzung: Sitzung = { ...adm, mitgliedschaftId: zweit.id, benutzer: { ...adm.benutzer, id: 'x' } };
    const katrin = { mitgliedschaftId: adm.mitgliedschaftId, name: 'Katrin Vogel', rolle: 'sifa' as const, bereichIds: [], prueferTypen: [], aktiv: true };
    expect((await mitgliedAendern(zweiteSitzung, repo, katrin, JETZT)).ok).toBe(true);
    // Jetzt ist die zweite Admin die letzte; Katrin (als Sitzung mit Admin-Rolle simuliert) kann sie nicht deaktivieren
    const r = await mitgliedAendern(adm, repo, { mitgliedschaftId: zweit.id, name: 'Zweite Admin', rolle: 'admin', bereichIds: [], prueferTypen: [], aktiv: false }, JETZT);
    expect(r).toMatchObject({ ok: false, feld: 'aktiv' });
  });
  it('Bereich anlegen und ändern mit Ereignis; Verwaltungslisten', async () => {
    const adm = await sitzung('admin');
    const r = await bereichSpeichern(adm, repo, { bereichId: null, name: 'Versand', einsatzort: 'lager_logistik' }, JETZT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(await bereichSpeichern(adm, repo, { bereichId: null, name: 'versand', einsatzort: 'buero' }, JETZT)).toMatchObject({ ok: false, feld: 'name' });
    expect((await bereichSpeichern(adm, repo, { bereichId: r.id, name: 'Versand', einsatzort: 'aussenbereich' }, JETZT)).ok).toBe(true);
    const ev = (await repo.listeEreignisse(DEMO_ORG_ID)).filter((e) => e.typ === 'bereich_gespeichert');
    expect(ev.map((e) => e.daten)).toEqual([
      { bereichId: r.id, name: 'Versand', einsatzortAlt: null, einsatzort: 'lager_logistik' },
      { bereichId: r.id, name: 'Versand', einsatzortAlt: 'lager_logistik', einsatzort: 'aussenbereich' },
    ]);
    const liste = await listeBereicheVerwaltung(adm, repo);
    expect(liste.map((b) => b.bereich.name)).toEqual(['Lager', 'Produktion', 'Verwaltung', 'Versand'].sort((a, b) => a.localeCompare(b, 'de')));
    expect(liste.find((b) => b.bereich.name === 'Lager')).toMatchObject({ geraeteAnzahl: 8, verantwortliche: [{ name: 'Marco Lindner' }] });
    expect(await listeBereicheVerwaltung(await sitzung('sifa'), repo)).toEqual([]);
    expect((await bereichSpeichern(await sitzung('verantwortlicher'), repo, { bereichId: null, name: 'X Bereich', einsatzort: 'buero' }, JETZT)).ok).toBe(false);
  });
});

describe('Frist mit Nachweisbezug (F-13)', () => {
  it('Ereignis enthält nachweisId und richtung; Nachweis anderer Prüfart → Fehler; Hinweis verschwindet', async () => {
    const sif = await sitzung('sifa');
    const l001 = await detail('L-001');
    const p = l001.pruefarten[0].pruefart.id;
    const nid = l001.pruefarten[0].letzterNachweis!.id;
    const gbu = { modus: 'gbu' as const, geraetPruefartId: p, monate: 6, fundstelle: 'GBU Lager 2026', begruendung: 'Prüfer empfiehlt kürzere Frist' };
    const fremd = (await detail('L-002')).nachweise[0].id;
    expect(await fristFreigeben(sif, repo, { ...gbu, nachweisId: fremd }, JETZT)).toMatchObject({ ok: false, feld: 'nachweisId' });
    expect((await fristFreigeben(sif, repo, { ...gbu, nachweisId: nid }, JETZT)).ok).toBe(true);
    const d = await detail('L-001');
    expect(d.verlauf[0]).toMatchObject({ typ: 'frist_freigegeben', daten: { nachweisId: nid, richtung: 'kuerzer', alt: { monate: 12 }, neu: { monate: 6 } } });
    expect(d.pruefarten[0].fristHinweis).toBeNull();
  });
  it('US-11: freigegebener Stufe-A-Eintrag 12 Monate → Verlängerung auf 18 abgelehnt, Frist unverändert', async () => {
    const sif = await sitzung('sifa');
    // Demo-Katalog besteht nur aus Entwürfen; für den Fall wird der Stapler-Eintrag als freigegeben simuliert.
    const freigegeben = Object.assign(Object.create(repo) as DemoRepository, {
      listeKatalog: async () =>
        (await repo.listeKatalog()).map((k) =>
          k.schluessel === 'flurfoerderzeug.wiederkehrend' ? { ...k, freigabestatus: 'freigegeben' as const, freigegebenVon: 'SI', freigegebenAm: '2026-11-01' } : k,
        ),
    });
    const l001 = (await holeGeraetDetail(sif, freigegeben, HEUTE, await geraetVon('L-001')))!;
    const pa = l001.pruefarten[0];
    expect(pa.katalogEintrag).toMatchObject({ stufe: 'A', intervallMonate: 12, freigabestatus: 'freigegeben' });
    expect(pa.pruefart.frist?.monate).toBe(12);
    const verlaengern = { modus: 'gbu' as const, geraetPruefartId: pa.pruefart.id, monate: 18, fundstelle: 'GBU Lager 2026', begruendung: 'Prüfer sieht guten Zustand', nachweisId: pa.letzterNachweis!.id };
    const r = await fristFreigeben(sif, freigegeben, verlaengern, JETZT);
    expect(r).toMatchObject({ ok: false, feld: 'monate' });
    expect(r.ok === false && r.fehler).toMatch(/Höchstfrist/);
    const danach = (await holeGeraetDetail(sif, freigegeben, HEUTE, l001.geraet.id))!;
    expect(danach.pruefarten[0].pruefart.frist).toEqual(pa.pruefart.frist);
    expect(danach.verlauf.filter((e) => e.typ === 'frist_freigegeben')).toHaveLength(l001.verlauf.filter((e) => e.typ === 'frist_freigegeben').length);
  });
  it('US-11: Verlängerung über die Herstellerfrist abgelehnt; Verkürzung darunter erlaubt', async () => {
    const sif = await sitzung('sifa');
    const l005 = await detail('L-005');
    const pa = l005.pruefarten[0];
    expect(pa.pruefart).toMatchObject({ herstellerfristMonate: 6, frist: { monate: 6, quelle: 'hersteller' } });
    const basis = { modus: 'gbu' as const, geraetPruefartId: pa.pruefart.id, fundstelle: 'GBU Lager 2026', begruendung: 'Nach Prüfung neu bewertet', nachweisId: pa.letzterNachweis?.id ?? null };
    const r = await fristFreigeben(sif, repo, { ...basis, monate: 9 }, JETZT);
    expect(r).toMatchObject({ ok: false, feld: 'monate' });
    expect(r.ok === false && r.fehler).toMatch(/Herstellerfrist von 6 Monaten/);
    expect((await detail('L-005')).pruefarten[0].pruefart.frist).toEqual(pa.pruefart.frist);
    expect((await fristFreigeben(sif, repo, { ...basis, monate: 4 }, JETZT)).ok).toBe(true);
    expect((await detail('L-005')).verlauf[0]).toMatchObject({ typ: 'frist_freigegeben', daten: { richtung: 'kuerzer', alt: { monate: 6 }, neu: { monate: 4 } } });
  });
});
