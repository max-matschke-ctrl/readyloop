import type { EskalationsEbene } from '@/domain/types';

/** Vorlauf als Text (§8.18): „90 · 60 · 30 Tage“. */
export function staffelText(staffelTage: readonly number[]): string {
  return staffelTage.length === 0 ? '–' : `${staffelTage.join(' · ')} Tage`;
}

/** Kurzlabels der Eskalationsstufen für Tabellenzellen (§8.18); die Formulare nutzen ESKALATIONS_EBENE_LABEL. */
export const ESKALATION_KURZ: Record<EskalationsEbene, string> = {
  verantwortlicher: 'Verantwortliche',
  sifa: 'Sifa',
  admin: 'Admin',
};

/** Eskalation als Text (§8.18): „Verantwortliche 0 · Sifa 7 · Admin 14“. */
export function eskalationText(tage: Record<EskalationsEbene, number>): string {
  return (['verantwortlicher', 'sifa', 'admin'] as const).map((e) => `${ESKALATION_KURZ[e]}\u00a0${tage[e]}`).join(' · ');
}

export function jaNein(wert: boolean): string {
  return wert ? 'ja' : 'nein';
}

const UHRZEIT = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });

/** 'HH:MM' eines Zeitpunkts in Europe/Berlin. */
export function uhrzeit(wert: string): string {
  const d = new Date(wert);
  return Number.isNaN(d.getTime()) ? wert : UHRZEIT.format(d);
}

/** ISO-Datum ± Tage (rein kalendarisch, UTC-Arithmetik ohne Zeitzonenfehler). */
export function plusTage(iso: string, tage: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString().slice(0, 10);
}
