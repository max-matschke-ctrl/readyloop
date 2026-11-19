// Vertrag §5.7 – Mängel (F-14). Rein und deterministisch.
import { addTage } from './datum';
import { MANGEL_TERMIN_TAGE } from './types';
import type { IsoDate, Mangel, MangelSchwere, MangelStatus } from './types';

const UEBERGAENGE: Record<MangelStatus, readonly MangelStatus[]> = {
  offen: ['in_bearbeitung', 'behoben'],
  in_bearbeitung: ['behoben'],
  behoben: [],
};

/** F-14: offen → in_bearbeitung → behoben; offen → behoben direkt; kein Rückweg. */
export function mangelUebergangErlaubt(von: MangelStatus, nach: MangelStatus): boolean {
  return UEBERGAENGE[von].includes(nach);
}

/** Q-16: gefährlich = heute, erheblich = +30, gering = +90 Tage. */
export function terminVorschlag(schwere: MangelSchwere, heute: IsoDate): IsoDate {
  return addTage(heute, MANGEL_TERMIN_TAGE[schwere]);
}

/** offen oder in_bearbeitung */
export function istMangelOffen(m: Pick<Mangel, 'status'>): boolean {
  return m.status !== 'behoben';
}

/** Termin überschritten: nicht behoben und termin < heute. */
export function terminUeberschritten(m: Pick<Mangel, 'status' | 'termin'>, heute: IsoDate): boolean {
  return istMangelOffen(m) && m.termin < heute;
}
