// Vertrag §5.7 – Anlassprüfung (F-10). Rein und deterministisch.
import type { Anlass, Id, Nachweis } from './types';

/**
 * F-10: Ein Anlass ist offen, solange er nicht aufgehoben ist und zur selben Prüfart kein bestandener Nachweis
 * (ohne_maengel oder maengel_weiterbetrieb) mit pruefdatum ≥ anlass.datum vorliegt.
 * nachweisId = frühester erledigender Nachweis (bei Gleichstand kleinste ID), sonst null.
 */
export function anlassErledigtDurch(
  anlass: Pick<Anlass, 'geraetPruefartId' | 'datum' | 'aufgehobenAm'>,
  nachweise: readonly Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis'>[],
): { offen: boolean; nachweisId: Id | null } {
  const erledigend = nachweise
    .filter(
      (n) =>
        n.geraetPruefartId === anlass.geraetPruefartId &&
        n.ergebnis !== 'nicht_bestanden' &&
        n.pruefdatum >= anlass.datum,
    )
    .sort((a, b) => a.pruefdatum.localeCompare(b.pruefdatum) || a.id.localeCompare(b.id))[0];
  const nachweisId = erledigend?.id ?? null;
  if (anlass.aufgehobenAm !== null) return { offen: false, nachweisId };
  return { offen: nachweisId === null, nachweisId };
}
