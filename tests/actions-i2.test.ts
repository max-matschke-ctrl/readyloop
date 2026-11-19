// BE-11: Betriebsmodus (F-8, Q-9), Demo-Sitzung mit Organisation, Actions I2 (Recht, Validierung, Redirects).
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
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }));

import { addTage } from '@/domain/datum';
import { INITIAL_ACTION_STATE, type DemoRolle } from '@/domain/types';
import {
  abmelden,
  anlassAufheben,
  anlassErfassen,
  anmelden,
  bereichSpeichern,
  betriebsstatusSetzen,
  fristFreigeben,
  gbuDokumentSetzen,
  geraetVerschieben,
  mangelBeheben,
  mangelErfassen,
  mangelKenntnisNehmen,
  mitgliedAendern,
  mitgliedEinladen,
  nachweisErfassen,
  passwortVergessen,
  prueferZuweisen,
  waehleOrganisation,
} from '@/server/actions';
import {
  betriebsmodus,
  hatAuthSitzung,
  holeAnmeldestatus,
  holeGeraetDetail,
  holeMangelFormular,
  holeSitzung,
  istDemoModus,
  listeBereicheVerwaltung,
  listeGeraete,
  listeMaengel,
  listeMeineOrganisationen,
  listeMitglieder,
  listePrueferAufgaben,
} from '@/server/data';
import { sichererRuecksprung } from '@/server/pfade';
import { platzhalterPdf } from '@/server/pdf';
import { DEMO_BENUTZER_IDS, DEMO_BEREICH_IDS, DEMO_ORG2_ID, DEMO_ORG_ID } from '@/server/repo/demo/daten';
import { DEMO_COOKIE, ORG_COOKIE } from '@/server/sitzung';

const als = (rolle: DemoRolle) => cookieJar.set(DEMO_COOKIE, { value: rolle });
const form = (werte: Record<string, string | Blob | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(werte)) {
    if (Array.isArray(v)) for (const x of v) fd.append(k, x);
    else fd.set(k, v);
  }
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
async function geraet(inv: string) {
  const rolle = cookieJar.get(DEMO_COOKIE)?.value as DemoRolle | undefined;
  als('admin');
  const id = (await listeGeraete()).find((g) => g.geraet.inventarnummer === inv)!.geraet.id;
  const d = (await holeGeraetDetail(id))!;
  if (rolle) als(rolle);
  return d;
}

beforeEach(() => {
  cookieJar.clear();
  delete (globalThis as { __readyloopDemoRepository?: unknown }).__readyloopDemoRepository;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  vi.stubEnv('READYLOOP_DEMO', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('Betriebsmodus (F-8, Q-9)', () => {
  it('ohne Env in Entwicklung → demo', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(betriebsmodus()).toBe('demo');
    expect(istDemoModus()).toBe(true);
  });
  it('NODE_ENV=production ohne Env und ohne READYLOOP_DEMO → unkonfiguriert', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(betriebsmodus()).toBe('unkonfiguriert');
    expect(istDemoModus()).toBe(false);
    als('admin');
    expect(await holeSitzung()).toBeNull();
    expect(await holeAnmeldestatus()).toBe('unkonfiguriert');
  });
  it('production mit READYLOOP_DEMO=1 → demo', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('READYLOOP_DEMO', '1');
    expect(betriebsmodus()).toBe('demo');
  });
  it('nur eine Supabase-Variable → unkonfiguriert; beide → supabase', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    expect(betriebsmodus()).toBe('unkonfiguriert');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'x');
    expect(betriebsmodus()).toBe('supabase');
  });
  it('Anmeldestatus Demo: abgemeldet/angemeldet; hatAuthSitzung false', async () => {
    expect(await holeAnmeldestatus()).toBe('abgemeldet');
    als('sifa');
    expect(await holeAnmeldestatus()).toBe('angemeldet');
    expect(await hatAuthSitzung()).toBe(false);
  });
  it('Auth-Actions außerhalb von Supabase → Fehler ohne Redirect', async () => {
    expect((await anmelden(INITIAL_ACTION_STATE, form({ email: 'a@b.de', passwort: 'x' }))).status).toBe('fehler');
    expect((await passwortVergessen(INITIAL_ACTION_STATE, form({ email: 'a@b.de' }))).status).toBe('fehler');
  });
});

describe('Organisation wählen', () => {
  it('Prüfer wechselt Organisation per Cookie; fremde Organisation abgelehnt; abmelden löscht rl_org', async () => {
    als('pruefer');
    expect((await listeMeineOrganisationen()).map((o) => o.id)).toEqual([DEMO_ORG_ID, DEMO_ORG2_ID]);
    expect(await listePrueferAufgaben()).toHaveLength(6);
    expect(await fehlerVon(waehleOrganisation(INITIAL_ACTION_STATE, form({ organisationId: DEMO_ORG2_ID })))).toBe('REDIRECT:/');
    expect(cookieJar.get(ORG_COOKIE)).toMatchObject({ value: DEMO_ORG2_ID, optionen: { httpOnly: true, sameSite: 'lax', path: '/' } });
    expect((await holeSitzung())!.organisation.name).toBe('Muster Metallbau GmbH');
    expect(await listePrueferAufgaben()).toHaveLength(2);
    const r = await waehleOrganisation(INITIAL_ACTION_STATE, form({ organisationId: '10000000-0000-4000-8000-000000000099' }));
    expect(r.feldfehler?.organisationId).toBeDefined();
    expect(await fehlerVon(abmelden())).toBe('REDIRECT:/login');
    expect(cookieJar.has(ORG_COOKIE)).toBe(false);
    expect(cookieJar.has(DEMO_COOKIE)).toBe(false);
  });
  it('rl_org ohne aktive Mitgliedschaft → erste Organisation', async () => {
    als('sifa');
    cookieJar.set(ORG_COOKIE, { value: DEMO_ORG2_ID });
    expect((await holeSitzung())!.organisation.id).toBe(DEMO_ORG_ID);
  });
});

describe('Actions I2: Recht und Feldfehler', () => {
  it('jede neue Action ohne Recht → Fehler ohne Datenänderung', async () => {
    als('pruefer');
    const leer = form({});
    for (const a of [prueferZuweisen, gbuDokumentSetzen, betriebsstatusSetzen, geraetVerschieben, anlassErfassen, anlassAufheben, mangelKenntnisNehmen, mangelBeheben, bereichSpeichern, mitgliedEinladen, mitgliedAendern]) {
      expect((await a(INITIAL_ACTION_STATE, leer)).meldung, a.name).toBe('Keine Berechtigung für diese Aktion.');
    }
    als('admin');
    expect((await mangelErfassen(INITIAL_ACTION_STATE, leer)).meldung).toBe('Keine Berechtigung für diese Aktion.');
    expect((await anlassErfassen(INITIAL_ACTION_STATE, leer)).meldung).toBe('Keine Berechtigung für diese Aktion.');
  });
  it('ohne Sitzung → Login', async () => {
    expect(await fehlerVon(prueferZuweisen(INITIAL_ACTION_STATE, form({})))).toBe('REDIRECT:/login');
  });
  it('Validierung liefert Formularfeldnamen', async () => {
    als('admin');
    const r = await mitgliedEinladen(INITIAL_ACTION_STATE, form({ email: 'kaputt', name: 'N', rolle: 'verantwortlicher' }));
    expect(Object.keys(r.feldfehler ?? {}).sort()).toEqual(['bereichIds', 'email', 'name']);
    const b = await bereichSpeichern(INITIAL_ACTION_STATE, form({ bereichId: '', name: '', einsatzort: 'mond' }));
    expect(Object.keys(b.feldfehler ?? {}).sort()).toEqual(['einsatzort', 'name']);
    const v = await mitgliedEinladen(INITIAL_ACTION_STATE, form({ email: 'neu@example.org', name: 'Nora Neu', rolle: 'verantwortlicher' }));
    expect(v.feldfehler?.bereichIds).toBeDefined();
    als('sifa');
    const g = await gbuDokumentSetzen(INITIAL_ACTION_STATE, form({ geraetPruefartId: 'x', titel: 'GBU', url: 'http://unsicher.example' }));
    expect(g.feldfehler?.url).toEqual(['Nur https-Links.']);
  });
  it('Mehrfachfelder über getAll: Einladung mit zwei Bereichen', async () => {
    als('admin');
    const r = await mitgliedEinladen(INITIAL_ACTION_STATE, form({
      email: 'nora@example.org', name: 'Nora Neu', rolle: 'verantwortlicher',
      bereichIds: [DEMO_BEREICH_IDS.lager, DEMO_BEREICH_IDS.produktion], prueferTypen: ['zbp'],
    }));
    expect(r).toMatchObject({ status: 'ok', meldung: 'Einladung an nora@example.org versendet.' });
    const m = (await listeMitglieder()).find((x) => x.benutzer.email === 'nora@example.org')!;
    expect(m.bereichNamen).toEqual(['Lager', 'Produktion']);
    expect(m.prueferTypen).toEqual([]);
    const aendern = await mitgliedAendern(INITIAL_ACTION_STATE, form({
      mitgliedschaftId: m.mitgliedschaftId, name: 'Nora Neu', rolle: 'verantwortlicher', bereichIds: [DEMO_BEREICH_IDS.lager],
    }));
    expect(aendern).toMatchObject({ status: 'ok', meldung: 'Gespeichert' });
    expect((await listeMitglieder()).find((x) => x.mitgliedschaftId === m.mitgliedschaftId)!.aktiv).toBe(false); // Checkbox fehlt
  });
  it('Verwaltungsseiten: notFound ohne Recht', async () => {
    als('sifa');
    expect(await fehlerVon(listeBereicheVerwaltung())).toBe('NOT_FOUND');
    expect(await fehlerVon(listeMitglieder())).toBe('NOT_FOUND');
    als('admin');
    expect(await listeBereicheVerwaltung()).toHaveLength(3);
  });
});

describe('Actions I2: Abläufe', () => {
  it('Anlass mit mehreren Prüfarten, Aufheben', async () => {
    als('verantwortlicher');
    const l006 = await geraet('L-006');
    const r = await anlassErfassen(INITIAL_ACTION_STATE, form({
      geraetId: l006.geraet.id, art: 'unfall_schadensfall', datum: addTage(new Date().toISOString().slice(0, 10), -1), beschreibung: 'Last abgestürzt',
      geraetPruefartIds: l006.pruefarten.map((p) => p.pruefart.id),
    }));
    expect(r).toMatchObject({ status: 'ok', meldung: 'Anlass erfasst', id: l006.geraet.id });
    const d = await geraet('L-006');
    expect(d.anlaesse).toHaveLength(2);
    const a = await anlassAufheben(INITIAL_ACTION_STATE, form({ anlassId: d.anlaesse[0].id, grund: 'kurz' }));
    expect(a.feldfehler?.grund).toBeDefined();
    expect((await anlassAufheben(INITIAL_ACTION_STATE, form({ anlassId: d.anlaesse[0].id, grund: 'Falsche Kette erfasst' }))).status).toBe('ok');
  });
  it('Verschieben: VER fremder Bereich → Feldfehler; ADM → Redirect aufs Gerät; VER aus eigenem Bereich hinaus nicht erlaubt', async () => {
    als('verantwortlicher');
    const l007 = await geraet('L-007');
    const r = await geraetVerschieben(INITIAL_ACTION_STATE, form({ geraetId: l007.geraet.id, bereichId: DEMO_BEREICH_IDS.produktion, begruendung: '' }));
    expect(r.feldfehler?.bereichId).toBeDefined();
    als('admin');
    expect(await fehlerVon(geraetVerschieben(INITIAL_ACTION_STATE, form({ geraetId: l007.geraet.id, bereichId: DEMO_BEREICH_IDS.produktion, begruendung: 'Umzug' })))).toBe(`REDIRECT:/geraete/${l007.geraet.id}`);
  });
  it('Betriebsstatus: ausgemustert per Request abgelehnt', async () => {
    als('admin');
    const v003 = await geraet('V-003');
    const r = await betriebsstatusSetzen(INITIAL_ACTION_STATE, form({ geraetId: v003.geraet.id, betriebsstatus: 'ausgemustert', begruendung: '' }));
    expect(r.feldfehler?.betriebsstatus).toBeDefined();
    expect(await betriebsstatusSetzen(INITIAL_ACTION_STATE, form({ geraetId: v003.geraet.id, betriebsstatus: 'in_betrieb', begruendung: '' }))).toMatchObject({ status: 'ok', meldung: 'Betriebsstatus geändert' });
  });
  it('Prüfer zuweisen und entfernen mit Meldung', async () => {
    als('verantwortlicher');
    const p = (await geraet('L-003')).pruefarten[0].pruefart.id;
    expect(await prueferZuweisen(INITIAL_ACTION_STATE, form({ geraetPruefartId: p, prueferId: DEMO_BENUTZER_IDS.tobias }))).toMatchObject({ status: 'ok', meldung: 'Prüfer zugewiesen', id: p });
    expect(await prueferZuweisen(INITIAL_ACTION_STATE, form({ geraetPruefartId: p, prueferId: '' }))).toMatchObject({ status: 'ok', meldung: 'Zuweisung entfernt' });
  });
  it('Nachweis mit Mängeln → Mängelformular → Mangel → zurück; Kenntnis, Behebung; Frist nach Ergebnis', async () => {
    als('pruefer');
    const l001 = await geraet('L-001');
    const p = l001.pruefarten[0].pruefart.id;
    const heute = new Date().toISOString().slice(0, 10);
    const ziel = await fehlerVon(nachweisErfassen(INITIAL_ACTION_STATE, form({
      geraetPruefartId: p, pruefdatum: heute, ergebnis: 'maengel_weiterbetrieb', pruefumfang: 'Wiederkehrende Prüfung',
      prueferName: 'Tobias Berger', unterschriftImPdf: 'on', fristEmpfehlungMonate: '6',
      pdf: new File([new Uint8Array(platzhalterPdf('x'))], 'b.pdf', { type: 'application/pdf' }),
    })));
    const url = new URL(ziel.replace('REDIRECT:', 'http://x'));
    expect(url.pathname).toBe('/maengel/neu');
    expect(url.searchParams.get('geraet')).toBe(l001.geraet.id);
    expect(url.searchParams.get('pruefart')).toBe(p);
    expect(url.searchParams.get('zurueck')).toBe('/pruefer');
    const nachweisId = url.searchParams.get('nachweis')!;
    const formular = await holeMangelFormular(l001.geraet.id, { nachweisId });
    expect(formular).toMatchObject({ vorbelegtePruefartId: p, verantwortliche: [] });
    const m = await fehlerVon(mangelErfassen(INITIAL_ACTION_STATE, form({
      geraetId: l001.geraet.id, geraetPruefartId: p, nachweisId, beschreibung: 'Hydraulik undicht', schwere: 'erheblich',
      termin: addTage(heute, 30), verantwortlichId: '', zurueck: '/pruefer',
    })));
    expect(m).toBe('REDIRECT:/pruefer');

    als('verantwortlicher');
    const mangel = (await listeMaengel()).find((x) => x.beschreibung === 'Hydraulik undicht')!;
    expect(mangel.verantwortlichId).toBeNull();
    expect(await mangelKenntnisNehmen(INITIAL_ACTION_STATE, form({ mangelId: mangel.id, verantwortlichId: DEMO_BENUTZER_IDS.marco, termin: addTage(heute, 10) }))).toMatchObject({ status: 'ok', meldung: 'Zur Kenntnis genommen' });
    expect(await mangelBeheben(INITIAL_ACTION_STATE, form({ mangelId: mangel.id, behobenAm: heute, behobenDurch: 'Linde Service', behebung: 'Dichtung getauscht' }))).toMatchObject({ status: 'ok', meldung: 'Mangel behoben' });
    expect((await mangelBeheben(INITIAL_ACTION_STATE, form({ mangelId: mangel.id, behobenAm: heute, behobenDurch: 'Linde Service', behebung: 'Dichtung getauscht' }))).status).toBe('fehler');

    als('sifa');
    expect(await fristFreigeben(INITIAL_ACTION_STATE, form({
      modus: 'gbu', geraetPruefartId: p, monate: '6', fundstelle: 'GBU Lager 2026', begruendung: 'Empfehlung des Prüfers übernommen', nachweisId,
    }))).toMatchObject({ status: 'ok', meldung: 'Frist freigegeben' });
    expect((await geraet('L-001')).verlauf[0].daten).toMatchObject({ richtung: 'kuerzer', nachweisId });
  });
  it('mangelErfassen: unsicheres zurueck → Default /maengel/{id}', async () => {
    als('verantwortlicher');
    const l002 = await geraet('L-002');
    const ziel = await fehlerVon(mangelErfassen(INITIAL_ACTION_STATE, form({
      geraetId: l002.geraet.id, geraetPruefartId: '', nachweisId: '', beschreibung: 'Rad beschädigt', schwere: 'gering',
      termin: addTage(new Date().toISOString().slice(0, 10), 90), verantwortlichId: DEMO_BENUTZER_IDS.marco, zurueck: '//boese.example',
    })));
    expect(ziel).toMatch(/^REDIRECT:\/maengel\/[0-9a-f-]{36}$/);
  });
});

describe('sichererRuecksprung', () => {
  it.each([
    ['/pruefer', '/pruefer'],
    ['/geraete/60000000-0000-4000-8000-000000000001', '/geraete/60000000-0000-4000-8000-000000000001'],
    ['/maengel?status=offen&x=1', '/maengel?status=offen&x=1'],
    ['//boese.example', '/d'],
    ['https://boese.example', '/d'],
    ['/a//b', '/d'],
    ['javascript:alert(1)', '/d'],
    ['/pfad mit leer', '/d'],
    [null, '/d'],
  ])('%s → %s', (wert, erwartet) => {
    expect(sichererRuecksprung(wert, '/d')).toBe(erwartet);
  });
});
