// BE-12: Supabase-Auth und -Sitzung mit gemocktem Client (keine Supabase-Instanz im Agentenlauf).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieJar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    getAll: () => [...cookieJar.entries()].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => cookieJar.set(name, value),
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

// ---- Fake-Supabase ---------------------------------------------------------
type Zeile = Record<string, unknown>;
const fake = {
  user: null as null | { id: string; email: string },
  tabellen: {} as Record<string, Zeile[]>,
  aufrufe: [] as string[],
  konten: new Map<string, string>(), // email → passwort
};
function abfrage(tabelle: string) {
  const filter: [string, unknown][] = [];
  const builder = {
    select: () => builder,
    eq: (spalte: string, wert: unknown) => {
      filter.push([spalte, wert]);
      return builder;
    },
    then: (ok: (r: { data: Zeile[]; error: null }) => unknown) =>
      Promise.resolve({
        data: (fake.tabellen[tabelle] ?? []).filter((z) => filter.every(([s, w]) => z[s] === w)),
        error: null,
      }).then(ok),
  };
  return builder;
}
const fakeClient = {
  auth: {
    getUser: async () => ({ data: { user: fake.user }, error: fake.user ? null : { message: 'keine Sitzung' } }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      fake.aufrufe.push(`signIn:${email}`);
      if (fake.konten.get(email) === password) return { data: {}, error: null };
      return { data: {}, error: { message: fake.konten.has(email) ? 'Invalid login credentials' : 'User not found' } };
    },
    resetPasswordForEmail: async (email: string, opt: { redirectTo: string }) => {
      fake.aufrufe.push(`reset:${email}:${opt.redirectTo}`);
      return fake.konten.has(email) ? { data: {}, error: null } : { data: null, error: { message: 'User not found' } };
    },
    updateUser: async ({ password }: { password: string }) => {
      fake.aufrufe.push(`update:${password.length}`);
      return { data: {}, error: null };
    },
    signOut: async () => {
      fake.aufrufe.push('signOut');
      return { error: null };
    },
    verifyOtp: async ({ token_hash, type }: { token_hash: string; type: string }) => {
      fake.aufrufe.push(`verify:${type}`);
      return token_hash === 'gut' ? { data: {}, error: null } : { data: null, error: { message: 'abgelaufen' } };
    },
  },
  from: (t: string) => abfrage(t),
};
vi.mock('@supabase/ssr', () => ({ createServerClient: () => fakeClient }));

import { NextRequest } from 'next/server';
import { INITIAL_ACTION_STATE } from '@/domain/types';
import { GET as confirm } from '@/app/api/auth/confirm/route';
import { abmelden, anmelden, bestaetigeOtp, passwortSetzen, passwortVergessen } from '@/server/actions';
import { ANMELDEFEHLER, VERGESSEN_ANTWORT } from '@/server/auth';
import { betriebsmodus, hatAuthSitzung, holeAnmeldestatus, holeSitzung } from '@/server/data';

const ORG_A = '00000000-0000-0000-0000-0000000000a1';
const ORG_B = '00000000-0000-0000-0000-0000000000a2';
const U = '11111111-1111-1111-1111-111111111111';
const form = (w: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(w)) fd.set(k, v);
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

beforeEach(() => {
  cookieJar.clear();
  fake.user = null;
  fake.aufrufe = [];
  fake.konten = new Map([['prf@example.org', 'richtig-und-lang']]);
  fake.tabellen = {
    mitgliedschaft: [
      { id: 'm1', organisation_id: ORG_B, benutzer_id: U, rolle: 'pruefer', anzeigename: 'Tobias B.', email: 'prf@example.org', aktiv: true,
        organisation: { id: ORG_B, name: 'Muster Metallbau GmbH', bg: null } },
      { id: 'm2', organisation_id: ORG_A, benutzer_id: U, rolle: 'verantwortlicher', anzeigename: 'Tobias Berger', email: 'prf@example.org', aktiv: true,
        organisation: { id: ORG_A, name: 'Elbtal Fördertechnik GmbH', bg: 'BG HM' } },
    ],
    bereich_verantwortung: [{ mitgliedschaft_id: 'm2', bereich_id: 'b-lager' }],
  };
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'x');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.example/');
});
afterEach(() => vi.unstubAllEnvs());

describe('Modus supabase: Sitzung', () => {
  it('ohne Auth-Benutzer → abgemeldet', async () => {
    expect(betriebsmodus()).toBe('supabase');
    expect(await holeSitzung()).toBeNull();
    expect(await holeAnmeldestatus()).toBe('abgemeldet');
    expect(await hatAuthSitzung()).toBe(false);
  });
  it('alphabetisch erste Organisation, Name aus Mitgliedschaft, Bereiche bei VER', async () => {
    fake.user = { id: U, email: 'prf@example.org' };
    const s = (await holeSitzung())!;
    expect(s.organisation.name).toBe('Elbtal Fördertechnik GmbH');
    expect(s).toMatchObject({ rolle: 'verantwortlicher', bereichIds: ['b-lager'], demo: false, benutzer: { name: 'Tobias Berger' } });
    expect(s.organisationen.map((o) => o.id)).toEqual([ORG_A, ORG_B]);
    expect(await holeAnmeldestatus()).toBe('angemeldet');
  });
  it('rl_org wählt Organisation; Demo-Cookie wird ignoriert', async () => {
    fake.user = { id: U, email: 'prf@example.org' };
    cookieJar.set('rl_org', ORG_B);
    cookieJar.set('rl_demo_rolle', 'admin');
    const s = (await holeSitzung())!;
    expect(s).toMatchObject({ rolle: 'pruefer', bereichIds: [], benutzer: { name: 'Tobias B.' } });
    expect(s.organisation.id).toBe(ORG_B);
  });
  it('Auth-Benutzer ohne aktive Mitgliedschaft → ohne_mitgliedschaft', async () => {
    fake.user = { id: '99999999-9999-9999-9999-999999999999', email: 'x@example.org' };
    expect(await holeSitzung()).toBeNull();
    expect(await holeAnmeldestatus()).toBe('ohne_mitgliedschaft');
    expect(await hatAuthSitzung()).toBe(true);
  });
});

describe('Auth-Actions', () => {
  it('anmelden: falsches Passwort und unbekannte E-Mail → gleiche Meldung; Erfolg → /', async () => {
    const a = await anmelden(INITIAL_ACTION_STATE, form({ email: 'prf@example.org', passwort: 'falsch' }));
    const b = await anmelden(INITIAL_ACTION_STATE, form({ email: 'unbekannt@example.org', passwort: 'egal' }));
    expect(a).toEqual({ status: 'fehler', meldung: ANMELDEFEHLER });
    expect(b).toEqual(a);
    expect(await fehlerVon(anmelden(INITIAL_ACTION_STATE, form({ email: ' PRF@example.org ', passwort: 'richtig-und-lang' })))).toBe('REDIRECT:/');
    expect(fake.aufrufe).toContain('signIn:prf@example.org');
  });
  it('passwortVergessen: bekannte und unbekannte E-Mail → dieselbe Antwort; redirectTo auf /api/auth/confirm', async () => {
    const a = await passwortVergessen(INITIAL_ACTION_STATE, form({ email: 'prf@example.org' }));
    const b = await passwortVergessen(INITIAL_ACTION_STATE, form({ email: 'unbekannt@example.org' }));
    expect(a).toEqual({ status: 'ok', meldung: VERGESSEN_ANTWORT });
    expect(b).toEqual(a);
    expect(fake.aufrufe).toContain('reset:prf@example.org:https://app.example/api/auth/confirm?next=/passwort-neu');
  });
  it('passwortSetzen: ohne Auth-Sitzung Fehler; zu kurz → Feldfehler; ok → /', async () => {
    expect((await passwortSetzen(INITIAL_ACTION_STATE, form({ passwort: 'lang-genug-123', passwortWiederholung: 'lang-genug-123' }))).status).toBe('fehler');
    fake.user = { id: U, email: 'prf@example.org' };
    const kurz = await passwortSetzen(INITIAL_ACTION_STATE, form({ passwort: 'kurz', passwortWiederholung: 'kurz' }));
    expect(kurz.feldfehler?.passwort).toBeDefined();
    const ungleich = await passwortSetzen(INITIAL_ACTION_STATE, form({ passwort: 'lang-genug-123', passwortWiederholung: 'lang-genug-124' }));
    expect(ungleich.feldfehler?.passwortWiederholung).toBeDefined();
    expect(await fehlerVon(passwortSetzen(INITIAL_ACTION_STATE, form({ passwort: 'lang-genug-123', passwortWiederholung: 'lang-genug-123' })))).toBe('REDIRECT:/');
  });
  it('abmelden: signOut, rl_org und rl_demo_rolle gelöscht', async () => {
    cookieJar.set('rl_org', ORG_A);
    cookieJar.set('rl_demo_rolle', 'admin');
    expect(await fehlerVon(abmelden())).toBe('REDIRECT:/login');
    expect(fake.aufrufe).toContain('signOut');
    expect(cookieJar.size).toBe(0);
  });
});

describe('GET /api/auth/confirm (Befund I2-7: kein verifyOtp beim GET)', () => {
  const aufruf = async (qs: string) => (await confirm(new NextRequest(`https://app.example/api/auth/confirm?${qs}`))).headers.get('location');
  it('invite/recovery → Bestätigungsseite mit token_hash, type, next; verifyOtp nicht aufgerufen', async () => {
    expect(await aufruf('token_hash=gut&type=invite&next=/passwort-neu')).toBe(
      'https://app.example/auth/bestaetigen?token_hash=gut&type=invite&next=%2Fpasswort-neu',
    );
    expect(await aufruf('token_hash=gut&type=recovery')).toBe(
      'https://app.example/auth/bestaetigen?token_hash=gut&type=recovery&next=%2Fpasswort-neu',
    );
    expect(fake.aufrufe.filter((a) => a.startsWith('verify'))).toEqual([]);
  });
  it('unsicheres next → Default; falscher Typ oder fehlender Token → /login?fehler=link', async () => {
    expect(await aufruf('token_hash=gut&type=recovery&next=//boese.example')).toBe(
      'https://app.example/auth/bestaetigen?token_hash=gut&type=recovery&next=%2Fpasswort-neu',
    );
    expect(await aufruf('token_hash=gut&type=recovery&next=https://boese.example')).toContain('next=%2Fpasswort-neu');
    expect(await aufruf('token_hash=gut&type=signup')).toBe('https://app.example/login?fehler=link');
    expect(await aufruf('type=invite')).toBe('https://app.example/login?fehler=link');
    expect(fake.aufrufe).toEqual([]);
  });
  it('ohne Supabase-Konfiguration → /login?fehler=link', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(await aufruf('token_hash=gut&type=invite')).toBe('https://app.example/login?fehler=link');
  });
});

describe('Server Action bestaetigeOtp (Befund I2-7)', () => {
  it('gültiger Token → verifyOtp und Weiterleitung auf bereinigtes next', async () => {
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'gut', type: 'invite', next: '/passwort-neu' })))).toBe('REDIRECT:/passwort-neu');
    expect(fake.aufrufe).toEqual(['verify:invite']);
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'gut', type: 'recovery', next: '//boese.example' })))).toBe('REDIRECT:/passwort-neu');
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'gut', type: 'recovery', next: 'https://boese.example' })))).toBe('REDIRECT:/passwort-neu');
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'gut', type: 'recovery' })))).toBe('REDIRECT:/passwort-neu');
  });
  it('abgelaufener Token, falscher Typ oder fehlender Token → /login?fehler=link', async () => {
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'alt', type: 'invite' })))).toBe('REDIRECT:/login?fehler=link');
    fake.aufrufe = [];
    expect(await fehlerVon(bestaetigeOtp(form({ token_hash: 'gut', type: 'signup' })))).toBe('REDIRECT:/login?fehler=link');
    expect(await fehlerVon(bestaetigeOtp(form({ type: 'invite' })))).toBe('REDIRECT:/login?fehler=link');
    expect(fake.aufrufe).toEqual([]);
  });
});

describe('Service-Role-Schlüssel (F-8)', () => {
  const wurzel = path.resolve(__dirname, '..');
  const dateien = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = path.join(dir, n);
      return statSync(p).isDirectory() ? dateien(p) : /\.(ts|tsx|js|mjs)$/.test(n) ? [p] : [];
    });
  it('kommt in keiner Datei unter src/app/** vor und nie als NEXT_PUBLIC_*', () => {
    for (const d of dateien(path.join(wurzel, 'src/app'))) {
      expect(readFileSync(d, 'utf8'), d).not.toMatch(/SERVICE_ROLE/);
    }
    const alle = [...dateien(path.join(wurzel, 'src')), path.join(wurzel, '.env.example')];
    for (const d of alle) expect(readFileSync(d, 'utf8'), d).not.toMatch(/NEXT_PUBLIC_[A-Z_]*SERVICE/);
  });
  it('wird nur in src/server/supabase/admin.ts gelesen; admin.ts nirgends in src/app importiert', () => {
    const treffer = dateien(path.join(wurzel, 'src')).filter((d) => readFileSync(d, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'));
    expect(treffer.map((d) => path.relative(wurzel, d))).toEqual(['src/server/supabase/admin.ts']);
    for (const d of dateien(path.join(wurzel, 'src/app'))) expect(readFileSync(d, 'utf8'), d).not.toMatch(/supabase\/admin/);
  });
});
