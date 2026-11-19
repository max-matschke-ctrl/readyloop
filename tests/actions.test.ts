import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---- Next-Module mocken -------------------------------------------------------
const cookieJar = new Map<string, { value: string; optionen?: Record<string, unknown> }>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined),
    getAll: () => [...cookieJar.entries()].map(([name, v]) => ({ name, value: v.value })),
    set: (name: string, value: string, optionen?: Record<string, unknown>) => cookieJar.set(name, { value, optionen }),
    delete: (arg: string | { name: string }) => cookieJar.delete(typeof arg === 'string' ? arg : arg.name),
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
// Supabase-Modus ohne Netz: Client ohne angemeldeten Benutzer (Details in tests/supabase-auth.test.ts).
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null }, error: { message: 'keine Sitzung' } }) } }),
}));

import { INITIAL_ACTION_STATE, type DemoRolle } from '@/domain/types';
import { GET } from '@/app/api/nachweise/[id]/route';
import { abmelden, fristFreigeben, geraetAnlegen, nachweisErfassen, setzeDemoRolle } from '@/server/actions';
import { erfordereSitzung, holeGeraetDetail, holeSitzung, istDemoModus, listeGeraete } from '@/server/data';
import { platzhalterPdf } from '@/server/pdf';
import { DEMO_BEREICH_IDS } from '@/server/repo/demo/daten';
import { DEMO_COOKIE } from '@/server/sitzung';

const als = (rolle: DemoRolle) => cookieJar.set(DEMO_COOKIE, { value: rolle });
const form = (werte: Record<string, string | Blob>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(werte)) fd.set(k, v);
  return fd;
};
async function fehlerVon(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return (e as Error).message;
  }
  return 'kein Fehler';
}
async function geraetId(inv: string) {
  als('admin');
  return (await listeGeraete()).find((g) => g.geraet.inventarnummer === inv)!.geraet.id;
}
async function pruefartId(inv: string) {
  als('admin');
  return (await holeGeraetDetail(await geraetId(inv)))!.pruefarten[0].pruefart.id;
}

beforeEach(() => {
  cookieJar.clear();
  revalidatePath.mockClear();
  delete (globalThis as { __readyloopDemoRepository?: unknown }).__readyloopDemoRepository;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('Demo-Sitzung', () => {
  it('setzeDemoRolle validiert die Rolle', async () => {
    const r = await setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'mitarbeiter' }));
    expect(r.status).toBe('fehler');
    expect(r.feldfehler?.rolle?.length).toBeGreaterThan(0);
  });

  it('setzeDemoRolle setzt httpOnly-Cookie und leitet weiter', async () => {
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'pruefer' })))).toBe('REDIRECT:/pruefer');
    expect(cookieJar.get(DEMO_COOKIE)).toMatchObject({ value: 'pruefer', optionen: { httpOnly: true, sameSite: 'lax', path: '/' } });
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'sifa' })))).toBe('REDIRECT:/geraete');
    expect((await holeSitzung())?.benutzer.name).toBe('Dr. Jens Hartmann');
  });

  it('abmelden löscht Cookie', async () => {
    als('admin');
    expect(await fehlerVon(abmelden())).toBe('REDIRECT:/login');
    expect(await holeSitzung()).toBeNull();
  });

  it('ungültiger Cookie-Wert → keine Sitzung; erfordereSitzung leitet zum Login', async () => {
    cookieJar.set(DEMO_COOKIE, { value: 'root' });
    expect(await holeSitzung()).toBeNull();
    expect(await fehlerVon(erfordereSitzung())).toBe('REDIRECT:/login');
  });

  it('erfordereSitzung mit fehlendem Recht → notFound', async () => {
    als('admin');
    expect(await fehlerVon(erfordereSitzung('frist.freigeben'))).toBe('NOT_FOUND');
  });

  it('mit Supabase-Variablen: kein Demo, Demo-Cookie wird ignoriert', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    als('admin');
    expect(istDemoModus()).toBe(false);
    expect(await holeSitzung()).toBeNull();
    expect((await setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'admin' }))).status).toBe('fehler');
  });
});

describe('geraetAnlegen', () => {
  const gueltig = (bereichId: string) => ({
    bezeichnung: 'Hubwagen manuell',
    inventarnummer: 'L-100',
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

  it('ohne Sitzung → Login', async () => {
    expect(await fehlerVon(geraetAnlegen(INITIAL_ACTION_STATE, form(gueltig(DEMO_BEREICH_IDS.lager))))).toBe('REDIRECT:/login');
  });

  it('Sifa → keine Berechtigung', async () => {
    als('sifa');
    expect(await geraetAnlegen(INITIAL_ACTION_STATE, form(gueltig(DEMO_BEREICH_IDS.lager)))).toMatchObject({ status: 'fehler' });
  });

  it('Feldfehler mit Formularfeldnamen', async () => {
    als('verantwortlicher');
    const r = await geraetAnlegen(INITIAL_ACTION_STATE, form({ ...gueltig(DEMO_BEREICH_IDS.lager), bezeichnung: 'x', pruefartenJson: '[]' }));
    expect(r.status).toBe('fehler');
    expect(Object.keys(r.feldfehler ?? {}).sort()).toEqual(['bezeichnung', 'pruefartenJson']);
  });

  it('VER in fremdem Bereich → Feldfehler bereichId', async () => {
    als('verantwortlicher');
    const r = await geraetAnlegen(INITIAL_ACTION_STATE, form(gueltig(DEMO_BEREICH_IDS.produktion)));
    expect(r.feldfehler?.bereichId).toBeDefined();
  });

  it('Erfolg → revalidatePath und Redirect zum Gerät', async () => {
    als('verantwortlicher');
    const ziel = await fehlerVon(geraetAnlegen(INITIAL_ACTION_STATE, form(gueltig(DEMO_BEREICH_IDS.lager))));
    expect(ziel).toMatch(/^REDIRECT:\/geraete\/[0-9a-f-]{36}$/);
    expect(revalidatePath).toHaveBeenCalledWith('/geraete');
    expect(await listeGeraete()).toHaveLength(9);
  });
});

describe('fristFreigeben', () => {
  it('Admin → keine Berechtigung', async () => {
    const id = await pruefartId('P-006');
    als('admin');
    const r = await fristFreigeben(INITIAL_ACTION_STATE, form({ modus: 'gbu', geraetPruefartId: id, monate: '12', fundstelle: 'GBU 2026', begruendung: 'Begründung ausreichend lang' }));
    expect(r.status).toBe('fehler');
  });

  it('Validierung: Feldfehler fundstelle/begruendung/monate', async () => {
    const id = await pruefartId('P-006');
    als('sifa');
    const r = await fristFreigeben(INITIAL_ACTION_STATE, form({ modus: 'gbu', geraetPruefartId: id, monate: '0', fundstelle: 'x', begruendung: 'kurz' }));
    expect(Object.keys(r.feldfehler ?? {}).sort()).toEqual(['begruendung', 'fundstelle', 'monate']);
  });

  it('Herstellerfrist überschritten → Feldfehler monate', async () => {
    const id = await pruefartId('L-005');
    als('sifa');
    const r = await fristFreigeben(INITIAL_ACTION_STATE, form({ modus: 'gbu', geraetPruefartId: id, monate: '12', fundstelle: 'GBU 2026', begruendung: 'Begründung ausreichend lang' }));
    expect(r.feldfehler?.monate?.[0]).toMatch(/Herstellerfrist/);
  });

  it('Erfolg → ok, revalidatePath auf Gerät', async () => {
    const gid = await geraetId('P-006');
    const id = await pruefartId('P-006');
    als('sifa');
    const r = await fristFreigeben(INITIAL_ACTION_STATE, form({ modus: 'gbu', geraetPruefartId: id, monate: '12', fundstelle: 'GBU Produktion 2026', begruendung: 'Begründung ausreichend lang' }));
    expect(r).toEqual({ status: 'ok', meldung: 'Frist freigegeben', id });
    expect(revalidatePath).toHaveBeenCalledWith(`/geraete/${gid}`);
    expect((await holeGeraetDetail(gid))!.gesamtStatus).toBe('unbekannt');
  });
});

describe('nachweisErfassen', () => {
  const pdfDatei = () => new File([platzhalterPdf('Test') as BlobPart], 'bericht.pdf', { type: 'application/pdf' });
  const werte = (id: string, teil: Record<string, string | Blob> = {}) => ({
    geraetPruefartId: id,
    pruefdatum: '2020-01-01',
    ergebnis: 'ohne_maengel',
    pruefumfang: 'Wiederkehrende Prüfung',
    prueferName: 'Tobias Berger',
    unterschriftImPdf: 'on',
    pdf: pdfDatei(),
    ...teil,
  });

  it('Prüfer → Redirect /pruefer', async () => {
    const id = await pruefartId('L-001');
    als('pruefer');
    expect(await fehlerVon(nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id))))).toBe('REDIRECT:/pruefer');
    expect(revalidatePath).toHaveBeenCalledWith('/pruefer');
  });

  it('Verantwortlicher → Redirect zum Gerät', async () => {
    const gid = await geraetId('L-003');
    const id = await pruefartId('L-003');
    als('verantwortlicher');
    expect(await fehlerVon(nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id))))).toBe(`REDIRECT:/geraete/${gid}`);
  });

  it('Feldfehler: Prüfdatum in der Zukunft, fehlende Bestätigung, falscher Dateityp', async () => {
    const id = await pruefartId('L-001');
    als('pruefer');
    const zukunft = await nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id, { pruefdatum: '2999-01-01' })));
    expect(zukunft.feldfehler?.pruefdatum).toBeDefined();
    const fd = form(werte(id));
    fd.delete('unterschriftImPdf');
    expect((await nachweisErfassen(INITIAL_ACTION_STATE, fd)).feldfehler?.unterschriftImPdf).toBeDefined();
    const txt = new File(['hallo'], 'x.txt', { type: 'text/plain' });
    expect((await nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id, { pdf: txt })))).feldfehler?.pdf).toBeDefined();
    const getarnt = new File(['hallo'], 'x.pdf', { type: 'application/pdf' });
    expect((await nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id, { pdf: getarnt })))).feldfehler?.pdf).toBeDefined();
  });

  it('Admin → keine Berechtigung', async () => {
    const id = await pruefartId('L-001');
    als('admin');
    expect((await nachweisErfassen(INITIAL_ACTION_STATE, form(werte(id)))).status).toBe('fehler');
  });
});

describe('GET /api/nachweise/[id]', () => {
  const aufruf = (id: string) => GET(new Request(`http://localhost/api/nachweise/${id}`), { params: Promise.resolve({ id }) });

  it('liefert PDF inline im Geltungsbereich, sonst 404', async () => {
    als('admin');
    const nid = (await holeGeraetDetail(await geraetId('P-001')))!.nachweise[0].id;
    const ok = await aufruf(nid);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Content-Type')).toBe('application/pdf');
    expect(ok.headers.get('Content-Disposition')).toMatch(/^inline;/);
    expect(new TextDecoder().decode(new Uint8Array(await ok.arrayBuffer()).subarray(0, 5))).toBe('%PDF-');

    als('verantwortlicher');
    expect((await aufruf(nid)).status).toBe(404);
    cookieJar.clear();
    expect((await aufruf(nid)).status).toBe(404);
    als('admin');
    expect((await aufruf('gibt-es-nicht')).status).toBe(404);
  });
});
