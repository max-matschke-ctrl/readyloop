import { describe, expect, it } from 'vitest';
import { ermittleFristVorschlag, legeFristFest, waehleKatalogEintrag, wirksamerEinsatzort } from './fristen';
import type { Einsatzort, FristVorschlag, GeraetPruefart, KatalogEintrag } from './types';

let zaehler = 0;
function eintrag(teil: Partial<KatalogEintrag> & Pick<KatalogEintrag, 'schluessel'>): KatalogEintrag {
  zaehler += 1;
  return {
    id: `k-${zaehler}`,
    version: 1,
    geraetegruppe: teil.schluessel.split('.')[0],
    geraetegruppeLabel: 'Test',
    pruefart: 'Wiederkehrende Prüfung',
    einsatzort: null,
    intervallMonate: 12,
    stufe: 'B',
    fundstelle: 'TRBS 1201 Anh. 4',
    quelleUrl: 'https://example.org/quelle',
    prueferTypen: ['zbp'],
    hinweis: null,
    freigabestatus: 'freigegeben',
    freigegebenVon: 'Dr. Test',
    freigegebenAm: '2026-11-01',
    ...teil,
  };
}

type PA = Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate' | 'herstellerfristQuelle'>;
const pa = (teil: Partial<PA> = {}): PA => ({
  katalogSchluessel: 'regal.experteninspektion',
  herstellerfristMonate: null,
  herstellerfristQuelle: null,
  ...teil,
});

function vorschlag(p: PA, katalog: KatalogEintrag[], einsatzort: Einsatzort = 'lager_logistik'): FristVorschlag {
  return ermittleFristVorschlag({ pruefart: p, einsatzort, katalog });
}

describe('wirksamerEinsatzort (F-1)', () => {
  it('Override am Gerät gewinnt', () =>
    expect(wirksamerEinsatzort({ einsatzort: 'baustelle' }, { einsatzort: 'buero' })).toBe('baustelle'));
  it('sonst Bereich', () => expect(wirksamerEinsatzort({ einsatzort: null }, { einsatzort: 'buero' })).toBe('buero'));
});

describe('waehleKatalogEintrag (F-2)', () => {
  const S = 'elektro_ortsveraenderlich.wiederholung';
  it('exakter Einsatzort schlägt null', () => {
    const allg = eintrag({ schluessel: S, intervallMonate: 6 });
    const bau = eintrag({ schluessel: S, einsatzort: 'baustelle', intervallMonate: 3 });
    expect(waehleKatalogEintrag([allg, bau], S, 'baustelle', 'freigegeben')).toBe(bau);
    expect(waehleKatalogEintrag([allg, bau], S, 'lager_logistik', 'freigegeben')).toBe(allg);
  });
  it('exakter Einsatzort schlägt null auch bei längerem Intervall', () => {
    const allg = eintrag({ schluessel: S, intervallMonate: 6 });
    const buero = eintrag({ schluessel: S, einsatzort: 'buero', intervallMonate: 24 });
    expect(waehleKatalogEintrag([allg, buero], S, 'buero', 'freigegeben')).toBe(buero);
  });
  it('Entwurf und zurückgezogen werden bei freigegeben ignoriert', () => {
    const entw = eintrag({ schluessel: S, freigabestatus: 'entwurf' });
    const zur = eintrag({ schluessel: S, freigabestatus: 'zurueckgezogen' });
    expect(waehleKatalogEintrag([entw, zur], S, 'buero', 'freigegeben')).toBeNull();
    expect(waehleKatalogEintrag([entw, zur], S, 'buero', 'entwurf')).toBe(entw);
  });
  it('höchste Version gewinnt', () => {
    const v1 = eintrag({ schluessel: S, version: 1, intervallMonate: 3 });
    const v2 = eintrag({ schluessel: S, version: 2, intervallMonate: 6 });
    expect(waehleKatalogEintrag([v1, v2], S, 'buero', 'freigegeben')).toBe(v2);
  });
  it('bei Gleichstand kürzestes Intervall', () => {
    const a = eintrag({ schluessel: S, intervallMonate: 12 });
    const b = eintrag({ schluessel: S, intervallMonate: 6 });
    const c = eintrag({ schluessel: S, intervallMonate: null });
    expect(waehleKatalogEintrag([a, c, b], S, 'buero', 'freigegeben')).toBe(b);
  });
  it('anderer Schlüssel → null', () =>
    expect(waehleKatalogEintrag([eintrag({ schluessel: 'x.y' })], S, 'buero', 'freigegeben')).toBeNull());
});

describe('ermittleFristVorschlag (F-3)', () => {
  it('Hersteller 6 < Katalog 12 → hersteller mit verdraengt', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion', intervallMonate: 12 });
    const v = vorschlag(pa({ herstellerfristMonate: 6, herstellerfristQuelle: 'BA Kap. 9' }), [k]);
    expect(v).toEqual({ art: 'hersteller', monate: 6, stufe: 'C', fundstelle: 'BA Kap. 9', verdraengt: k });
  });
  it('Hersteller 12 = Katalog 12 → katalog', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion', intervallMonate: 12 });
    const v = vorschlag(pa({ herstellerfristMonate: 12 }), [k]);
    expect(v.art).toBe('katalog');
    if (v.art === 'katalog') {
      expect(v).toMatchObject({ monate: 12, stufe: 'B', fundstelle: k.fundstelle, quelleUrl: k.quelleUrl });
      expect(v.eintrag).toBe(k);
    }
  });
  it('Hersteller ohne Eintrag → hersteller', () => {
    const v = vorschlag(pa({ katalogSchluessel: null, herstellerfristMonate: 6 }), []);
    expect(v).toMatchObject({ art: 'hersteller', monate: 6, fundstelle: 'Herstellerangabe', verdraengt: null });
  });
  it('Hersteller bei freigegebenem Eintrag ohne Intervall → hersteller', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion', intervallMonate: null });
    expect(vorschlag(pa({ herstellerfristMonate: 24 }), [k])).toMatchObject({ art: 'hersteller', verdraengt: k });
  });
  it('Entwurfseinträge erzeugen keine Frist: nur Entwurf → gbu/nur_entwurf mit orientierung', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion', freigabestatus: 'entwurf' });
    expect(vorschlag(pa(), [k])).toEqual({ art: 'gbu', grund: 'nur_entwurf', orientierung: k });
  });
  it('freigegebener Eintrag ohne Intervall → gbu/ohne_intervall', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion', intervallMonate: null });
    expect(vorschlag(pa(), [k])).toEqual({ art: 'gbu', grund: 'ohne_intervall', orientierung: k });
  });
  it('katalogSchluessel null → gbu/kein_eintrag', () => {
    const k = eintrag({ schluessel: 'regal.experteninspektion' });
    expect(vorschlag(pa({ katalogSchluessel: null }), [k])).toEqual({ art: 'gbu', grund: 'kein_eintrag', orientierung: null });
  });
  it('unbekannter Schlüssel → gbu/kein_eintrag', () => {
    expect(vorschlag(pa({ katalogSchluessel: 'gibt.es_nicht' }), [])).toMatchObject({ grund: 'kein_eintrag' });
  });
  it('ortsveränderlich: Baustelle → 3 Monate, Lager → 6 Monate', () => {
    const S = 'elektro_ortsveraenderlich.wiederholung';
    const kat = [eintrag({ schluessel: S, intervallMonate: 6 }), eintrag({ schluessel: S, einsatzort: 'baustelle', intervallMonate: 3 })];
    const p = pa({ katalogSchluessel: S });
    expect(vorschlag(p, kat, 'baustelle')).toMatchObject({ art: 'katalog', monate: 3 });
    expect(vorschlag(p, kat, 'lager_logistik')).toMatchObject({ art: 'katalog', monate: 6 });
  });
});

describe('legeFristFest (F-4)', () => {
  const S = 'kran_kraftbetrieben.wiederkehrend';
  const kranA = eintrag({ schluessel: S, intervallMonate: 12, stufe: 'A', version: 3, fundstelle: 'BetrSichV Anh. 3' });
  const regalB = eintrag({ schluessel: 'regal.experteninspektion', intervallMonate: 12, stufe: 'B' });
  const gbu = (monate: number) => ({ modus: 'gbu' as const, monate, fundstelle: 'GBU Lager 2025', begruendung: 'Einsatz im Einschichtbetrieb, geringe Last' });

  function ctx(p: PA, katalog: KatalogEintrag[]) {
    return { vorschlag: vorschlag(p, katalog), pruefart: p, einsatzort: 'lager_logistik' as const, katalog };
  }

  it('vorschlag bei gbu-Vorschlag → Fehler', () => {
    const r = legeFristFest({ modus: 'vorschlag' }, ctx(pa({ katalogSchluessel: null }), []));
    expect(r.ok).toBe(false);
  });
  it('vorschlag katalog: Snapshot enthält Katalog-ID und -Version', () => {
    const r = legeFristFest({ modus: 'vorschlag' }, ctx(pa({ katalogSchluessel: S }), [kranA]));
    expect(r).toEqual({
      ok: true,
      frist: {
        monate: 12,
        quelle: 'katalog',
        stufe: 'A',
        fundstelle: 'BetrSichV Anh. 3',
        quelleUrl: kranA.quelleUrl,
        katalogEintragId: kranA.id,
        katalogVersion: 3,
        begruendung: null,
      },
    });
  });
  it('vorschlag hersteller → Quelle hersteller, Stufe C', () => {
    const r = legeFristFest({ modus: 'vorschlag' }, ctx(pa({ katalogSchluessel: S, herstellerfristMonate: 6 }), [kranA]));
    expect(r.ok && r.frist).toMatchObject({ monate: 6, quelle: 'hersteller', stufe: 'C' });
  });
  it('Stufe-A-Höchstfrist nicht überschreitbar', () => {
    const r = legeFristFest(gbu(13), ctx(pa({ katalogSchluessel: S }), [kranA]));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.fehler).toMatch(/Höchstfrist/);
  });
  it('Stufe A: kürzere GBU-Frist erlaubt', () => {
    const r = legeFristFest(gbu(6), ctx(pa({ katalogSchluessel: S }), [kranA]));
    expect(r.ok).toBe(true);
  });
  it('Stufe-A-Entwurf begrenzt nicht (nur freigegebene Einträge)', () => {
    const entwurfA = { ...kranA, id: 'kA-e', freigabestatus: 'entwurf' as const };
    expect(legeFristFest(gbu(24), ctx(pa({ katalogSchluessel: S }), [entwurfA])).ok).toBe(true);
  });
  it('GBU über Herstellerfrist → Fehler', () => {
    const r = legeFristFest(gbu(12), ctx(pa({ herstellerfristMonate: 6 }), [regalB]));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.fehler).toMatch(/Herstellerfrist/);
  });
  it('GBU 24 bei Stufe-B-Richtwert 12 → ok, Stufe C, Orientierung referenziert', () => {
    const r = legeFristFest(gbu(24), ctx(pa(), [regalB]));
    expect(r).toEqual({
      ok: true,
      frist: {
        monate: 24,
        quelle: 'gbu',
        stufe: 'C',
        fundstelle: 'GBU Lager 2025',
        quelleUrl: null,
        katalogEintragId: regalB.id,
        katalogVersion: 1,
        begruendung: 'Einsatz im Einschichtbetrieb, geringe Last',
      },
    });
  });
  it('GBU-Pflichtfelder', () => {
    const c = ctx(pa(), []);
    expect(legeFristFest({ ...gbu(12), begruendung: 'kurz' }, c).ok).toBe(false);
    expect(legeFristFest({ ...gbu(12), fundstelle: ' x ' }, c).ok).toBe(false);
    expect(legeFristFest(gbu(0), c).ok).toBe(false);
    expect(legeFristFest(gbu(121), c).ok).toBe(false);
    expect(legeFristFest(gbu(1.5), c).ok).toBe(false);
  });
});
