// BE-13/BE-14: Supabase-Repository gegen einen aufzeichnenden Fake-Client.
import { describe, expect, it, vi } from 'vitest';
import { erzeugeDemoStand } from '@/server/repo/demo/daten';
import { RepositoryFehler, vonGeraet, vonNachweis } from '@/server/repo/supabase/mapping';
import { supabaseRepository } from '@/server/repo/supabase/repository';
import { fakeSupabase, type Aufruf } from './hilfen/fake-supabase';

const stand = erzeugeDemoStand('2026-11-19');
const ORG = stand.organisationen[0].id;
const ereignis = stand.ereignisse[0];

describe('Lesen', () => {
  it('Spaltenauswahl, Filter und Mapping', async () => {
    const g = stand.geraete[0];
    const { client, aufrufe } = fakeSupabase((a) =>
      a.tabelle === 'geraet' ? { data: [{ ...vonGeraet(g), angelegt_am: '2024-09-10 08:00:00+00' }] } : { data: [] },
    );
    const repo = supabaseRepository(client, ORG);
    const [geraet] = await repo.listeGeraete(ORG);
    expect(geraet).toEqual({ ...g, angelegtAm: '2024-09-10T08:00:00.000Z' });
    expect(aufrufe[0]).toMatchObject({ tabelle: 'geraet', op: 'select', filter: [['eq', 'organisation_id', ORG]] });
    expect(aufrufe[0].spalten).not.toBe('*');
    expect(aufrufe[0].spalten).toContain('betriebsstatus');
  });
  it('Mitgliedschaften mit Bereichen aus bereich_verantwortung', async () => {
    const m = stand.mitgliedschaften.find((x) => x.rolle === 'verantwortlicher')!;
    const b = stand.benutzer.find((x) => x.id === m.benutzerId)!;
    const { client, aufrufe } = fakeSupabase((a) => {
      if (a.tabelle === 'mitgliedschaft') {
        return { data: [{ id: m.id, organisation_id: ORG, benutzer_id: b.id, anzeigename: b.name, email: b.email, rolle: m.rolle, aktiv: true, pruefer_typen: [] }] };
      }
      if (a.tabelle === 'bereich_verantwortung') return { data: m.bereichIds.map((bereich_id) => ({ mitgliedschaft_id: m.id, bereich_id })) };
      return { data: [] };
    });
    const repo = supabaseRepository(client, ORG);
    expect(await repo.listeMitgliedschaften(ORG)).toEqual([m]);
    expect(aufrufe[1]).toMatchObject({ tabelle: 'bereich_verantwortung', filter: [['in', 'mitgliedschaft_id', [m.id]]] });
    expect(await repo.holeBenutzer(b.id)).toEqual(b);
    expect(aufrufe.at(-1)!.filter).toEqual([['eq', 'benutzer_id', b.id], ['eq', 'organisation_id', ORG]]);
  });
  it('holeX: maybeSingle, null bei fehlender Zeile', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    const repo = supabaseRepository(client, ORG);
    expect(await repo.holePruefart('x')).toBeNull();
    expect(aufrufe[0]).toMatchObject({ einzeln: true, filter: [['eq', 'id', 'x']] });
  });
  it('Ereignisse absteigend, optional je Gerät', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: [] }));
    await supabaseRepository(client, ORG).listeEreignisse(ORG, 'g1');
    expect(aufrufe[0]).toMatchObject({ filter: [['eq', 'organisation_id', ORG], ['eq', 'geraet_id', 'g1']], sortierung: ['zeitpunkt', { ascending: false }] });
  });
  it('holeNachweisPdf lädt über den Benutzer-Client aus dem Pfad der Nachweis-Zeile', async () => {
    const n = stand.nachweise[0];
    const pdf = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])]);
    const { client, aufrufe } = fakeSupabase((a) =>
      a.art === 'download' ? { data: pdf } : { data: { pdf_pfad: vonNachweis(n).pdf_pfad } },
    );
    const inhalt = await supabaseRepository(client, ORG).holeNachweisPdf(n.id);
    expect(new TextDecoder().decode(inhalt!)).toBe('%PDF-');
    expect(aufrufe[1]).toMatchObject({ art: 'download', tabelle: 'nachweise', pfad: vonNachweis(n).pdf_pfad });
  });
  it('Download verweigert (Storage-RLS) → null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client } = fakeSupabase((a) => (a.art === 'download' ? { error: { message: 'not found' } } : { data: { pdf_pfad: 'p' } }));
    expect(await supabaseRepository(client, ORG).holeNachweisPdf('n')).toBeNull();
  });
  it('Lesefehler → RepositoryFehler mit deutscher Meldung', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client } = fakeSupabase(() => ({ error: { code: '42501', message: 'permission denied' } }));
    await expect(supabaseRepository(client, ORG).listeBereiche(ORG)).rejects.toMatchObject({
      name: 'RepositoryFehler',
      meldung: 'Keine Berechtigung für diese Aktion.',
    });
  });
});

describe('Schreiben I1', () => {
  it('legeGeraetAn über RPC geraet_anlegen, Prüfarten ohne Frist', async () => {
    const g = stand.geraete[0];
    const p = stand.pruefarten.filter((x) => x.geraetId === g.id);
    const { client, aufrufe } = fakeSupabase(() => ({ data: g.id }));
    await supabaseRepository(client, ORG).legeGeraetAn({ geraet: g, pruefarten: p, ereignis });
    expect(aufrufe).toHaveLength(1);
    const { name, args } = aufrufe[0] as Aufruf & { args: { p_geraet: Record<string, unknown>; p_pruefarten: Record<string, unknown>[] } };
    expect(name).toBe('geraet_anlegen');
    expect(args.p_geraet).toMatchObject({ id: g.id, organisation_id: ORG, bereich_id: g.bereichId, kategorie: g.kategorie });
    expect(args.p_geraet).not.toHaveProperty('betriebsstatus');
    expect(args.p_pruefarten[0]).toEqual({
      id: p[0].id, katalog_schluessel: p[0].katalogSchluessel, bezeichnung: p[0].bezeichnung,
      herstellerfrist_monate: null, herstellerfrist_quelle: null, letzte_pruefung: p[0].letztePruefung, letzte_pruefung_herkunft: p[0].letztePruefungHerkunft,
    });
    expect(JSON.stringify(args)).not.toMatch(/"frist_/);
  });
  it('setzeFrist über RPC frist_setzen mit Nachweisbezug; Trigger-Fehler 23514 → Meldung', async () => {
    const p = stand.pruefarten.find((x) => x.frist)!;
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    await supabaseRepository(client, ORG).setzeFrist({ pruefartId: p.id, frist: p.frist!, nachweisId: 'n1', ereignis });
    expect(aufrufe[0]).toMatchObject({ name: 'frist_setzen', args: { p_pruefart: p.id, p_nachweis: 'n1', p_frist: { frist_monate: p.frist!.monate, frist_quelle: 'gbu' } } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fehl = fakeSupabase(() => ({ error: { code: '23514', message: 'GBU-Frist überschreitet die Herstellerfrist' } }));
    await expect(supabaseRepository(fehl.client, ORG).setzeFrist({ pruefartId: p.id, frist: p.frist!, nachweisId: null, ereignis }))
      .rejects.toMatchObject({ meldung: 'GBU-Frist überschreitet die Herstellerfrist.', code: '23514' });
  });
  it('erfasseNachweis: erst Upload (application/pdf, upsert false), dann Insert mit derselben ID', async () => {
    const n = stand.nachweise[0];
    const pdf = new Uint8Array([1, 2, 3]);
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    await supabaseRepository(client, ORG).erfasseNachweis({ nachweis: n, pdf, letztePruefung: n.pruefdatum, ereignis });
    expect(aufrufe.map((a) => a.art)).toEqual(['upload', 'from']);
    const pfad = `${n.organisationId}/${n.geraetId}/${n.geraetPruefartId}/${n.id}.pdf`;
    expect(aufrufe[0]).toMatchObject({ tabelle: 'nachweise', pfad, werte: pdf, optionen: { contentType: 'application/pdf', upsert: false } });
    expect(aufrufe[1]).toMatchObject({ tabelle: 'nachweis', op: 'insert', werte: { id: n.id, pdf_pfad: pfad, erfasst_von: n.erfasstVon } });
    expect(aufrufe[1].werte).not.toHaveProperty('erfasst_am');
    expect(aufrufe[1].werte).not.toHaveProperty('letzte_pruefung');
  });
  it('Upload scheitert → kein Insert; Insert scheitert → Datei verwaist und geloggt', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const n = stand.nachweise[0];
    const a = fakeSupabase((x) => (x.art === 'upload' ? { error: { message: 'Duplicate' } } : { data: null }));
    await expect(supabaseRepository(a.client, ORG).erfasseNachweis({ nachweis: n, pdf: new Uint8Array(), letztePruefung: null, ereignis })).rejects.toBeInstanceOf(RepositoryFehler);
    expect(a.aufrufe.map((x) => x.art)).toEqual(['upload']);
    const b = fakeSupabase((x) => (x.art === 'from' ? { error: { code: '42501', message: 'new row violates row-level security policy' } } : { data: null }));
    await expect(supabaseRepository(b.client, ORG).erfasseNachweis({ nachweis: n, pdf: new Uint8Array(), letztePruefung: null, ereignis }))
      .rejects.toMatchObject({ meldung: 'Keine Berechtigung für diese Aktion.' });
    expect(log.mock.calls.some((c) => String(c[0]).includes('verwaist'))).toBe(true);
  });
});

