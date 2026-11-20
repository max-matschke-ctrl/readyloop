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
    // ohne Zeilen aus mitglied_emails (Nicht-Admin) bleibt die E-Mail leer
    expect(await repo.holeBenutzer(b.id)).toEqual({ ...b, email: '' });
    expect(aufrufe.at(-2)!.filter).toEqual([['eq', 'benutzer_id', b.id], ['eq', 'organisation_id', ORG]]);
    expect(aufrufe.at(-1)).toMatchObject({ art: 'rpc', name: 'mitglied_emails', args: { p_organisation: ORG } });
  });
  it('Befund I2-5: email nie in der Spaltenauswahl; E-Mail nur aus RPC mitglied_emails', async () => {
    const m = stand.mitgliedschaften.find((x) => x.rolle === 'verantwortlicher')!;
    const b = stand.benutzer.find((x) => x.id === m.benutzerId)!;
    const { client, aufrufe } = fakeSupabase((a) => {
      if (a.tabelle === 'mitgliedschaft') {
        return { data: [{ id: m.id, organisation_id: ORG, benutzer_id: b.id, anzeigename: b.name, rolle: m.rolle, aktiv: true, pruefer_typen: [] }] };
      }
      if (a.art === 'rpc' && a.name === 'mitglied_emails') return { data: [{ benutzer_id: b.id, email: b.email }] };
      return { data: [] };
    });
    const repo = supabaseRepository(client, ORG);
    expect(await repo.listeBenutzer(ORG)).toEqual([b]);
    expect(await repo.holeBenutzer(b.id)).toEqual(b);
    await repo.listeMitgliedschaften(ORG);
    const spalten = aufrufe.filter((a) => a.tabelle === 'mitgliedschaft').map((a) => a.spalten ?? '');
    expect(spalten.length).toBe(3);
    for (const sp of spalten) expect(sp).not.toMatch(/\bemail\b/);
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
    const token = { id: 't1', organisationId: ORG, geraetId: g.id, token: 'a'.repeat(22), aktiv: true, erstelltAm: g.angelegtAm, deaktiviertAm: null };
    await supabaseRepository(client, ORG).legeGeraetAn({ geraet: g, pruefarten: p, ereignis, token });
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


describe('Schreiben I2 (BE-14)', () => {
  const ok = () => ({ data: null, count: 1 });
  it('Bereich anlegen (Standort nachgeschlagen) und ändern', async () => {
    const { client, aufrufe } = fakeSupabase((a) => (a.tabelle === 'standort' ? { data: [{ id: 's1' }] } : ok()));
    const repo = supabaseRepository(client, ORG);
    const b = { id: 'b9', organisationId: ORG, standortId: '', name: 'Versand', einsatzort: 'lager_logistik' as const };
    await repo.speichereBereich({ bereich: b, neu: true, ereignis });
    expect(aufrufe.map((a) => `${a.tabelle}:${a.op}`)).toEqual(['standort:select', 'bereich:insert']);
    expect(aufrufe[1].werte).toEqual({ id: 'b9', organisation_id: ORG, standort_id: 's1', name: 'Versand', einsatzort: 'lager_logistik' });
    await repo.speichereBereich({ bereich: { ...b, standortId: 's1', einsatzort: 'baustelle' }, neu: false, ereignis });
    expect(aufrufe.at(-1)).toMatchObject({ op: 'update', werte: { name: 'Versand', einsatzort: 'baustelle' }, optionen: { count: 'exact' }, filter: [['eq', 'id', 'b9']] });
  });
  it('UPDATE ohne betroffene Zeile (RLS) → Berechtigungsfehler', async () => {
    const { client } = fakeSupabase(() => ({ data: null, count: 0 }));
    await expect(supabaseRepository(client, ORG).setzePruefer({ pruefartId: 'p', prueferId: 'u', ereignis }))
      .rejects.toMatchObject({ code: '42501', meldung: 'Keine Berechtigung für diese Aktion.' });
  });
  it('Prüfer, GBU-Verweis: nur die jeweiligen Spalten', async () => {
    const { client, aufrufe } = fakeSupabase(ok);
    const repo = supabaseRepository(client, ORG);
    await repo.setzePruefer({ pruefartId: 'p1', prueferId: null, ereignis });
    await repo.setzeGbuDokument({ pruefartId: 'p1', gbuDokument: { titel: 'GBU', url: 'https://g.example' }, ereignis });
    await repo.setzeGbuDokument({ pruefartId: 'p1', gbuDokument: null, ereignis });
    expect(aufrufe.map((a) => a.werte)).toEqual([
      { zugewiesener_pruefer_id: null },
      { gbu_dokument_titel: 'GBU', gbu_dokument_url: 'https://g.example' },
      { gbu_dokument_titel: null, gbu_dokument_url: null },
    ]);
  });
  it('Verschieben, Betriebsstatus, Mitglied über RPCs (eingeladen aus dem Ereignis)', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    const repo = supabaseRepository(client, ORG);
    await repo.verschiebeGeraet({ geraetId: 'g', bereichId: 'b', begruendung: 'Umzug', ereignis });
    await repo.setzeBetriebsstatus({ geraetId: 'g', betriebsstatus: 'ausser_betrieb', begruendung: null, ereignis });
    const m = stand.mitgliedschaften.find((x) => x.rolle === 'verantwortlicher')!;
    const b = stand.benutzer.find((x) => x.id === m.benutzerId)!;
    await repo.speichereMitgliedschaft({ mitgliedschaft: m, benutzer: b, neu: true, ereignis: { ...ereignis, daten: { eingeladen: true } } });
    expect(aufrufe.map((a) => a.name)).toEqual(['geraet_verschieben', 'betriebsstatus_setzen', 'mitglied_speichern']);
    expect(aufrufe[0].args).toEqual({ p_geraet: 'g', p_bereich: 'b', p_begruendung: 'Umzug' });
    expect(aufrufe[1].args).toEqual({ p_geraet: 'g', p_status: 'ausser_betrieb', p_begruendung: null });
    expect(aufrufe[2].args).toEqual({
      p_mitgliedschaft: { id: m.id, organisation_id: ORG, benutzer_id: b.id, anzeigename: b.name, email: b.email, rolle: 'verantwortlicher', aktiv: true, pruefer_typen: [], eingeladen: true },
      p_bereich_ids: m.bereichIds,
    });
  });
  it('Anlässe: ein INSERT mit n Zeilen; Aufheben nur Begründung', async () => {
    const { client, aufrufe } = fakeSupabase(ok);
    const repo = supabaseRepository(client, ORG);
    const a = stand.anlaesse[0];
    await repo.erfasseAnlaesse({ anlaesse: [a, { ...a, id: 'a2' }], ereignisse: [] });
    expect(aufrufe).toHaveLength(1);
    expect(aufrufe[0]).toMatchObject({ tabelle: 'anlass', op: 'insert' });
    expect((aufrufe[0].werte as unknown[]).length).toBe(2);
    expect((aufrufe[0].werte as Record<string, unknown>[])[0]).not.toHaveProperty('erfasst_von_name');
    await repo.hebeAnlassAuf({ anlass: { ...a, aufhebungsgrund: 'versehentlich erfasst', aufgehobenAm: 'x', aufgehobenVon: 'u', aufgehobenVonName: 'n' }, ereignis });
    expect(aufrufe[1]).toMatchObject({ op: 'update', werte: { aufhebungsgrund: 'versehentlich erfasst' }, filter: [['eq', 'id', a.id]] });
  });
  it('Mangel: Erfassen ohne Stempel, Kenntnis und Behebung nur Übergangsspalten', async () => {
    const { client, aufrufe } = fakeSupabase(ok);
    const repo = supabaseRepository(client, ORG);
    const m = stand.maengel.find((x) => x.status === 'offen')!;
    await repo.erfasseMangel({ mangel: m, ereignis });
    expect(Object.keys(aufrufe[0].werte as object).sort()).toEqual(
      ['beschreibung', 'erfasst_von', 'geraet_id', 'geraet_pruefart_id', 'id', 'nachweis_id', 'organisation_id', 'schwere', 'termin', 'verantwortlich_id'],
    );
    await repo.aktualisiereMangel({ mangel: { ...m, status: 'in_bearbeitung', verantwortlichId: 'v', termin: '2026-12-01' }, ereignis });
    await repo.aktualisiereMangel({ mangel: { ...m, status: 'behoben', behobenAm: '2026-11-19', behobenDurch: 'Firma', behebung: 'Getauscht' }, ereignis });
    expect(aufrufe[1].werte).toEqual({ status: 'in_bearbeitung', verantwortlich_id: 'v', termin: '2026-12-01' });
    expect(aufrufe[2].werte).toEqual({ status: 'behoben', behoben_am: '2026-11-19', behoben_durch: 'Firma', behebung: 'Getauscht' });
    await expect(repo.aktualisiereMangel({ mangel: m, ereignis })).rejects.toBeInstanceOf(RepositoryFehler);
  });
  it('ladeBenutzerEin nutzt die injizierte Einladung', async () => {
    const einladen = vi.fn(async () => ({ benutzerId: 'neu-id', neu: true }));
    const { client, aufrufe } = fakeSupabase();
    expect(await supabaseRepository(client, ORG, { einladen }).ladeBenutzerEin({ email: 'a@b.de', name: 'A B' })).toEqual({ benutzerId: 'neu-id', neu: true });
    expect(einladen).toHaveBeenCalledWith({ email: 'a@b.de', name: 'A B' });
    expect(aufrufe).toEqual([]);
  });
});

describe('Einladung per Service-Role (Q-23)', () => {
  const adminClient = (vorhanden: string | null, einladung: { id?: string; fehler?: string } = {}) => {
    const log: string[] = [];
    const client = {
      rpc: async (name: string, args: { p_email: string }) => {
        log.push(`${name}:${args.p_email}`);
        return { data: vorhanden, error: null };
      },
      auth: {
        admin: {
          inviteUserByEmail: async (email: string, opt: { redirectTo: string; data: Record<string, unknown> }) => {
            log.push(`invite:${email}:${opt.redirectTo}:${String(opt.data.name)}`);
            return einladung.fehler
              ? { data: { user: null }, error: { message: einladung.fehler } }
              : { data: { user: { id: einladung.id ?? 'neu' } }, error: null };
          },
        },
      },
    };
    return { client: client as never, log };
  };
  it('bekannte E-Mail → vorhandene ID, keine Mail', async () => {
    const { ladeBenutzerEinPerServiceRole } = await import('@/server/supabase/admin');
    const { client, log } = adminClient('u-vorhanden');
    expect(await ladeBenutzerEinPerServiceRole({ email: ' Berger@Example.org ', name: 'Tobias' }, client)).toEqual({ benutzerId: 'u-vorhanden', neu: false });
    expect(log).toEqual(['benutzer_id_fuer_email:berger@example.org']);
  });
  it('unbekannte E-Mail → inviteUserByEmail mit Bestätigungslink und Name', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.example');
    const { ladeBenutzerEinPerServiceRole } = await import('@/server/supabase/admin');
    const { client, log } = adminClient(null, { id: 'u-neu' });
    expect(await ladeBenutzerEinPerServiceRole({ email: 'neu@example.org', name: 'Nora Neu' }, client)).toEqual({ benutzerId: 'u-neu', neu: true });
    expect(log[1]).toBe('invite:neu@example.org:https://app.example/api/auth/confirm?next=/passwort-neu:Nora Neu');
    vi.unstubAllEnvs();
  });
  it('Einladung scheitert → RepositoryFehler', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { ladeBenutzerEinPerServiceRole } = await import('@/server/supabase/admin');
    const { client } = adminClient(null, { fehler: 'smtp down' });
    await expect(ladeBenutzerEinPerServiceRole({ email: 'x@example.org', name: 'X' }, client)).rejects.toMatchObject({ meldung: 'Die Einladung konnte nicht versendet werden.' });
  });
  it('ohne Service-Schlüssel → verständlicher Fehler', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const { erzeugeAdminClient } = await import('@/server/supabase/admin');
    expect(() => erzeugeAdminClient()).toThrow(RepositoryFehler);
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// BE-20: Supabase-Repository I3M (RPCs, Tabellen, No-op)
// ---------------------------------------------------------------------------
describe('I3M (BE-20)', () => {
  it('holeTokenRohdaten → rpc geraet_oeffentlich; null bleibt null', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    expect(await supabaseRepository(client, null).holeTokenRohdaten('a'.repeat(22))).toBeNull();
    expect(aufrufe).toEqual([expect.objectContaining({ art: 'rpc', name: 'geraet_oeffentlich', args: { p_token: 'a'.repeat(22) } })]);
  });

  it('listeKurzRohdaten → rpc ma_kurzansichten mit Art, Suche, IDs', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: [] }));
    const repo = supabaseRepository(client, ORG);
    await repo.listeKurzRohdaten(ORG, { art: 'meine' }, 'u1');
    await repo.listeKurzRohdaten(ORG, { art: 'suche', suche: 'leiter' }, 'u1');
    await repo.listeKurzRohdaten(ORG, { art: 'ids', geraetIds: ['g1'] }, 'u1');
    expect(aufrufe.map((a) => a.args)).toEqual([
      { p_org: ORG, p_art: 'meine', p_suche: null, p_ids: null },
      { p_org: ORG, p_art: 'suche', p_suche: 'leiter', p_ids: null },
      { p_org: ORG, p_art: 'ids', p_suche: null, p_ids: ['g1'] },
    ]);
  });

  it('Übernahme starten/beenden, Etikett erneuern über RPCs; Zuordnung per UPDATE; loeseNutzungen ohne Aufruf', async () => {
    const { client, aufrufe } = fakeSupabase((a) => (a.name === 'etikett_erneuern' ? { data: 'neuerToken0123456789ab' } : { data: null, count: 1 }));
    const repo = supabaseRepository(client, ORG);
    const u = stand.uebernahmen[0];
    await repo.starteUebernahme({ uebernahme: u, vorherige: null });
    await repo.beendeUebernahme({ uebernahme: { ...u, bis: '2026-11-19T10:00:00.000Z', endeArt: 'rueckgabe' } });
    expect(await repo.erneuereToken({ geraetId: u.geraetId, neu: stand.tokens[0], ereignis })).toBe('neuerToken0123456789ab');
    await repo.setzeZuordnung({ geraetId: u.geraetId, benutzerId: null, ereignis });
    await repo.loeseNutzungen({ organisationId: ORG, benutzerId: 'u1', jetzt: '2026-11-19T10:00:00.000Z' });
    expect(aufrufe.map((a) => a.name ?? `${a.op}:${a.tabelle}`)).toEqual(['uebernahme_starten', 'uebernahme_beenden', 'etikett_erneuern', 'update:geraet']);
    expect(aufrufe[0].args).toEqual({ p_geraet: u.geraetId });
    expect(aufrufe[3]).toMatchObject({ werte: { zugeordnet_an: null }, filter: [['eq', 'id', u.geraetId]] });
  });

  it('listeTokens/listeUebernahmen lesen gefiltert nach Organisation (und Gerät)', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: [] }));
    const repo = supabaseRepository(client, ORG);
    await repo.listeTokens(ORG);
    await repo.listeUebernahmen(ORG, 'g1');
    expect(aufrufe.map((a) => [a.tabelle, a.filter])).toEqual([
      ['geraet_token', [['eq', 'organisation_id', ORG]]],
      ['uebernahme', [['eq', 'organisation_id', ORG], ['eq', 'geraet_id', 'g1']]],
    ]);
  });

  it('erfasseMangel ohne select() (MA ohne SELECT-Policy)', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: null }));
    await supabaseRepository(client, ORG).erfasseMangel({ mangel: stand.maengel[0], ereignis });
    expect(aufrufe[0].op).toBe('insert');
    expect(aufrufe[0].spalten).toBeUndefined();
  });

  it('Fehler der RPC → RepositoryFehler mit deutscher Meldung', async () => {
    const { client } = fakeSupabase(() => ({ error: { code: '23514', message: 'Sie haben dieses Gerät bereits übernommen' } }));
    await expect(supabaseRepository(client, ORG).starteUebernahme({ uebernahme: stand.uebernahmen[0], vorherige: null })).rejects.toThrow(
      'Sie haben dieses Gerät bereits übernommen.',
    );
  });
});
