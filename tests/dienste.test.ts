import { beforeEach, describe, expect, it } from 'vitest';
import { addTage } from '@/domain/datum';
import { geraetAnlegenSchema } from '@/domain/schemas';
import type { DemoRolle, FristStatus, Sitzung } from '@/domain/types';
import {
  fristFreigeben,
  geraetAnlegen,
  holeGeraetDetail,
  holeNachweisKontext,
  holeNachweisPdf,
  listeBereiche,
  listeGeraete,
  listeGeraetegruppen,
  listePrueferAufgaben,
  nachweisErfassen,
  sitzungFuerDemoRolle,
  type NachweisDienstEingabe,
} from '@/server/dienste';
import { platzhalterPdf } from '@/server/pdf';
import { DEMO_BEREICH_IDS, erzeugeDemoStand } from '@/server/repo/demo/daten';
import { DEMO_MAX_HOCHGELADENE_PDFS, DemoRepository, erzeugeDemoRepository } from '@/server/repo/demo/repository';

const ZIEL: Record<string, FristStatus> = {
  'L-001': 'ueberfaellig', 'L-002': 'bald_faellig', 'L-003': 'ok', 'L-004': 'unbekannt', 'L-005': 'bald_faellig',
  'L-006': 'gbu', 'L-007': 'ok', 'L-008': 'ueberfaellig', 'P-001': 'ok', 'P-002': 'bald_faellig', 'P-003': 'ok',
  'P-004': 'ueberfaellig', 'P-005': 'unbekannt', 'P-006': 'gbu', 'P-007': 'gbu', 'P-008': 'ok', 'P-009': 'ok',
  'V-001': 'ok', 'V-002': 'ok', 'V-003': 'ueberfaellig',
};

// Mehrere Stichtage (inkl. Schaltjahr und Monatsenden), damit die Ampel unabhängig vom Datum stabil ist.
const STICHTAGE = ['2026-11-19', '2027-02-28', '2028-02-29', '2028-03-31', '2026-01-01'];

let repo: DemoRepository;
const HEUTE = '2026-11-19';
const JETZT = new Date('2026-11-19T10:00:00Z');
const sitzung = async (rolle: DemoRolle, r: DemoRepository = repo): Promise<Sitzung> => {
  const s = await sitzungFuerDemoRolle(r, rolle);
  if (!s) throw new Error(`keine Sitzung für ${rolle}`);
  return s;
};
const idVon = async (inv: string) => {
  const s = await sitzung('admin');
  const e = (await listeGeraete(s, repo, HEUTE)).find((g) => g.geraet.inventarnummer === inv);
  if (!e) throw new Error(inv);
  return e.geraet.id;
};
const pruefartVon = async (inv: string, index = 0) => {
  const d = await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon(inv));
  return d!.pruefarten[index].pruefart.id;
};

beforeEach(() => {
  repo = erzeugeDemoRepository(HEUTE);
});

describe('Demo-Daten', () => {
  it.each(STICHTAGE)('20 Geräte, 3 Bereiche, Zielstatus erreicht (heute = %s)', async (heute) => {
    const r = erzeugeDemoRepository(heute);
    const s = await sitzung('admin', r);
    const liste = await listeGeraete(s, r, heute);
    expect(liste).toHaveLength(20);
    expect(await listeBereiche(s, r)).toHaveLength(3);
    for (const e of liste) expect(`${e.geraet.inventarnummer}:${e.gesamtStatus}`).toBe(`${e.geraet.inventarnummer}:${ZIEL[e.geraet.inventarnummer!]}`);
    const zaehler = new Map<FristStatus, number>();
    for (const e of liste) zaehler.set(e.gesamtStatus, (zaehler.get(e.gesamtStatus) ?? 0) + 1);
    for (const st of ['ueberfaellig', 'unbekannt', 'gbu', 'bald_faellig', 'ok'] as const) {
      expect(zaehler.get(st) ?? 0, st).toBeGreaterThanOrEqual(2);
    }
  });

  it('Entwürfe: keine Prüfart hat einen Katalog-Vorschlag', async () => {
    const s = await sitzung('sifa');
    for (const g of await listeGeraete(s, repo, HEUTE)) {
      const d = await holeGeraetDetail(s, repo, HEUTE, g.geraet.id);
      for (const p of d!.pruefarten) expect(p.vorschlag.art).not.toBe('katalog');
    }
  });

  it('Nachweise und Altbestand wie spezifiziert', async () => {
    const s = await sitzung('admin');
    const l003 = await holeGeraetDetail(s, repo, HEUTE, await idVon('L-003'));
    expect(l003!.nachweise).toHaveLength(0);
    expect(l003!.pruefarten[0].pruefart.letztePruefungHerkunft).toBe('pruefbericht');
    const l008 = await holeGeraetDetail(s, repo, HEUTE, await idVon('L-008'));
    expect(l008!.nachweise.map((n) => n.ergebnis)).toEqual(['ohne_maengel', 'maengel_weiterbetrieb']);
    expect(l008!.verlauf[0].typ).toBe('nachweis_erfasst');
    expect(l008!.verlauf.map((e) => e.typ)).toContain('geraet_angelegt');
    expect(l008!.verlauf.map((e) => e.typ)).toContain('frist_freigegeben');
    const l005 = await holeGeraetDetail(s, repo, HEUTE, await idVon('L-005'));
    expect(l005!.pruefarten[0].pruefart.frist).toMatchObject({ quelle: 'hersteller', monate: 6, stufe: 'C' });
  });
});

describe('Lesen nach Rolle und Geltungsbereich', () => {
  it('VER sieht nur 8 Lager-Geräte, SIF und ADM 20', async () => {
    const ver = await listeGeraete(await sitzung('verantwortlicher'), repo, HEUTE);
    expect(ver).toHaveLength(8);
    expect(ver.every((g) => g.bereichName === 'Lager')).toBe(true);
    expect(await listeGeraete(await sitzung('sifa'), repo, HEUTE)).toHaveLength(20);
    expect(await listeGeraete(await sitzung('admin'), repo, HEUTE)).toHaveLength(20);
    expect((await listeBereiche(await sitzung('verantwortlicher'), repo)).map((b) => b.name)).toEqual(['Lager']);
  });

  it('VER: Gerätedetail außerhalb des Bereichs → null', async () => {
    expect(await holeGeraetDetail(await sitzung('verantwortlicher'), repo, HEUTE, await idVon('P-001'))).toBeNull();
  });

  it('PRF bekommt nur zugewiesene Prüfarten (6); Detail nicht zugewiesener Geräte → null', async () => {
    const prf = await sitzung('pruefer');
    const aufgaben = await listePrueferAufgaben(prf, repo, HEUTE);
    expect(aufgaben).toHaveLength(6);
    expect(aufgaben[0].gruppe).toBe('faellig');
    expect(aufgaben.at(-1)!.gruppe).toBe('spaeter');
    expect(await holeGeraetDetail(prf, repo, HEUTE, await idVon('L-003'))).toBeNull();
    const l006 = await holeGeraetDetail(prf, repo, HEUTE, await idVon('L-006'));
    expect(l006!.pruefarten).toHaveLength(2);
    expect(l006!.verlauf).toEqual([]);
    expect(await listePrueferAufgaben(await sitzung('sifa'), repo, HEUTE)).toEqual([]);
  });

  it('Sortierung der Liste: Schwere, dann Fälligkeit', async () => {
    const liste = await listeGeraete(await sitzung('admin'), repo, HEUTE);
    expect(liste[0].gesamtStatus).toBe('ueberfaellig');
    expect(liste.at(-1)!.gesamtStatus).toBe('ok');
  });

  it('Filter Bereich, Status, Suche', async () => {
    const s = await sitzung('admin');
    expect(await listeGeraete(s, repo, HEUTE, { bereichId: DEMO_BEREICH_IDS.verwaltung })).toHaveLength(3);
    expect((await listeGeraete(s, repo, HEUTE, { status: 'unbekannt' })).map((g) => g.geraet.inventarnummer).sort()).toEqual(['L-004', 'P-005']);
    expect((await listeGeraete(s, repo, HEUTE, { suche: 'linde' })).map((g) => g.geraet.inventarnummer)).toEqual(['L-001']);
  });

  it('Gerätegruppen alphabetisch, Entwürfe gekennzeichnet', async () => {
    const gruppen = await listeGeraetegruppen(repo);
    expect(gruppen.map((g) => g.label)).toEqual([...gruppen.map((g) => g.label)].sort((a, b) => a.localeCompare(b, 'de')));
    const elektro = gruppen.find((g) => g.schluessel === 'elektro_ortsveraenderlich')!;
    expect(elektro.pruefarten).toEqual([
      { schluessel: 'elektro_ortsveraenderlich.wiederholung', bezeichnung: 'Wiederholungsprüfung', stufe: 'B', intervallMonate: 6, freigabestatus: 'entwurf' },
    ]);
    expect(gruppen.find((g) => g.schluessel === 'lastaufnahmemittel')!.pruefarten).toHaveLength(2);
  });

  it('PDF nur im Geltungsbereich', async () => {
    const admin = await sitzung('admin');
    const p001 = await holeGeraetDetail(admin, repo, HEUTE, await idVon('P-001'));
    const nid = p001!.nachweise[0].id;
    const pdf = await holeNachweisPdf(admin, repo, nid);
    expect(new TextDecoder().decode(pdf!.inhalt.subarray(0, 5))).toBe('%PDF-');
    expect(await holeNachweisPdf(await sitzung('verantwortlicher'), repo, nid)).toBeNull();
    expect(await holeNachweisPdf(await sitzung('pruefer'), repo, nid)).not.toBeNull();
    const v001 = await holeGeraetDetail(admin, repo, HEUTE, await idVon('V-001'));
    expect(await holeNachweisPdf(await sitzung('pruefer'), repo, v001!.nachweise[0].id)).toBeNull();
  });
});

describe('geraetAnlegen', () => {
  const eingabe = (bereichId: string, inv: string | null = 'L-100') =>
    geraetAnlegenSchema.parse({
      bezeichnung: 'Hubwagen manuell',
      inventarnummer: inv ?? '',
      bereichId,
      geraetegruppe: 'flurfoerderzeug',
      kategorie: 'wechselnd',
      hersteller: '',
      typ: '',
      seriennummer: '',
      baujahr: '',
      einsatzort: '',
      pruefartenJson: JSON.stringify([
        { katalogSchluessel: 'flurfoerderzeug.wiederkehrend', bezeichnung: 'Wiederkehrende Prüfung', herstellerfristMonate: null, herstellerfristQuelle: null, letztePruefung: null, letztePruefungHerkunft: 'unbekannt' },
      ]),
    });

  it('als VER in Produktion → Fehler', async () => {
    const r = await geraetAnlegen(await sitzung('verantwortlicher'), repo, eingabe(DEMO_BEREICH_IDS.produktion), { heute: HEUTE, jetzt: JETZT });
    expect(r).toMatchObject({ ok: false, feld: 'bereichId' });
  });

  it('als VER in Lager → Gerät + Ereignis, ohne Frist → gbu', async () => {
    const ver = await sitzung('verantwortlicher');
    const r = await geraetAnlegen(ver, repo, eingabe(DEMO_BEREICH_IDS.lager), { heute: HEUTE, jetzt: JETZT });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = await holeGeraetDetail(ver, repo, HEUTE, r.id);
    expect(d!.gesamtStatus).toBe('gbu');
    expect(d!.verlauf).toHaveLength(1);
    expect(d!.verlauf[0]).toMatchObject({ typ: 'geraet_angelegt', akteurName: 'Marco Lindner' });
    expect(await listeGeraete(ver, repo, HEUTE)).toHaveLength(9);
  });

  it('doppelte Inventarnummer → Feldfehler', async () => {
    const r = await geraetAnlegen(await sitzung('admin'), repo, eingabe(DEMO_BEREICH_IDS.lager, 'l-001'), { heute: HEUTE, jetzt: JETZT });
    expect(r).toMatchObject({ ok: false, feld: 'inventarnummer' });
  });

  it('SIF und PRF dürfen nicht anlegen', async () => {
    for (const rolle of ['sifa', 'pruefer'] as const) {
      const r = await geraetAnlegen(await sitzung(rolle), repo, eingabe(DEMO_BEREICH_IDS.lager), { heute: HEUTE, jetzt: JETZT });
      expect(r.ok).toBe(false);
    }
  });
});

describe('fristFreigeben', () => {
  const gbu = (geraetPruefartId: string, monate: number) => ({
    modus: 'gbu' as const,
    geraetPruefartId,
    monate,
    fundstelle: 'GBU Produktion 2026',
    begruendung: 'Einsatz im Einschichtbetrieb bewertet',
    nachweisId: null,
  });

  it('als ADM → Fehler', async () => {
    const r = await fristFreigeben(await sitzung('admin'), repo, gbu(await pruefartVon('P-006'), 12), JETZT);
    expect(r.ok).toBe(false);
  });

  it('als SIF mit GBU über Herstellerfrist (L-005) → Fehler', async () => {
    const r = await fristFreigeben(await sitzung('sifa'), repo, gbu(await pruefartVon('L-005'), 12), JETZT);
    expect(r).toMatchObject({ ok: false, feld: 'monate' });
  });

  it('als SIF GBU-Frist für P-006 → Status unbekannt, Ereignis mit alt/neu', async () => {
    const sif = await sitzung('sifa');
    const r = await fristFreigeben(sif, repo, gbu(await pruefartVon('P-006'), 12), JETZT);
    expect(r.ok).toBe(true);
    const d = await holeGeraetDetail(sif, repo, HEUTE, await idVon('P-006'));
    expect(d!.gesamtStatus).toBe('unbekannt');
    expect(d!.pruefarten[0].pruefart.frist).toMatchObject({ quelle: 'gbu', stufe: 'C', freigegebenVonName: 'Dr. Jens Hartmann', freigegebenAm: JETZT.toISOString() });
    expect(d!.verlauf[0]).toMatchObject({ typ: 'frist_freigegeben', daten: { alt: null } });
  });

  it('Neufestlegung behält alte Frist im Verlauf', async () => {
    const sif = await sitzung('sifa');
    const id = await pruefartVon('L-001');
    expect((await fristFreigeben(sif, repo, gbu(id, 6), JETZT)).ok).toBe(true);
    const d = await holeGeraetDetail(sif, repo, HEUTE, await idVon('L-001'));
    expect(d!.verlauf[0].daten).toMatchObject({ alt: { monate: 12 }, neu: { monate: 6 } });
  });

  it('Modus vorschlag bei Entwurf → Fehler; bei Herstellerfrist → ok', async () => {
    const sif = await sitzung('sifa');
    expect((await fristFreigeben(sif, repo, { modus: 'vorschlag', geraetPruefartId: await pruefartVon('P-006'), nachweisId: null }, JETZT)).ok).toBe(false);
    expect((await fristFreigeben(sif, repo, { modus: 'vorschlag', geraetPruefartId: await pruefartVon('L-005'), nachweisId: null }, JETZT)).ok).toBe(true);
  });

  it('VER nur im eigenen Bereich', async () => {
    const ver = await sitzung('verantwortlicher');
    expect((await fristFreigeben(ver, repo, gbu(await pruefartVon('P-006'), 12), JETZT)).ok).toBe(false);
    expect((await fristFreigeben(ver, repo, gbu(await pruefartVon('L-006', 1), 36), JETZT)).ok).toBe(true);
  });
});

describe('nachweisErfassen', () => {
  const eingabe = (geraetPruefartId: string, teil: Partial<NachweisDienstEingabe> = {}): NachweisDienstEingabe => ({
    geraetPruefartId,
    pruefdatum: HEUTE,
    ergebnis: 'ohne_maengel',
    pruefumfang: 'Wiederkehrende Prüfung',
    prueferName: 'Tobias Berger',
    unterschriftImPdf: true,
    pdf: { name: 'bericht.pdf', inhalt: platzhalterPdf('Test') },
    ...teil,
  });

  it('als PRF für L-001 → Status ok, Ereignis vorhanden', async () => {
    const prf = await sitzung('pruefer');
    const r = await nachweisErfassen(prf, repo, eingabe(await pruefartVon('L-001')), { heute: HEUTE, jetzt: JETZT });
    expect(r.ok).toBe(true);
    const d = await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon('L-001'));
    expect(d!.gesamtStatus).toBe('ok');
    expect(d!.pruefarten[0].pruefart).toMatchObject({ letztePruefung: HEUTE, letztePruefungHerkunft: 'nachweis' });
    expect(d!.verlauf[0]).toMatchObject({ typ: 'nachweis_erfasst', akteurName: 'Tobias Berger' });
    expect(d!.nachweise[0]).toMatchObject({ prueferBenutzerId: prf.benutzer.id, pdfUrl: expect.stringMatching(/^\/api\/nachweise\//) });
  });

  it('mit nicht_bestanden → Status unverändert, weiterbetriebUnzulaessig', async () => {
    const r = await nachweisErfassen(await sitzung('pruefer'), repo, eingabe(await pruefartVon('L-001'), { ergebnis: 'nicht_bestanden' }), { heute: HEUTE, jetzt: JETZT });
    expect(r.ok).toBe(true);
    const d = await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon('L-001'));
    expect(d!.gesamtStatus).toBe('ueberfaellig');
    expect(d!.pruefarten[0].weiterbetriebUnzulaessig).toBe(true);
    expect(d!.pruefarten[0].pruefart.letztePruefung).toBe(addTage(HEUTE, -400));
  });

  it('älteres Prüfdatum schreibt letzte Prüfung nicht zurück', async () => {
    const id = await pruefartVon('L-002');
    const vorher = (await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon('L-002')))!.pruefarten[0].pruefart.letztePruefung;
    await nachweisErfassen(await sitzung('pruefer'), repo, eingabe(id, { pruefdatum: addTage(HEUTE, -500) }), { heute: HEUTE, jetzt: JETZT });
    const nachher = (await holeGeraetDetail(await sitzung('admin'), repo, HEUTE, await idVon('L-002')))!.pruefarten[0].pruefart.letztePruefung;
    expect(nachher).toBe(vorher);
  });

  it('Prüfdatum in der Zukunft → Fehler', async () => {
    const r = await nachweisErfassen(await sitzung('pruefer'), repo, eingabe(await pruefartVon('L-001'), { pruefdatum: addTage(HEUTE, 1) }), { heute: HEUTE, jetzt: JETZT });
    expect(r).toMatchObject({ ok: false, feld: 'pruefdatum' });
  });

  it('kein PDF → Fehler', async () => {
    const r = await nachweisErfassen(await sitzung('pruefer'), repo, eingabe(await pruefartVon('L-001'), { pdf: { name: 'x.pdf', inhalt: new TextEncoder().encode('hallo') } }), { heute: HEUTE, jetzt: JETZT });
    expect(r).toMatchObject({ ok: false, feld: 'pdf' });
  });

  it('PRF nicht zugewiesen, ADM, SIF → Fehler; VER im Bereich → ok', async () => {
    const t = { heute: HEUTE, jetzt: JETZT };
    expect((await nachweisErfassen(await sitzung('pruefer'), repo, eingabe(await pruefartVon('L-003')), t)).ok).toBe(false);
    expect((await nachweisErfassen(await sitzung('admin'), repo, eingabe(await pruefartVon('L-003')), t)).ok).toBe(false);
    expect((await nachweisErfassen(await sitzung('sifa'), repo, eingabe(await pruefartVon('L-003')), t)).ok).toBe(false);
    expect((await nachweisErfassen(await sitzung('verantwortlicher'), repo, eingabe(await pruefartVon('P-001')), t)).ok).toBe(false);
    expect((await nachweisErfassen(await sitzung('verantwortlicher'), repo, eingabe(await pruefartVon('L-003')), t)).ok).toBe(true);
  });

  it('Nachweiskontext nur bei Recht', async () => {
    expect(await holeNachweisKontext(await sitzung('pruefer'), repo, HEUTE, await pruefartVon('L-001'))).not.toBeNull();
    expect(await holeNachweisKontext(await sitzung('pruefer'), repo, HEUTE, await pruefartVon('L-003'))).toBeNull();
    expect(await holeNachweisKontext(await sitzung('admin'), repo, HEUTE, await pruefartVon('L-001'))).toBeNull();
  });
});

describe('Repository-Isolation', () => {
  it('Rückgaben sind Kopien', async () => {
    const g = await repo.holeGeraet((await repo.listeGeraete((await sitzung('admin')).organisation.id))[0].id);
    g!.bezeichnung = 'manipuliert';
    expect((await repo.holeGeraet(g!.id))!.bezeichnung).not.toBe('manipuliert');
  });
});

describe('Demo-PDF-Speicher', () => {
  it('Standardgrenze 50 hochgeladene PDFs', () => {
    expect(DEMO_MAX_HOCHGELADENE_PDFS).toBe(50);
  });

  it('verwirft über der Grenze das älteste hochgeladene PDF, Demo-PDFs bleiben', async () => {
    const r = new DemoRepository(erzeugeDemoStand(HEUTE), 2);
    const s = await sitzung('pruefer', r);
    const d = await holeGeraetDetail(await sitzung('admin', r), r, HEUTE, (await listeGeraete(await sitzung('admin', r), r, HEUTE)).find((g) => g.geraet.inventarnummer === 'L-001')!.geraet.id);
    const pid = d!.pruefarten[0].pruefart.id;
    const demoNachweis = (await r.listeNachweise(s.organisation.id))[0];
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const e = await nachweisErfassen(s, r, {
        geraetPruefartId: pid,
        pruefdatum: HEUTE,
        ergebnis: 'ohne_maengel',
        pruefumfang: 'Wiederkehrende Prüfung',
        prueferName: 'Tobias Berger',
        unterschriftImPdf: true,
        pdf: { name: `b${i}.pdf`, inhalt: platzhalterPdf(`Test ${i}`) },
      }, { heute: HEUTE, jetzt: JETZT });
      expect(e.ok).toBe(true);
      const neu = (await r.listeNachweise(s.organisation.id)).at(-1)!;
      ids.push(neu.id);
    }
    expect(await r.holeNachweisPdf(ids[0])).toBeNull();
    expect(await r.holeNachweisPdf(ids[1])).not.toBeNull();
    expect(await r.holeNachweisPdf(ids[2])).not.toBeNull();
    if (demoNachweis) expect(await r.holeNachweisPdf(demoNachweis.id)).not.toBeNull();
  });
});
