// Vertrag §3.4 – Implementierung folgt in BE-2.
import type { IsoDate } from './types';

const NI = 'nicht implementiert (BE-2)';

export function istIsoDate(wert: string): boolean {
  void wert;
  throw new Error(NI);
}

/** Monatsende-Klemme. */
export function addMonate(datum: IsoDate, monate: number): IsoDate {
  void datum;
  void monate;
  throw new Error(NI);
}

/** bis − von in Kalendertagen. */
export function tageZwischen(von: IsoDate, bis: IsoDate): number {
  void von;
  void bis;
  throw new Error(NI);
}

export function heuteBerlin(jetzt?: Date): IsoDate {
  void jetzt;
  throw new Error(NI);
}

/** 'TT.MM.JJJJ' */
export function formatDatum(datum: IsoDate): string {
  void datum;
  throw new Error(NI);
}
