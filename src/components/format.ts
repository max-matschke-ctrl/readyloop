import type { IsoDate, IsoDateTime } from '@/domain/types';

/** 'TT.MM.JJJJ' aus 'YYYY-MM-DD' (rein textuell, ohne Zeitzone). */
export function datum(wert: IsoDate | null | undefined): string {
  if (!wert) return '–';
  const [j, m, t] = wert.split('-');
  return j && m && t ? `${t}.${m}.${j}` : wert;
}

const ZEITPUNKT = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** 'TT.MM.JJJJ, HH:MM' in Europe/Berlin. */
export function zeitpunkt(wert: IsoDateTime): string {
  const d = new Date(wert);
  return Number.isNaN(d.getTime()) ? wert : ZEITPUNKT.format(d);
}

/** Resttage als Text, z. B. „in 12 Tagen“, „heute fällig“, „seit 3 Tagen überfällig“. */
export function restTageText(restTage: number | null): string | null {
  if (restTage === null) return null;
  if (restTage === 0) return 'heute fällig';
  if (restTage === 1) return 'morgen fällig';
  if (restTage > 1) return `in ${restTage} Tagen`;
  const t = -restTage;
  return t === 1 ? 'seit 1 Tag überfällig' : `seit ${t} Tagen überfällig`;
}

export function monate(n: number): string {
  return n === 1 ? '1 Monat' : `${n} Monate`;
}
