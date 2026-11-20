import type { IsoDate } from '@/domain/types';

export const MONATSNAME = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

export const MONATSKURZ = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'] as const;

export interface MonatEintrag {
  jahr: number;
  monat: number; // 1–12
  anzahl: number;
}

export interface Fenster {
  /** Genau 12 Kalendermonate, beginnend mit dem aktuellen Monat (Designsystem §10 E-3). */
  monate: MonatEintrag[];
  summe: number;
  /** Fälligkeiten vor heute (überfällig); liegen außerhalb des Fensters und werden getrennt ausgewiesen. */
  ueberfaellig: number;
  /** Erster und letzter gezählter Tag (einschließlich). */
  von: IsoDate;
  bis: IsoDate;
}

/**
 * Jahresring-Fenster (E-3): von heute bis zum Ende des 11. Folgemonats. Reiner String-Vergleich
 * auf ISO-Daten, kein Date-Objekt (keine Zeitzonenfehler, nichts im Browser berechnet).
 */
export function jahresringFenster(faelligkeiten: readonly (IsoDate | null)[], heute: IsoDate): Fenster {
  const [jHeute, mHeute] = heute.split('-');
  const jahr0 = Number(jHeute);
  const monat0 = Number(mHeute);

  const monate: MonatEintrag[] = Array.from({ length: 12 }, (_, i) => {
    const index = monat0 - 1 + i;
    return { jahr: jahr0 + Math.floor(index / 12), monat: (index % 12) + 1, anzahl: 0 };
  });
  const letzter = monate[11]!;
  // Tag 31 als Obergrenze: Jeder Tag des letzten Monats ist als ISO-String <= „JJJJ-MM-31“.
  const bis = `${String(letzter.jahr).padStart(4, '0')}-${String(letzter.monat).padStart(2, '0')}-31`;

  let ueberfaellig = 0;
  for (const f of faelligkeiten) {
    if (!f) continue;
    if (f < heute) {
      ueberfaellig += 1;
      continue;
    }
    if (f > bis) continue;
    const [j, m] = f.split('-');
    const eintrag = monate.find((e) => e.jahr === Number(j) && e.monat === Number(m));
    if (eintrag) eintrag.anzahl += 1;
  }
  return { monate, summe: monate.reduce((s, e) => s + e.anzahl, 0), ueberfaellig, von: heute, bis };
}
