// Statischer Test der Migration (liest SQL als Text). Lauf gegen echte DB (pgTAP) folgt in I2.
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
});
