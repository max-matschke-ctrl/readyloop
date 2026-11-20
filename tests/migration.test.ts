// Test der Migration: statisch (SQL als Text) und, wenn RL_TEST_PG gesetzt ist, gegen ein echtes Postgres
// mit nachgebauter Supabase-Umgebung (tests/sql/). Beispiel: RL_TEST_PG='host=/var/run/postgresql' npm test
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOKEN_MUSTER } from '@/domain/nutzung';
import {
  ANLASS_ARTEN,
  BETRIEBSSTATUS,
  DATUMSHERKUNFT,
  EINSATZORTE,
  EREIGNIS_TYPEN,
  FRIST_QUELLEN,
  GERAETE_KATEGORIEN,
  KATALOG_FREIGABESTATUS,
  MANGEL_SCHWEREN,
  MANGEL_STATUS,
  PRUEF_ERGEBNISSE,
  PRUEFER_TYPEN,
  ROLLEN,
  STUFEN,
  UEBERNAHME_ENDE_ARTEN,
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
    // I1-Migration kennt nur die I1-Typen; die I2-Typen prüft BE-9 gegen die I2-Migration.
    ['typ', EREIGNIS_TYPEN.filter((t) => ['geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst'].includes(t))],
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

// ---------------------------------------------------------------------------
// Inkrement 2 (BE-9)
// ---------------------------------------------------------------------------

const SQL2 = readFileSync(path.resolve(__dirname, '../supabase/migrations/20261126000000_inkrement2.sql'), 'utf8');
const sql2OhneKommentare = SQL2.replace(/--.*$/gm, '');
const klein2 = sql2OhneKommentare.toLowerCase();
const tabellen2 = [...klein2.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
const policies2 = [...klein2.matchAll(/create policy (\w+) on ([\w.]+)\s+for (\w+)/g)].map((m) => ({
  name: m[1],
  tabelle: m[2],
  befehl: m[3],
}));
const alleWerte = (text: string, spalte: string) => {
  const werte = new Set<string>();
  for (const m of text.matchAll(new RegExp(`check \\(${spalte} in \\(([^)]*)\\)`, 'g'))) {
    for (const w of m[1].matchAll(/'([^']*)'/g)) werte.add(w[1]);
  }
  return werte;
};

describe('Migration Inkrement 2', () => {
  it('I1-Migration bleibt unverändert neben I2 bestehen', () => {
    expect(SQL).toContain('-- Readyloop Inkrement 1');
    expect(tabellen2.sort()).toEqual(['anlass', 'mangel']);
  });

  it('jede neue Tabelle hat RLS und organisation_id', () => {
    for (const t of tabellen2) {
      expect(klein2, t).toContain(`alter table public.${t} enable row level security`);
      expect(klein2.split(`create table public.${t} (`)[1].split(');')[0], t).toMatch(/organisation_id uuid not null/);
    }
  });

  it('einzige DELETE-Policy ist bereich_verantwortung (Q-19), keine FOR ALL', () => {
    const del = [...policies, ...policies2].filter((p) => p.befehl === 'delete');
    expect(del).toEqual([{ name: 'bereich_verantwortung_delete', tabelle: 'public.bereich_verantwortung', befehl: 'delete' }]);
    expect(policies2.filter((p) => p.befehl === 'all')).toEqual([]);
  });

  it('keine UPDATE-Policy auf nachweis/ereignis, keine Schreib-Policy auf ereignis', () => {
    expect(policies2.filter((p) => ['public.nachweis', 'public.ereignis'].includes(p.tabelle))).toEqual([]);
  });

  it.each([
    ['art', ANLASS_ARTEN],
    ['schwere', MANGEL_SCHWEREN],
    ['status', MANGEL_STATUS],
    ['typ', EREIGNIS_TYPEN.filter((t) => !['zuordnung_geaendert', 'etikett_erneuert'].includes(t))], // I3M-Typen: eigene Migration
  ] as const)('Check %s enthält genau die Werte aus types.ts', (spalte, werte) => {
    expect([...alleWerte(sql2OhneKommentare, spalte)].sort()).toEqual([...werte].sort());
  });

  it('Prüfertypen der Mitgliedschaft im Check', () => {
    const block = klein2.split('add column pruefer_typen')[1].split(';')[0];
    for (const t of PRUEFER_TYPEN) expect(block).toContain(`'${t}'`);
  });

  it('jede RPC ist security invoker und für authenticated freigegeben', () => {
    const rpcs = [...klein2.matchAll(/create or replace function public\.(\w+)\(/g)].map((m) => m[1]);
    expect(rpcs.sort()).toEqual(['benutzer_id_fuer_email', 'betriebsstatus_setzen', 'frist_setzen', 'geraet_anlegen', 'geraet_verschieben', 'mitglied_speichern']);
    for (const r of rpcs.filter((x) => x !== 'benutzer_id_fuer_email')) {
      const kopf = klein2.split(`create or replace function public.${r}(`)[1].split('$$')[0];
      expect(kopf, r).toContain('security invoker');
      expect(kopf, r).not.toContain('security definer');
    }
    expect(klein2).toMatch(/grant execute on function public\.geraet_anlegen\(jsonb, jsonb\)[^;]*to authenticated/);
  });

  it('Konto-Suche per E-Mail nur für service_role', () => {
    expect(klein2).toContain('revoke all on function public.benutzer_id_fuer_email(text) from public, anon, authenticated');
    expect(klein2).toContain('grant execute on function public.benutzer_id_fuer_email(text) to service_role;');
    expect(klein2).not.toMatch(/benutzer_id_fuer_email\(text\) to authenticated/);
  });

  it('Hilfsfunktionen prüfen aktive Mitgliedschaft', () => {
    for (const f of ['ist_mitglied', 'hat_rolle', 'verantwortet_bereich', 'ist_zugewiesen']) {
      const block = klein2.split(`create or replace function app.${f}(`)[1].split('$$;')[0];
      expect(block, f).toContain('m.aktiv');
      expect(block, f).toContain('security definer');
    }
  });

  it('Spalten-Grants: geraet nur bereich_id/betriebsstatus, nachweis/ereignis ohne UPDATE-Grant', () => {
    expect(klein2).toContain('grant update (bereich_id, betriebsstatus) on public.geraet to authenticated');
    expect(klein2).not.toMatch(/grant update[^;]*on public\.(nachweis|ereignis)/);
    expect(klein2).toMatch(/alter table public\.nachweis\s+add column pdf_dateiname text not null default 'nachweis\.pdf'/);
  });

  it('Ereignisse nur per Trigger (security definer) und Kontext aus set_config', () => {
    const triggerFns = [...klein2.matchAll(/create or replace function app\.(\w+)\(\)\s+returns trigger([^$]*)\$\$/g)];
    expect(triggerFns.length).toBeGreaterThanOrEqual(8);
    for (const [, name, kopf] of triggerFns) expect(kopf, name).toContain('security definer');
    expect(klein2).toContain("set_config('readyloop.kontext'");
    expect(klein2).not.toMatch(/insert into public\.ereignis[^;]*\n[^;]*security invoker/);
  });
});

// ---------------------------------------------------------------------------
// Review-Befunde Inkrement 2 (eigene Migration, bestehende bleiben unverändert)
// ---------------------------------------------------------------------------

const SQL3 = readFileSync(path.resolve(__dirname, '../supabase/migrations/20261127000000_review_i2.sql'), 'utf8');
const klein3 = SQL3.replace(/--.*$/gm, '').toLowerCase();
const block3 = (start: string) => klein3.split(start)[1].split('$$;')[0];

describe('Migration Review I2', () => {
  it('keine neuen Tabellen, keine DELETE- oder FOR-ALL-Policy', () => {
    expect(klein3).not.toMatch(/create table/);
    expect(klein3).not.toMatch(/create policy \w+ on [\w.]+\s+for (delete|all)/);
  });

  it('Befund 1: anlass_erledigt mit Erfassungszeitpunkt bei gleichem Datum', () => {
    const f = block3('create or replace function app.anlass_erledigt(');
    expect(f).toContain('security definer');
    expect(f).toContain("n.ergebnis in ('ohne_maengel', 'maengel_weiterbetrieb')");
    expect(f).toContain('n.pruefdatum > p_datum or (n.pruefdatum = p_datum and n.erfasst_am > p_erfasst_am)');
  });

  it('Befund 3: Aufheben eines erledigten Anlasses wird abgelehnt', () => {
    const f = block3('create or replace function app.anlass_pruefen(');
    const update = f.split("if tg_op = 'insert' then")[1].split('return new;\n  end if;')[1];
    expect(update).toContain('if app.anlass_erledigt(old.geraet_pruefart_id, old.datum, old.erfasst_am) then');
  });

  it('Befund 4: mangel_insert verlangt bei Sifa und VER einen Verantwortlichen', () => {
    const p = klein3.split('create policy mangel_insert on public.mangel')[1].split(';')[0];
    expect(klein3).toContain('drop policy mangel_insert on public.mangel;');
    expect(p).toMatch(/hat_rolle\(organisation_id, array\['sifa'\]\) and verantwortlich_id is not null/);
    expect(p).toMatch(/verantwortet_geraet\(geraet_id\)\s+and verantwortlich_id is not null/);
    expect(p).toContain('app.ist_zugewiesen(geraet_pruefart_id) and verantwortlich_id is null');
  });

  it('Befund 5: email nicht im Spalten-Grant; mitglied_emails nur für Admins; E-Mail nicht änderbar', () => {
    expect(klein3).toContain('revoke select on public.mitgliedschaft from authenticated;');
    const grant = klein3.split('grant select (')[1].split(')')[0];
    expect(grant).not.toContain('email');
    expect(grant).toContain('anzeigename');
    expect(klein3).toContain('revoke update (email) on public.mitgliedschaft from authenticated;');
    const f = block3('create or replace function public.mitglied_emails(');
    expect(f).toContain('security definer');
    expect(f).toContain("app.hat_rolle(p_organisation, array['admin'])");
    const speichern = block3('create or replace function public.mitglied_speichern(').split('else')[0];
    expect(speichern).toContain('security invoker');
    expect(speichern).not.toContain('email');
  });
});

// ---------------------------------------------------------------------------
// Inkrement I3M (BE-19): eigene Migration, frühere bleiben unverändert
// ---------------------------------------------------------------------------

const MIGRATIONEN = path.resolve(__dirname, '../supabase/migrations');
const SQL4 = readFileSync(path.join(MIGRATIONEN, '20261128000000_inkrement3m.sql'), 'utf8');
const sql4OhneKommentare = SQL4.replace(/--.*$/gm, '');
const klein4 = sql4OhneKommentare.toLowerCase();
const tabellen4 = [...klein4.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
const policies4 = [...klein4.matchAll(/create policy (\w+) on ([\w.]+)\s+for (\w+)/g)].map((m) => ({
  name: m[1],
  tabelle: m[2],
  befehl: m[3],
}));
const funktionen4 = [...klein4.matchAll(/create or replace function ((?:app|public)\.\w+)\(([^)]*)\)/g)].map((m) => ({
  name: m[1],
  parameter: m[2],
}));
const block4 = (start: string) => klein4.split(start)[1].split('$$;')[0];

describe('Migration Inkrement I3M', () => {
  it('Migrationsversionen sind eindeutig (Zeitstempel-Präfix)', () => {
    const versionen = readdirSync(MIGRATIONEN).filter((f) => f.endsWith('.sql')).map((f) => f.split('_')[0]);
    expect(new Set(versionen).size).toBe(versionen.length);
    expect(versionen.at(-1)).toBe('20261129000000');
  });

  it('neue Tabellen geraet_token und uebernahme mit RLS und organisation_id', () => {
    expect(tabellen4.sort()).toEqual(['geraet_token', 'uebernahme']);
    for (const t of tabellen4) {
      expect(klein4, t).toContain(`alter table public.${t} enable row level security`);
      expect(klein4.split(`create table public.${t} (`)[1].split(');')[0], t).toMatch(/organisation_id uuid not null/);
      expect(klein4, t).toContain(`revoke all on public.${t} from anon`);
    }
  });

  it('weiterhin einzige DELETE-Policy auf bereich_verantwortung; keine FOR ALL', () => {
    const del = [...policies, ...policies2, ...policies4].filter((p) => p.befehl === 'delete');
    expect(del).toEqual([{ name: 'bereich_verantwortung_delete', tabelle: 'public.bereich_verantwortung', befehl: 'delete' }]);
    expect(policies4.filter((p) => p.befehl === 'all')).toEqual([]);
  });

  it('keine INSERT/UPDATE-Policy auf uebernahme; Schreiben nur über Funktionen', () => {
    expect(policies4.filter((p) => p.tabelle === 'public.uebernahme')).toEqual([
      { name: 'uebernahme_select', tabelle: 'public.uebernahme', befehl: 'select' },
    ]);
    expect(klein4).toContain('revoke insert, update, delete, truncate on public.uebernahme from authenticated');
  });

  it('grant execute an anon genau einmal (geraet_oeffentlich)', () => {
    const anon = [...klein4.matchAll(/grant execute on function ([^;]*?) to ([^;]*);/g)].filter((m) => /\banon\b/.test(m[2]));
    expect(anon.map((m) => m[1].trim())).toEqual(['public.geraet_oeffentlich(text)']);
    for (const f of [SQL, SQL2, SQL3]) expect(f.toLowerCase()).not.toMatch(/grant execute[^;]*to [^;]*\banon\b/);
  });

  it('jede neue Funktion hat revoke execute from public, anon (geraet_oeffentlich: from public)', () => {
    for (const f of funktionen4) {
      const signatur = `${f.name}(${f.parameter.split(',').map((p) => p.trim().split(/\s+/).at(-1)).filter(Boolean).join(', ')})`;
      if (f.name === 'public.geraet_oeffentlich') {
        expect(klein4).toContain(`revoke execute on function ${signatur} from public;`);
      } else {
        expect(klein4, signatur).toMatch(new RegExp(`revoke execute on function ${signatur.replace(/[().[\]]/g, '\\$&')} from public, anon`));
      }
    }
  });

  it('security definer: QR-Seite, Kurzansicht, Übernahme; etikett_erneuern invoker; search_path gesetzt', () => {
    for (const f of ['public.geraet_oeffentlich(', 'public.ma_kurzansichten(', 'public.uebernahme_starten(', 'public.uebernahme_beenden(']) {
      const kopf = klein4.split(`create or replace function ${f}`)[1].split('$$')[0];
      expect(kopf, f).toContain('security definer');
      expect(kopf, f).toContain('set search_path = public, pg_temp');
    }
    const erneuern = klein4.split('create or replace function public.etikett_erneuern(')[1].split('$$')[0];
    expect(erneuern).toContain('security invoker');
    for (const f of funktionen4) {
      const kopf = klein4.split(`create or replace function ${f.name}(`)[1].split('$$')[0];
      expect(kopf, f.name).toContain('set search_path');
    }
  });

  it.each([
    ['ende_art', UEBERNAHME_ENDE_ARTEN],
    ['typ', EREIGNIS_TYPEN],
  ] as const)('Check %s enthält genau die Werte aus types.ts', (spalte, werte) => {
    expect([...alleWerte(sql4OhneKommentare, spalte)].sort()).toEqual([...werte].sort());
  });

  it('Token: Check-Muster = TOKEN_MUSTER, eindeutig, ein aktiver je Gerät, 16 Zufallsbytes', () => {
    const block = klein4.split('create table public.geraet_token (')[1].split(');')[0];
    const muster = SQL4.split('create table public.geraet_token (')[1].match(/token ~ '([^']*)'/)![1];
    expect(muster).toBe(TOKEN_MUSTER.source);
    expect(block).toContain('token text not null unique');
    expect(klein4).toMatch(/create unique index geraet_token_ein_aktiver on public\.geraet_token \(geraet_id\) where aktiv/);
    expect(block4('create or replace function app.neuer_token(')).toContain('gen_random_bytes(16)');
    expect(block4('create or replace function public.geraet_oeffentlich(')).toContain(`!~ '${TOKEN_MUSTER.source.toLowerCase()}'`);
  });

  it('Übernahme: höchstens eine offene je Gerät, Ende-Felder gekoppelt', () => {
    expect(klein4).toMatch(/create unique index uebernahme_eine_offene on public\.uebernahme \(geraet_id\) where bis is null/);
    expect(klein4).toContain('check ((bis is null) = (ende_art is null))');
  });

  it('geraet_oeffentlich liefert keine Personen- oder Bereichsfelder', () => {
    const json = block4('create or replace function app.geraet_status_json(');
    for (const verboten of ['zugeordnet_an', 'benutzer_name', 'erfasst_von_name', 'anzeigename', 'bereich_id', 'beschreibung', "'bereich_name'"]) {
      expect(json, verboten).not.toContain(verboten);
    }
    expect(json).toContain('where n.rang = 1');
  });

  it('Zuordnung: Spalte mit Check, Spalten-Grant, Ereignis ohne Person', () => {
    expect(klein4).toContain("check (zugeordnet_an is null or kategorie = 'personenbezogen')");
    expect(klein4).toContain('grant update (zugeordnet_an) on public.geraet to authenticated');
    const ereignis = block4('create or replace function app.zuordnung_ereignis(');
    expect(ereignis).toContain("jsonb_build_object('zugeordnet', new.zugeordnet_an is not null)");
    expect(ereignis).not.toMatch(/'zugeordnet_an'|mitglied_name/);
  });

  it('Mitgliedschaft: VER nur mitarbeiter; Austritt-Trigger; Pseudonymisierung mit pg_cron nur wenn verfügbar', () => {
    expect(klein4).toMatch(/create policy mitgliedschaft_insert_mitarbeiter on public\.mitgliedschaft\s+for insert[^;]*rolle = 'mitarbeiter'/);
    expect(block4('create or replace function app.mitarbeiter_austritt(')).toContain("ende_art = 'austritt'");
    expect(block4('create or replace function app.uebernahmen_pseudonymisieren(')).toContain("interval '90 days'");
    expect(klein4).toContain("pg_available_extensions where name = 'pg_cron'");
  });

  it('Mangel: MA-Insert ohne Prüfart/Verantwortlichen mit Termin nach Schwere', () => {
    const p = klein4.split('create policy mangel_insert on public.mangel')[1].split(';')[0];
    expect(p).toMatch(/hat_rolle\(organisation_id, array\['mitarbeiter'\]\)\s+and geraet_pruefart_id is null and nachweis_id is null and verantwortlich_id is null/);
    expect(p).toContain("termin = app.heute() + case schwere when 'gefaehrlich' then 0 when 'erheblich' then 30 else 90 end");
  });
});

// ---------------------------------------------------------------------------
// Review I3M (Backend): eigene Migration, 20261128000000 bleibt unverändert
// ---------------------------------------------------------------------------

const SQL5 = readFileSync(path.join(MIGRATIONEN, '20261129000000_review_i3m.sql'), 'utf8');
const klein5 = SQL5.replace(/--.*$/gm, '').toLowerCase();
const block5 = (start: string) => klein5.split(start)[1].split('$$;')[0];

describe('Migration Review I3M', () => {
  it('F-24: Status-JSON und QR-Seite ohne interne IDs; geraet_id nur für Mitglieder der aktuellen Organisation', () => {
    const json = block5('create or replace function app.geraet_status_json(');
    for (const verboten of ["'id'", "'organisation_id'", "'geraet_pruefart_id'", "'geraet_id'", 'zugeordnet_an', 'benutzer_name', 'beschreibung']) {
      expect(json, verboten).not.toContain(verboten);
    }
    expect(json).toContain("'pruefart_nr', pa.nr");
    const oeffentlich = block5('create or replace function public.geraet_oeffentlich(');
    expect(oeffentlich).toMatch(/if auth\.uid\(\) is not null and p_organisation = v_org and app\.ist_mitglied\(v_org\) then\s+v_json := v_json \|\| jsonb_build_object\('geraet_id'/);
    expect(oeffentlich).toContain('security definer');
    expect(block5('create or replace function public.ma_kurzansichten(')).toContain("'geraet_id', g.id");
  });

  it('anon: genau geraet_oeffentlich(text, uuid); alte Signatur entfernt', () => {
    const anon = [...klein5.matchAll(/grant execute on function ([^;]*?) to ([^;]*);/g)].filter((m) => /\banon\b/.test(m[2]));
    expect(anon.map((m) => m[1].trim())).toEqual(['public.geraet_oeffentlich(text, uuid)']);
    expect(klein5).toContain('drop function public.geraet_oeffentlich(text);');
    expect(klein5).toContain('revoke execute on function public.geraet_oeffentlich(text, uuid) from public;');
  });

  it('F-27/US-32: direkter SELECT nur auf offene Übernahmen (auch MA, auch ADM)', () => {
    const p = klein5.split('create policy uebernahme_select on public.uebernahme')[1].split(';')[0];
    expect(p).toMatch(/using \(\s+bis is null and \(/);
    expect(klein5).toContain('drop policy uebernahme_select on public.uebernahme');
  });

  it('uebernahmen_verlauf: ein Gerät, nur admin, nur 90 Tage, security definer, nicht für anon', () => {
    const kopf = klein5.split('create or replace function public.uebernahmen_verlauf(')[1].split('$$')[0];
    expect(kopf).toMatch(/^p_geraet uuid\)/);
    expect(kopf).toContain('security definer');
    expect(kopf).toContain('set search_path = public, pg_temp');
    expect(kopf).not.toContain('beendet_von');
    const rumpf = block5('create or replace function public.uebernahmen_verlauf(');
    expect(rumpf).toContain('u.geraet_id = p_geraet');
    expect(rumpf).toContain("app.hat_rolle(u.organisation_id, array['admin'])");
    expect(rumpf).toContain("u.bis > now() - interval '90 days'");
    expect(rumpf).toContain('u.pseudonymisiert_am is null');
    expect(klein5).toContain('revoke execute on function public.uebernahmen_verlauf(uuid) from public, anon');
  });

  it('pg_cron fehlt im Supabase-Kontext → RAISE WARNING mit Anweisung (nicht still)', () => {
    const block = klein5.split('do $do$')[1].split('$do$;')[0];
    expect(block).toMatch(/elsif exists \(select 1 from pg_roles where rolname = 'supabase_admin'\) then\s+raise warning/);
    expect(block).toContain('cron.schedule(v_job');
    expect(SQL5).toContain('pg_cron aktivieren');
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
    psql(ziel, '../supabase/migrations/20261126000000_inkrement2.sql');
    psql(ziel, '../supabase/migrations/20261127000000_review_i2.sql');
    psql(ziel, '../supabase/migrations/20261128000000_inkrement3m.sql');
    psql(ziel, '../supabase/migrations/20261129000000_review_i3m.sql');
    return [psql(ziel, 'sql/rls-szenario.sql'), psql(ziel, 'sql/rls-szenario-i2.sql'), psql(ziel, 'sql/rls-szenario-i3m.sql')]
      .join('\n')
      .split('\n')
      .map((z) => z.match(/^(.*) \(erw\. (.*)\): (.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map(([, fall, erwartung, ergebnis]) => ({ fall, erwartung, ergebnis }));
  })();

  it('Szenario liefert Fälle', () => {
    expect(zeilen.length).toBeGreaterThan(120);
  });

  it.each(zeilen.map((z) => [z.fall, z] as const))('%s', (_fall, { erwartung, ergebnis }) => {
    if (erwartung === 'FEHLER') expect(ergebnis).toMatch(/^FEHLER /);
    else expect(ergebnis).toBe(erwartung);
  });
});
