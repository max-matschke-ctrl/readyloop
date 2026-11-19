// Vertrag §3.4/§5.7 – Statusampel (F-5, F-6; Rangfolge F-9 über FRIST_STATUS).
import { addMonate, tageZwischen } from './datum';
import { FRIST_STATUS } from './types';
import type { FristStatus, GeraetPruefart, IsoDate, StatusErgebnis } from './types';

export const VORLAUF_TAGE = 30;

/** F-5: ohne Frist → gbu; ohne Prüfdatum → unbekannt; sonst nach Resttagen bis faelligAm. */
export function berechneStatus(
  pruefart: Pick<GeraetPruefart, 'frist' | 'letztePruefung'>,
  heute: IsoDate,
  vorlaufTage: number = VORLAUF_TAGE,
): StatusErgebnis {
  if (pruefart.frist === null) return { status: 'gbu', faelligAm: null, restTage: null };
  if (pruefart.letztePruefung === null) return { status: 'unbekannt', faelligAm: null, restTage: null };
  const faelligAm = addMonate(pruefart.letztePruefung, pruefart.frist.monate);
  const restTage = tageZwischen(heute, faelligAm);
  const status: FristStatus = restTage < 0 ? 'ueberfaellig' : restTage <= vorlaufTage ? 'bald_faellig' : 'ok';
  return { status, faelligAm, restTage };
}

/** F-6/F-9: schlechtester Status nach FRIST_STATUS (ueberfaellig > vor_nutzung_pruefen > …); leere Liste → gbu. */
export function gesamtStatus(status: readonly FristStatus[]): FristStatus {
  if (status.length === 0) return 'gbu';
  return status.reduce((schlechtester, s) =>
    FRIST_STATUS.indexOf(s) < FRIST_STATUS.indexOf(schlechtester) ? s : schlechtester,
  );
}

/** Frühestes faelligAm oder null. */
export function naechsteFaelligkeit(ergebnisse: readonly StatusErgebnis[]): IsoDate | null {
  let frueheste: IsoDate | null = null;
  for (const e of ergebnisse) {
    if (e.faelligAm !== null && (frueheste === null || e.faelligAm < frueheste)) frueheste = e.faelligAm;
  }
  return frueheste;
}

/** 'ok' → 'spaeter', alles andere (inkl. vor_nutzung_pruefen) → 'faellig'. */
export function prueferGruppe(status: FristStatus): 'faellig' | 'spaeter' {
  return status === 'ok' ? 'spaeter' : 'faellig';
}

/** Index nach Schwere (0 = schlechtester) für Sortierungen. */
export function statusRang(status: FristStatus): number {
  return FRIST_STATUS.indexOf(status);
}
