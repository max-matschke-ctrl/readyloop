// BE-28 / F-43: Der Service-Role-Schlüssel steht nur in zwei Dateien; der System-Client hat genau einen Importeur;
// keine Seite unter src/app/** (außer API-Routen) importiert den Systemzugriff.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../src');
function dateien(verz: string): string[] {
  return readdirSync(verz).flatMap((n) => {
    const p = path.join(verz, n);
    return statSync(p).isDirectory() ? dateien(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
const ALLE = dateien(SRC).map((p) => ({ rel: path.relative(path.resolve(__dirname, '..'), p).split(path.sep).join('/'), text: readFileSync(p, 'utf8') }));
const importiert = (text: string, ziel: RegExp) =>
  [...text.matchAll(/(?:from\s+|import\(\s*)['"]([^'"]+)['"]/g)].some((m) => ziel.test(m[1]));

describe('Service-Role-Zugriff (F-43)', () => {
  it('SUPABASE_SERVICE_ROLE_KEY nur in supabase/admin.ts und supabase/system.ts', () => {
    expect(ALLE.filter((d) => d.text.includes('SUPABASE_SERVICE_ROLE_KEY')).map((d) => d.rel).sort()).toEqual([
      'src/server/supabase/admin.ts',
      'src/server/supabase/system.ts',
    ]);
  });
  it('supabase/system wird nur vom Supabase-System-Repository importiert', () => {
    expect(ALLE.filter((d) => importiert(d.text, /(^|\/)supabase\/system$/)).map((d) => d.rel)).toEqual([
      'src/server/repo/supabase/system-repository.ts',
    ]);
  });
  it('nichts unter src/app/** außer src/app/api/** importiert erinnerungen/system oder das System-Repository', () => {
    const verstoesse = ALLE.filter(
      (d) =>
        d.rel.startsWith('src/app/') &&
        !d.rel.startsWith('src/app/api/') &&
        importiert(d.text, /erinnerungen\/system$|system-repository$|supabase\/system$/),
    );
    expect(verstoesse.map((d) => d.rel)).toEqual([]);
  });
  it('kein Client-Code (use client) importiert Server-Mail oder Erinnerungen', () => {
    const client = ALLE.filter((d) => /^['"]use client['"]/m.test(d.text));
    for (const d of client) expect(importiert(d.text, /@\/server\/(mail|erinnerungen)/), d.rel).toBe(false);
  });
});
