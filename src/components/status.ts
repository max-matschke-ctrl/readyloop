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
