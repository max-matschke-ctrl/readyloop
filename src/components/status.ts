import type { FristStatus } from '@/domain/types';

/** Farbe je Status (Tokens aus globals.css). Status nie nur über Farbe: immer mit Symbol und Text. */
export const STATUS_FARBE: Record<FristStatus, string> = {
  ok: 'var(--color-moss)',
  bald_faellig: 'var(--color-ochre)',
  ueberfaellig: 'var(--color-brick)',
  vor_nutzung_pruefen: 'var(--color-brick)',
  unbekannt: 'var(--color-steel)',
  gbu: 'var(--color-steel)',
};

/**
 * Rahmen- und Linienfarbe je Status (§2.2, §5.2). Ochre erreicht auf Weiß nur 2,8:1,
 * deshalb Rahmen in ochre-600 (3,6:1); alle anderen wie STATUS_FARBE.
 */
export const STATUS_RAND: Record<FristStatus, string> = {
  ...STATUS_FARBE,
  bald_faellig: 'var(--color-ochre-600)',
};

/** Hinterlegung je Status als feste -50-Tokens (§2.4, keine Ad-hoc-Tönungen). */
export const STATUS_FLAECHE: Record<FristStatus, string> = {
  ok: 'var(--color-moss-50)',
  bald_faellig: 'var(--color-ochre-50)',
  ueberfaellig: 'var(--color-brick-50)',
  vor_nutzung_pruefen: 'var(--color-brick-50)',
  unbekannt: 'var(--color-steel-50)',
  gbu: 'var(--color-steel-50)',
};

export const STATUS_SYMBOL: Record<FristStatus, string> = {
  ok: '✓',
  bald_faellig: '!',
  ueberfaellig: '✕',
  vor_nutzung_pruefen: '!',
  unbekannt: '?',
  gbu: '§',
};

/** Kurzlabel für Zähler und Filter; Langtext steht in STATUS_LABEL. */
export const STATUS_KURZ: Record<FristStatus, string> = {
  ueberfaellig: 'Überfällig',
  vor_nutzung_pruefen: 'Vor Nutzung prüfen',
  unbekannt: 'Datum unbekannt',
  gbu: 'Frist über GBU',
  bald_faellig: 'Bald fällig',
  ok: 'In Ordnung',
};

/** Reihenfolge nach Dringlichkeit (§6.8). */
export const STATUS_REIHENFOLGE: readonly FristStatus[] = [
  'ueberfaellig',
  'vor_nutzung_pruefen',
  'bald_faellig',
  'unbekannt',
  'gbu',
  'ok',
];
