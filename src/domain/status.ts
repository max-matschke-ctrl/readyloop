// Vertrag §3.4 – Implementierung folgt in BE-2.
import type { FristStatus, GeraetPruefart, IsoDate, StatusErgebnis } from './types';

const NI = 'nicht implementiert (BE-2)';

export const VORLAUF_TAGE = 30;

export function berechneStatus(
  pruefart: Pick<GeraetPruefart, 'frist' | 'letztePruefung'>,
  heute: IsoDate,
  vorlaufTage: number = VORLAUF_TAGE,
): StatusErgebnis {
  void pruefart;
  void heute;
  void vorlaufTage;
  throw new Error(NI);
}

export function gesamtStatus(status: readonly FristStatus[]): FristStatus {
  void status;
  throw new Error(NI);
}

export function naechsteFaelligkeit(ergebnisse: readonly StatusErgebnis[]): IsoDate | null {
  void ergebnisse;
  throw new Error(NI);
}

export function prueferGruppe(status: FristStatus): 'faellig' | 'spaeter' {
  void status;
  throw new Error(NI);
}
