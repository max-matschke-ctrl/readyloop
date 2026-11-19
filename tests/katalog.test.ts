import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ermittleFristVorschlag } from '@/domain/fristen';
import { EINSATZORTE, PRUEFER_TYPEN, STUFEN } from '@/domain/types';
import { PRUEFKATALOG_ENTWURF } from '@/server/katalog/pruefkatalog.entwurf';
import { katalogAlsSql } from '@/server/katalog/sql';

const SEED = path.resolve(__dirname, '../supabase/seed.sql');

describe('Prüfkatalog-Entwurf', () => {
  it('hat 17 Einträge', () => expect(PRUEFKATALOG_ENTWURF).toHaveLength(17));

  it('alle Einträge sind Entwürfe ohne Freigabedaten, Version 1', () => {
    for (const e of PRUEFKATALOG_ENTWURF) {
      expect(e.freigabestatus).toBe('entwurf');
      expect(e.freigegebenVon).toBeNull();
      expect(e.freigegebenAm).toBeNull();
      expect(e.version).toBe(1);
    }
  });

  it('Fundstelle, Quelle-URL, Stufe, Prüfertypen, Einsatzort gültig', () => {
    for (const e of PRUEFKATALOG_ENTWURF) {
      expect(e.fundstelle.trim().length, e.schluessel).toBeGreaterThan(0);
      expect(e.quelleUrl.startsWith('https://'), e.schluessel).toBe(true);
      expect(STUFEN).toContain(e.stufe);
      expect(e.prueferTypen.length).toBeGreaterThan(0);
      for (const t of e.prueferTypen) expect(PRUEFER_TYPEN).toContain(t);
      if (e.einsatzort !== null) expect(EINSATZORTE).toContain(e.einsatzort);
      expect(e.schluessel.startsWith(`${e.geraetegruppe}.`), e.schluessel).toBe(true);
    }
  });

  it('(schluessel, einsatzort, version) und id eindeutig', () => {
    const schluessel = PRUEFKATALOG_ENTWURF.map((e) => `${e.schluessel}|${e.einsatzort}|${e.version}`);
    expect(new Set(schluessel).size).toBe(schluessel.length);
    expect(new Set(PRUEFKATALOG_ENTWURF.map((e) => e.id)).size).toBe(17);
  });

  it('Sicherheitsbeleuchtung ohne Intervall, Stufe C', () => {
    const e = PRUEFKATALOG_ENTWURF.find((k) => k.schluessel === 'sicherheitsbeleuchtung.wiederkehrend');
    expect(e?.intervallMonate).toBeNull();
    expect(e?.stufe).toBe('C');
  });

  it('Entwurf erzeugt nie eine Frist: jeder Schlüssel → gbu/nur_entwurf', () => {
    for (const e of PRUEFKATALOG_ENTWURF) {
      const v = ermittleFristVorschlag({
        pruefart: { katalogSchluessel: e.schluessel, herstellerfristMonate: null, herstellerfristQuelle: null },
        einsatzort: e.einsatzort ?? 'lager_logistik',
        katalog: PRUEFKATALOG_ENTWURF,
      });
      expect(v).toMatchObject({ art: 'gbu', grund: 'nur_entwurf' });
    }
  });

  it('katalogAlsSql() stimmt mit supabase/seed.sql überein', () => {
    const sql = katalogAlsSql();
    if (process.env.UPDATE_SEED === '1') writeFileSync(SEED, sql, 'utf8');
    expect(readFileSync(SEED, 'utf8')).toBe(sql);
  });

  it('SQL maskiert Hochkommas', () => {
    const sql = katalogAlsSql([{ ...PRUEFKATALOG_ENTWURF[0], hinweis: "O'Brien" }]);
    expect(sql).toContain("'O''Brien'");
  });
});
