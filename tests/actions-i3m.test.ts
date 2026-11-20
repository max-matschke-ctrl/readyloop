// BE-18: Datenzugriff und Actions I3M im Demo-Modus (Recht, Validierung, Rücksprung, keine Redirects auf der QR-Seite).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
const revalidiert: string[] = [];
vi.mock('next/cache', () => ({ revalidatePath: (p: string, t?: string) => revalidiert.push(t ? `${p}|${t}` : p) }));

import { INITIAL_ACTION_STATE, type DemoRolle } from '@/domain/types';
import {
  etikettErneuern,
  geraetUebernehmen,
  geraetZuordnen,
  geraetZurueckgeben,
  mangelErfassen,
  mangelMelden,
  mitarbeiterEinladen,
  setzeDemoRolle,
  uebernahmeBeenden,
} from '@/server/actions';
import {
  holeEtiketten,
  holeMangelMeldung,
  holeTokenSeite,
  listeGeraete,
  listeMeineGeraete,
  listeMitarbeiter,
  listeMitarbeiterOptionen,
  sucheGeraete,
} from '@/server/data';
import { istQrPfad, QR_KOPFZEILEN, setzeQrKopfzeilen } from '@/server/kopfzeilen';
import { sichererRuecksprung } from '@/server/pfade';
import { DEMO_BENUTZER_IDS } from '@/server/repo/demo/daten';
import { DEMO_COOKIE } from '@/server/sitzung';

const als = (rolle: DemoRolle) => cookieJar.set(DEMO_COOKIE, { value: rolle });
const form = (werte: Record<string, string>) => {
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
async function idVon(inv: string): Promise<string> {
  const rolle = cookieJar.get(DEMO_COOKIE)?.value as DemoRolle | undefined;
  als('admin');
  const id = (await listeGeraete()).find((g) => g.geraet.inventarnummer === inv)!.geraet.id;
  if (rolle) als(rolle);
  else cookieJar.delete(DEMO_COOKIE);
  return id;
}

beforeEach(() => {
  cookieJar.clear();
  revalidiert.length = 0;
  delete (globalThis as { __readyloopDemoRepository?: unknown }).__readyloopDemoRepository;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  vi.stubEnv('READYLOOP_DEMO', '');
  vi.stubEnv('NODE_ENV', 'development');
});
afterEach(() => vi.unstubAllEnvs());

describe('Login mit Rücksprung (F-20)', () => {
  it('setzeDemoRolle mitarbeiter → /meine-geraete; next relativ → next; absolute/Protokoll-URLs → Standard', async () => {
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'mitarbeiter' })))).toBe('REDIRECT:/meine-geraete');
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'mitarbeiter', next: '/g/demoL002xxxxxxxxxxxxxx' })))).toBe(
      'REDIRECT:/g/demoL002xxxxxxxxxxxxxx',
    );
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'mitarbeiter', next: 'https://evil.example' })))).toBe('REDIRECT:/meine-geraete');
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'admin', next: '//evil.example' })))).toBe('REDIRECT:/geraete');
    expect(await fehlerVon(setzeDemoRolle(INITIAL_ACTION_STATE, form({ rolle: 'pruefer', next: '' })))).toBe('REDIRECT:/pruefer');
  });
  it('sichererRuecksprung lehnt //evil.example, https://…, javascript: ab und erlaubt Token-Pfade mit _ und -', () => {
    for (const boese of ['//evil.example', 'https://evil.example/g/x', 'javascript:alert(1)', '/\\evil', '/g/x y', null, 42]) {
      expect(sichererRuecksprung(boese, '/x')).toBe('/x');
    }
    expect(sichererRuecksprung('/g/AbC_-09zZyY8xX7wW6vV5u', '/x')).toBe('/g/AbC_-09zZyY8xX7wW6vV5u');
  });
});

describe('QR-Seite (F-24)', () => {
  it('ohne Sitzung: kein Redirect, öffentliche Ansicht; falsches Format → null', async () => {
    const s = await holeTokenSeite('demoL001xxxxxxxxxxxxxx');
    expect(s).toMatchObject({ angemeldet: false, kurz: null, akteUrl: null });
    expect(s?.ansicht.nutzung).toBe('nicht_verwenden');
    expect(await holeTokenSeite('abc')).toBeNull();
    expect(await holeTokenSeite('demoL001altxxxxxxxxxxx')).toBeNull();
  });
  it('als Mitarbeiter: kurz mit Aktionen; als VER Lager: akteUrl', async () => {
    als('mitarbeiter');
    expect((await holeTokenSeite('demoL002xxxxxxxxxxxxxx'))?.kurz?.uebernahme).toBe('von_mir');
    als('verantwortlicher');
    expect((await holeTokenSeite('demoL003xxxxxxxxxxxxxx'))?.akteUrl).toMatch(/^\/geraete\//);
  });
  it('unkonfiguriert → null statt Fehler', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(await holeTokenSeite('demoL001xxxxxxxxxxxxxx')).toBeNull();
  });
  it('Kopfzeilen für /g/* (Middleware)', () => {
    expect(istQrPfad('/g/demoL001xxxxxxxxxxxxxx')).toBe(true);
    expect(istQrPfad('/geraete')).toBe(false);
    const h = new Headers();
    setzeQrKopfzeilen('/g/abc', h);
    expect(Object.fromEntries(h.entries())).toEqual({
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow',
    });
    const leer = new Headers();
    setzeQrKopfzeilen('/geraete', leer);
    expect([...leer.keys()]).toEqual([]);
    expect(QR_KOPFZEILEN['X-Robots-Tag']).toBe('noindex, nofollow');
  });
});

describe('Datenzugriff I3M (Rechte)', () => {
  it('listeMeineGeraete: MA ok, VER → 404, ohne Sitzung → /login', async () => {
    expect(await fehlerVon(listeMeineGeraete())).toBe('REDIRECT:/login');
    als('verantwortlicher');
    expect(await fehlerVon(listeMeineGeraete())).toBe('NOT_FOUND');
    als('mitarbeiter');
    expect((await listeMeineGeraete()).map((g) => g.inventarnummer)).toEqual(['L-008', 'L-002', 'P-008']);
  });
  it('sucheGeraete: < 2 Zeichen → []; VER → 404', async () => {
    als('mitarbeiter');
    expect(await sucheGeraete('a')).toEqual([]);
    expect((await sucheGeraete('hubwagen')).map((g) => g.inventarnummer)).toEqual(['L-002']);
    als('verantwortlicher');
    expect(await fehlerVon(sucheGeraete('hubwagen'))).toBe('NOT_FOUND');
  });
  it('MA: Geräteliste, Etiketten, Mitarbeiterliste → 404 bzw. leer', async () => {
    als('mitarbeiter');
    expect(await listeGeraete()).toEqual([]);
    expect(await fehlerVon(holeEtiketten({}))).toBe('NOT_FOUND');
    expect(await fehlerVon(listeMitarbeiter())).toBe('NOT_FOUND');
    expect(await listeMitarbeiterOptionen()).toEqual([]);
  });
  it('holeMangelMeldung nur für MA', async () => {
    const v001 = await idVon('V-001');
    als('mitarbeiter');
    expect((await holeMangelMeldung(v001))?.inventarnummer).toBe('V-001');
    als('sifa');
    expect(await holeMangelMeldung(v001)).toBeNull();
  });
  it('holeEtiketten VER: Default wechselnd im Bereich; SIF → 404', async () => {
    als('verantwortlicher');
    expect((await holeEtiketten({})).map((e) => e.inventarnummer)).toEqual(['L-001', 'L-002', 'L-006', 'L-008']);
    als('sifa');
    expect(await fehlerVon(holeEtiketten({}))).toBe('NOT_FOUND');
  });
  it('listeMitarbeiter VER ok, SIF → 404', async () => {
    als('verantwortlicher');
    expect((await listeMitarbeiter()).map((m) => m.benutzer.name)).toEqual(['Aylin Demir', 'Jonas Richter']);
    als('sifa');
    expect(await fehlerVon(listeMitarbeiter())).toBe('NOT_FOUND');
  });
});

describe('Actions Mitarbeiter', () => {
  it('geraetUebernehmen: ok mit Meldung und Revalidierung; Übergabe-Meldung; L-001 → Fehler; VER → kein Recht; Feldfehler', async () => {
    const [l006, p003, l001] = [await idVon('L-006'), await idVon('P-003'), await idVon('L-001')];
    als('mitarbeiter');
    expect(await geraetUebernehmen(INITIAL_ACTION_STATE, form({ geraetId: l006 }))).toEqual({ status: 'ok', id: l006, meldung: 'Gerät übernommen.' });
    expect(revalidiert).toEqual(expect.arrayContaining(['/meine-geraete', '/meine-geraete/suchen', '/g/[token]|page', `/geraete/${l006}`, '/geraete']));
    expect(await geraetUebernehmen(INITIAL_ACTION_STATE, form({ geraetId: p003 }))).toMatchObject({
      status: 'ok',
      meldung: 'Gerät übernommen. Die vorherige Übernahme wurde beendet.',
    });
    expect(await geraetUebernehmen(INITIAL_ACTION_STATE, form({ geraetId: l001 }))).toMatchObject({ status: 'fehler' });
    expect((await geraetUebernehmen(INITIAL_ACTION_STATE, form({}))).feldfehler?.geraetId?.length).toBeGreaterThan(0);
    als('verantwortlicher');
    expect(await geraetUebernehmen(INITIAL_ACTION_STATE, form({ geraetId: l006 }))).toMatchObject({ status: 'fehler', meldung: 'Keine Berechtigung für diese Aktion.' });
  });
  it('ohne Sitzung → /login', async () => {
    expect(await fehlerVon(geraetUebernehmen(INITIAL_ACTION_STATE, form({ geraetId: 'x' })))).toBe('REDIRECT:/login');
  });
  it('geraetZurueckgeben: eigene ok, fremde Fehler', async () => {
    const [l002, p003] = [await idVon('L-002'), await idVon('P-003')];
    als('mitarbeiter');
    expect(await geraetZurueckgeben(INITIAL_ACTION_STATE, form({ geraetId: l002 }))).toEqual({ status: 'ok', id: l002, meldung: 'Gerät zurückgegeben.' });
    expect((await geraetZurueckgeben(INITIAL_ACTION_STATE, form({ geraetId: p003 }))).status).toBe('fehler');
  });
  it('mangelMelden: Feldfehler beschreibung; ok mit Meldung; mangelErfassen als MA → kein Recht', async () => {
    const v001 = await idVon('V-001');
    als('mitarbeiter');
    expect((await mangelMelden(INITIAL_ACTION_STATE, form({ geraetId: v001, schwere: 'gering', beschreibung: 'abc' }))).feldfehler?.beschreibung?.length).toBeGreaterThan(0);
    expect((await mangelMelden(INITIAL_ACTION_STATE, form({ geraetId: v001, schwere: 'egal', beschreibung: 'Kabel lose' }))).feldfehler?.schwere?.length).toBeGreaterThan(0);
    expect(await mangelMelden(INITIAL_ACTION_STATE, form({ geraetId: v001, schwere: 'gefaehrlich', beschreibung: 'Kabel angeschmort' }))).toMatchObject({
      status: 'ok',
      meldung: 'Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.',
    });
    expect((await holeTokenSeite('demoV001xxxxxxxxxxxxxx'))?.ansicht.nutzung).toBe('nicht_verwenden');
    expect(
      await mangelErfassen(INITIAL_ACTION_STATE, form({ geraetId: v001, beschreibung: 'Direkt erfasst', schwere: 'gering', termin: '2099-01-01' })),
    ).toMatchObject({ status: 'fehler', meldung: 'Keine Berechtigung für diese Aktion.' });
  });
});

describe('Actions Verwaltung I3M', () => {
  it('geraetZuordnen: ADM speichern/lösen; L-001 → Feldfehler; MA → kein Recht', async () => {
    const [p008, l001] = [await idVon('P-008'), await idVon('L-001')];
    als('admin');
    expect(await geraetZuordnen(INITIAL_ACTION_STATE, form({ geraetId: p008, benutzerId: DEMO_BENUTZER_IDS.aylin }))).toMatchObject({ status: 'ok', meldung: 'Zuordnung gespeichert' });
    expect(await geraetZuordnen(INITIAL_ACTION_STATE, form({ geraetId: p008, benutzerId: '' }))).toMatchObject({ status: 'ok', meldung: 'Zuordnung gelöst' });
    expect((await geraetZuordnen(INITIAL_ACTION_STATE, form({ geraetId: l001, benutzerId: DEMO_BENUTZER_IDS.aylin }))).feldfehler?.benutzerId).toEqual([
      'Nur personenbezogene Geräte werden zugeordnet.',
    ]);
    als('mitarbeiter');
    expect((await geraetZuordnen(INITIAL_ACTION_STATE, form({ geraetId: p008, benutzerId: '' }))).meldung).toBe('Keine Berechtigung für diese Aktion.');
  });
  it('uebernahmeBeenden VER Lager L-002 ok, P-003 Fehler', async () => {
    const [l002, p003] = [await idVon('L-002'), await idVon('P-003')];
    als('verantwortlicher');
    expect(await uebernahmeBeenden(INITIAL_ACTION_STATE, form({ geraetId: l002 }))).toMatchObject({ status: 'ok', meldung: 'Übernahme beendet' });
    expect((await uebernahmeBeenden(INITIAL_ACTION_STATE, form({ geraetId: p003 }))).status).toBe('fehler');
  });
  it('etikettErneuern: ohne Bestätigung → Feldfehler; mit → alter Link ungültig', async () => {
    const l002 = await idVon('L-002');
    als('verantwortlicher');
    expect((await etikettErneuern(INITIAL_ACTION_STATE, form({ geraetId: l002 }))).feldfehler?.bestaetigung?.length).toBeGreaterThan(0);
    expect(await etikettErneuern(INITIAL_ACTION_STATE, form({ geraetId: l002, bestaetigung: 'on' }))).toMatchObject({
      status: 'ok',
      meldung: 'Aufkleber erneuert. Der alte Aufkleber ist ungültig; bitte neues Etikett drucken.',
    });
    expect(await holeTokenSeite('demoL002xxxxxxxxxxxxxx')).toBeNull();
  });
  it('mitarbeiterEinladen: VER mit mitgeschickter Rolle → nur mitarbeiter; ungültige E-Mail → Feld email; SIF → kein Recht', async () => {
    als('verantwortlicher');
    const r = await mitarbeiterEinladen(INITIAL_ACTION_STATE, form({ email: 'neu@example.org', name: 'Neue Kollegin', rolle: 'verantwortlicher' }));
    expect(r).toMatchObject({ status: 'ok', meldung: 'Einladung an neu@example.org versendet.' });
    expect((await listeMitarbeiter()).find((m) => m.benutzer.name === 'Neue Kollegin')).toMatchObject({ rolle: 'mitarbeiter', bereichIds: [] });
    expect(revalidiert).toEqual(expect.arrayContaining(['/mitarbeiter', '/admin/mitglieder']));
    expect((await mitarbeiterEinladen(INITIAL_ACTION_STATE, form({ email: 'kaputt', name: 'Xaver' }))).feldfehler?.email?.length).toBeGreaterThan(0);
    als('sifa');
    expect((await mitarbeiterEinladen(INITIAL_ACTION_STATE, form({ email: 'x@example.org', name: 'Xaver' }))).meldung).toBe('Keine Berechtigung für diese Aktion.');
  });
});
