// Test der Migration: statisch (SQL als Text) und, wenn RL_TEST_PG gesetzt ist, gegen ein echtes Postgres
// mit nachgebauter Supabase-Umgebung (tests/sql/). Beispiel: RL_TEST_PG='host=/var/run/postgresql' npm test
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BETRIEBSSTATUS,
  DATUMSHERKUNFT,
  EINSATZORTE,
  EREIGNIS_TYPEN,
  FRIST_QUELLEN,
  GERAETE_KATEGORIEN,
  KATALOG_FREIGABESTATUS,
  PRUEF_ERGEBNISSE,
  PRUEFER_TYPEN,
  ROLLEN,
  STUFEN,
} from '@/domain/types';

const SQL = readFileSync(path.resolve(__dirname, '../supabase/migrations/20261119000000_init.sql'), 'utf8');
const sqlOhneKommentare = SQL.replace(/--.*$/gm, '');
const klein = sqlOhneKommentare.toLowerCase();

const tabellen = [...klein.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
const policies = [...klein.matchAll(/create policy (\w+) on ([\w.]+)\s+for (\w+)/g)].map((m) => ({
  name: m[1],
  tabelle: m[2],
  befehl: m[3],
}));

/** Werte aller check-Listen `spalte in ('a', 'b')` für eine Spalte. */
function checkWerte(spalte: string): Set<string> {
  const werte = new Set<string>();
  const re = new RegExp(`check \\(${spalte} in \\(([^)]*)\\)`, 'g');
  for (const m of sqlOhneKommentare.matchAll(re)) for (const w of m[1].matchAll(/'([^']*)'/g)) werte.add(w[1]);
  return werte;
}

describe('Migration init', () => {
  it('legt die I1-Tabellen an', () => {
    expect(tabellen.sort()).toEqual(
      [
        'bereich',
        'bereich_verantwortung',
        'ereignis',
        'geraet',
        'geraet_pruefart',
        'katalog_eintrag',
        'mitgliedschaft',
        'nachweis',
        'organisation',
        'standort',
      ].sort(),
    );
  });

  it('jede Tabelle hat RLS aktiviert', () => {
    for (const t of tabellen) expect(klein, t).toContain(`alter table public.${t} enable row level security`);
  });

  it('jede Tabelle mit Betriebsbezug hat organisation_id', () => {
    for (const t of tabellen.filter((x) => x !== 'organisation' && x !== 'katalog_eintrag')) {
      const block = klein.split(`create table public.${t} (`)[1].split(');')[0];
      expect(block, t).toMatch(/organisation_id uuid not null/);
    }
  });

  it('keine DELETE-Policy', () => {
    expect(policies.filter((p) => p.befehl === 'delete')).toEqual([]);
    expect(policies.filter((p) => p.befehl === 'all')).toEqual([]);
  });

  it('keine UPDATE- oder INSERT-Policy auf Ereignis, keine UPDATE-Policy auf Nachweis', () => {
    expect(policies.filter((p) => p.tabelle === 'public.ereignis' && p.befehl !== 'select')).toEqual([]);
    expect(policies.filter((p) => p.tabelle === 'public.nachweis' && p.befehl === 'update')).toEqual([]);
  });

  it('Nachweis und Ereignis per Trigger append-only', () => {
    expect(klein).toMatch(/create trigger nachweis_append_only before update or delete on public\.nachweis/);
    expect(klein).toMatch(/create trigger ereignis_append_only before update or delete on public\.ereignis/);
  });

  it('Katalog: global lesbar, keine Schreib-Policy', () => {
    const k = policies.filter((p) => p.tabelle === 'public.katalog_eintrag');
    expect(k).toEqual([{ name: 'katalog_eintrag_select', tabelle: 'public.katalog_eintrag', befehl: 'select' }]);
    expect(klein).toContain('revoke insert, update, delete, truncate on public.katalog_eintrag from authenticated');
  });

  it('Hilfsfunktionen sind security definer mit search_path', () => {
    for (const f of ['ist_mitglied', 'hat_rolle', 'verantwortet_bereich', 'ist_zugewiesen', 'sieht_geraet']) {
      const block = klein.split(`create or replace function app.${f}(`)[1]?.split('$$;')[0];
      expect(block, f).toBeDefined();
      expect(block).toContain('security definer');
      expect(block).toContain('stable');
      expect(block).toContain('set search_path');
    }
  });

  it('Frist-Konsistenz und Herkunft als Check', () => {
    expect(klein).toContain('constraint frist_vollstaendig check');
    expect(klein).toContain('constraint frist_gbu_begruendung check');
    expect(klein).toContain("check ((letzte_pruefung is null) = (letzte_pruefung_herkunft = 'unbekannt'))");
  });

  it('Storage-Bucket privat, keine UPDATE/DELETE-Policy', () => {
    expect(klein).toMatch(/values \('nachweise', 'nachweise', false/);
    expect(policies.filter((p) => p.tabelle === 'storage.objects').map((p) => p.befehl).sort()).toEqual(['insert', 'select']);
  });

  it.each([
    ['rolle', ROLLEN],
    ['betriebsstatus', BETRIEBSSTATUS],
    ['freigabestatus', KATALOG_FREIGABESTATUS],
    ['einsatzort', EINSATZORTE],
    ['kategorie', GERAETE_KATEGORIEN],
    ['stufe', STUFEN],
    ['frist_stufe', STUFEN],
    ['frist_quelle', FRIST_QUELLEN],
    ['ergebnis', PRUEF_ERGEBNISSE],
    ['letzte_pruefung_herkunft', DATUMSHERKUNFT],
    ['typ', EREIGNIS_TYPEN],
  ] as const)('Check %s enthält genau die Werte aus types.ts', (spalte, werte) => {
    expect([...checkWerte(spalte)].sort()).toEqual([...werte].sort());
  });

  it('Prüfertypen im Katalog-Check', () => {
    for (const t of PRUEFER_TYPEN) expect(sqlOhneKommentare).toContain(`'${t}'`);
  });

  // Review-Befunde Inkrement 1 (statisch)
  const policyBlock = (name: string) => klein.split(`create policy ${name} on`)[1].split(';')[0];
  const funktion = (name: string) => klein.split(`create or replace function app.${name}(`)[1].split('$$;')[0];

  it('Befund 1: Storage-Lesen über die Nachweis-Zeile, nicht pro Gerät', () => {
    const sel = policyBlock('nachweise_select');
    expect(sel).not.toContain('sieht_geraet');
    expect(sel).toContain('from public.nachweis n');
    expect(sel).toContain('n.pdf_pfad = objects.name');
    expect(sel).toContain('app.ist_zugewiesen(n.geraet_pruefart_id)');
  });

  it('Befund 1: Storage-Upload nur in Prüfart-Ordner mit Erfassungsrecht', () => {
    const ins = policyBlock('nachweise_insert');
    expect(ins).not.toContain('sieht_geraet');
    expect(ins).toContain('from public.geraet_pruefart gp');
    expect(ins).toContain('(storage.foldername(objects.name))[3]');
    expect(ins).toContain('app.ist_zugewiesen(gp.id)');
    expect(ins).toMatch(/objects\.name ~ '\^/);
    expect(klein).toContain("geraet_pruefart_id::text || '/' || id::text || '.pdf'");
  });

  it('Befund 3: Katalogzweig prüft F-2-Eintrag, Stufe und Herstellervorrang; gbu/hersteller Stufe C', () => {
    const f = funktion('frist_stempeln');
    const katalog = f.split("elsif new.frist_quelle = 'katalog' then")[1].split('elsif')[0];
    expect(katalog).toContain('wahl.stufe is distinct from new.frist_stufe');
    expect(katalog).toContain('wahl.id is distinct from new.frist_katalog_eintrag_id');
    expect(katalog).toContain('new.herstellerfrist_monate < wahl.intervall_monate');
    expect(f).toContain('wahl := app.katalog_wahl(new.katalog_schluessel, ort)');
    expect(f.split("if new.frist_quelle = 'gbu' then")[1]).toMatch(/^\s*new\.frist_stufe := 'c';/);
    expect(f.split("elsif new.frist_quelle = 'hersteller' then")[1]).toMatch(/^\s*new\.frist_stufe := 'c';/);
  });

  it('Befund 4: Prüfart-INSERT ohne Frist, Datum nicht in der Zukunft, Herkunft nicht nachweis', () => {
    const p = policyBlock('geraet_pruefart_insert');
    expect(p).toContain('frist_monate is null');
    expect(p).toContain("letzte_pruefung <= (now() at time zone 'europe/berlin')::date");
    expect(p).toContain("letzte_pruefung_herkunft <> 'nachweis'");
  });

  it('Befund 5: Nachweis-INSERT nur mit eigener oder leerer pruefer_benutzer_id', () => {
    expect(policyBlock('nachweis_insert')).toContain('(pruefer_benutzer_id is null or pruefer_benutzer_id = auth.uid())');
  });

  it('Befund 6: Stufe-A-Höchstfrist über F-2-Auswahl (exakter Ort vor null, höchste Version)', () => {
    const w = funktion('katalog_wahl');
    expect(w).toContain('k.einsatzort = p_ort');
    expect(w).toContain('k.einsatzort is null');
    expect(w.match(/select max\(x\.version\)/g)).toHaveLength(2);
    expect(w).toContain('if found then');
    expect(funktion('frist_stempeln')).not.toContain('min(k.intervall_monate)');
  });
});

const PG = process.env.RL_TEST_PG;

describe.skipIf(!PG)('Migration gegen Postgres (RL_TEST_PG)', () => {
  const db = 'rl_migrationstest';
  const psql = (verbindung: string, datei: string, stopp = true) =>
    execFileSync(
      'psql',
      [`${verbindung}`, '-q', '-X', '-v', `ON_ERROR_STOP=${stopp ? 1 : 0}`, '-f', path.resolve(__dirname, datei)],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

  const zeilen = (() => {
    if (!PG) return [];
    execFileSync('psql', [`${PG} dbname=postgres`, '-q', '-c', `drop database if exists ${db}`, '-c', `create database ${db}`], {
      stdio: 'ignore',
    });
    const ziel = `${PG} dbname=${db}`;
    psql(ziel, 'sql/supabase-stub.sql', false);
    psql(ziel, '../supabase/migrations/20261119000000_init.sql');
    return psql(ziel, 'sql/rls-szenario.sql')
      .split('\n')
      .map((z) => z.match(/^(.*) \(erw\. (.*)\): (.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map(([, fall, erwartung, ergebnis]) => ({ fall, erwartung, ergebnis }));
  })();

  it('Szenario liefert Fälle', () => {
    expect(zeilen.length).toBeGreaterThan(20);
  });

  it.each(zeilen.map((z) => [z.fall, z] as const))('%s', (_fall, { erwartung, ergebnis }) => {
    if (erwartung === 'FEHLER') expect(ergebnis).toMatch(/^FEHLER /);
    else expect(ergebnis).toBe(erwartung);
  });
});
