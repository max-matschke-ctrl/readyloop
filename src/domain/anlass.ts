// Vertrag §5.7 – Anlassprüfung (F-10). Rein und deterministisch.
import type { Anlass, Id, Nachweis } from './types';

export type AnlassFuerErledigung = Pick<Anlass, 'geraetPruefartId' | 'datum' | 'erfasstAm' | 'aufgehobenAm'>;
export type NachweisFuerErledigung = Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis' | 'erfasstAm'>;

/**
 * F-10: Ein bestandener Nachweis (ohne_maengel oder maengel_weiterbetrieb) derselben Prüfart erledigt den Anlass,
 * wenn pruefdatum > anlass.datum oder – am selben Tag – der Nachweis nach dem Anlass erfasst wurde
 * (nachweis.erfasstAm > anlass.erfasstAm). Ein am Anlasstag vorher erfasster Nachweis erledigt ihn nicht.
 * Gespiegelt in app.anlass_erledigt (Migration 20261127000000_review_i2.sql).
 */
export function nachweisErledigtAnlass(anlass: AnlassFuerErledigung, n: NachweisFuerErledigung): boolean {
  if (n.geraetPruefartId !== anlass.geraetPruefartId || n.ergebnis === 'nicht_bestanden') return false;
  if (n.pruefdatum > anlass.datum) return true;
  return n.pruefdatum === anlass.datum && n.erfasstAm > anlass.erfasstAm;
}

/**
 * F-10: Ein Anlass ist offen, solange er nicht aufgehoben ist und kein erledigender Nachweis vorliegt
 * (nachweisErledigtAnlass). nachweisId = frühester erledigender Nachweis (Prüfdatum, dann Erfassung, dann ID), sonst null.
 */
export function anlassErledigtDurch(
  anlass: AnlassFuerErledigung,
  nachweise: readonly NachweisFuerErledigung[],
): { offen: boolean; nachweisId: Id | null } {
  const erledigend = nachweise
    .filter((n) => nachweisErledigtAnlass(anlass, n))
    .sort(
      (a, b) => a.pruefdatum.localeCompare(b.pruefdatum) || a.erfasstAm.localeCompare(b.erfasstAm) || a.id.localeCompare(b.id),
    )[0];
  const nachweisId = erledigend?.id ?? null;
  if (anlass.aufgehobenAm !== null) return { offen: false, nachweisId };
  return { offen: nachweisId === null, nachweisId };
}
