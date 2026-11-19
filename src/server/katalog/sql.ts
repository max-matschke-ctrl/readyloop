// Erzeugt supabase/seed.sql aus dem Katalog-Entwurf (BE-3). Prüfung in tests/katalog.test.ts.
import type { KatalogEintrag } from '@/domain/types';
import { PRUEFKATALOG_ENTWURF } from './pruefkatalog.entwurf';

const SPALTEN = [
  'id',
  'schluessel',
  'version',
  'geraetegruppe',
  'geraetegruppe_label',
  'pruefart',
  'einsatzort',
  'intervall_monate',
  'stufe',
  'fundstelle',
  'quelle_url',
  'pruefer_typen',
  'hinweis',
  'freigabestatus',
  'freigegeben_von',
  'freigegeben_am',
] as const;

function text(wert: string | null): string {
  return wert === null ? 'null' : `'${wert.replace(/'/g, "''")}'`;
}

function zahl(wert: number | null): string {
  return wert === null ? 'null' : String(wert);
}

function zeile(e: KatalogEintrag): string {
  const werte = [
    `${text(e.id)}::uuid`,
    text(e.schluessel),
    zahl(e.version),
    text(e.geraetegruppe),
    text(e.geraetegruppeLabel),
    text(e.pruefart),
    text(e.einsatzort),
    zahl(e.intervallMonate),
    text(e.stufe),
    text(e.fundstelle),
    text(e.quelleUrl),
    `array[${e.prueferTypen.map(text).join(', ')}]::text[]`,
    text(e.hinweis),
    text(e.freigabestatus),
    text(e.freigegebenVon),
    e.freigegebenAm === null ? 'null' : `${text(e.freigegebenAm)}::date`,
  ];
  return `  (${werte.join(', ')})`;
}

export function katalogAlsSql(eintraege: readonly KatalogEintrag[] = PRUEFKATALOG_ENTWURF): string {
  return [
    '-- Automatisch erzeugt aus src/server/katalog/pruefkatalog.entwurf.ts – nicht von Hand bearbeiten.',
    '-- Neu erzeugen: UPDATE_SEED=1 npm test',
    '-- Alle Einträge sind Entwürfe (freigabestatus = entwurf) und erzeugen keine Fristen.',
    `insert into public.katalog_eintrag (${SPALTEN.join(', ')})`,
    'values',
    eintraege.map(zeile).join(',\n'),
    'on conflict (id) do nothing;',
    '',
  ].join('\n');
}
