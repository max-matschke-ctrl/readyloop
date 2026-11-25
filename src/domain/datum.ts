// Vertrag §3.4 – reine Datumsfunktionen auf Kalendertagen 'YYYY-MM-DD' (keine Zeitzonen-Effekte).
import type { IsoDate } from './types';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TAG_MS = 24 * 60 * 60 * 1000;

function zerlege(datum: IsoDate): { j: number; m: number; t: number } {
  const treffer = ISO_RE.exec(datum);
  if (!treffer || !istIsoDate(datum)) throw new Error(`Ungültiges Datum: ${datum}`);
  return { j: Number(treffer[1]), m: Number(treffer[2]), t: Number(treffer[3]) };
}

function tageImMonat(jahr: number, monat: number): number {
  // monat 1–12; Tag 0 des Folgemonats = letzter Tag des Monats
  return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
}

function zweistellig(n: number): string {
  return String(n).padStart(2, '0');
}

function baue(j: number, m: number, t: number): IsoDate {
  return `${String(j).padStart(4, '0')}-${zweistellig(m)}-${zweistellig(t)}`;
}

export function istIsoDate(wert: string): boolean {
  const treffer = ISO_RE.exec(wert);
  if (!treffer) return false;
  const j = Number(treffer[1]);
  const m = Number(treffer[2]);
  const t = Number(treffer[3]);
  if (m < 1 || m > 12 || t < 1) return false;
  return t <= tageImMonat(j, m);
}

/** Monatsende-Klemme: 31.01. + 1 Monat = 28./29.02. */
export function addMonate(datum: IsoDate, monate: number): IsoDate {
  if (!Number.isInteger(monate)) throw new Error(`Monate müssen ganzzahlig sein: ${monate}`);
  const { j, m, t } = zerlege(datum);
  const index = j * 12 + (m - 1) + monate;
  const zielJahr = Math.floor(index / 12);
  const zielMonat = (index % 12) + 1;
  return baue(zielJahr, zielMonat, Math.min(t, tageImMonat(zielJahr, zielMonat)));
}

/** bis − von in Kalendertagen. */
export function tageZwischen(von: IsoDate, bis: IsoDate): number {
  const a = zerlege(von);
  const b = zerlege(bis);
  return Math.round((Date.UTC(b.j, b.m - 1, b.t) - Date.UTC(a.j, a.m - 1, a.t)) / TAG_MS);
}

/** Addiert Kalendertage (negativ = zurück). */
export function addTage(datum: IsoDate, tage: number): IsoDate {
  const { j, m, t } = zerlege(datum);
  const d = new Date(Date.UTC(j, m - 1, t) + tage * TAG_MS);
  return baue(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function heuteBerlin(jetzt: Date = new Date()): IsoDate {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(jetzt);
  const wert = (typ: string) => teile.find((p) => p.type === typ)?.value ?? '';
  return `${wert('year')}-${wert('month')}-${wert('day')}`;
}

/** 'TT.MM.JJJJ' */
export function formatDatum(datum: IsoDate): string {
  const { j, m, t } = zerlege(datum);
  return `${zweistellig(t)}.${zweistellig(m)}.${String(j).padStart(4, '0')}`;
}

// ---------- I3 (§9.4): Wochentage und ISO-Wochen ----------

/** ISO-Wochentag: Mo = 1 … So = 7. */
export function wochentag(datum: IsoDate): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const { j, m, t } = zerlege(datum);
  const tag = new Date(Date.UTC(j, m - 1, t)).getUTCDay(); // So = 0
  return (tag === 0 ? 7 : tag) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** Mo–Fr (keine Feiertagslogik, Q-51). */
export function istWerktag(datum: IsoDate): boolean {
  return wochentag(datum) <= 5;
}

/** Montag der ISO-Woche, in der das Datum liegt. */
export function isoWocheMontag(datum: IsoDate): IsoDate {
  return addTage(datum, 1 - wochentag(datum));
}

/** ISO-Kalenderwoche 1–53 (Woche mit dem ersten Donnerstag des Jahres = KW 1). */
export function isoKalenderwoche(datum: IsoDate): number {
  const donnerstag = addTage(datum, 4 - wochentag(datum));
  const jahr = zerlege(donnerstag).j;
  return Math.floor(tageZwischen(baue(jahr, 1, 1), donnerstag) / 7) + 1;
}
