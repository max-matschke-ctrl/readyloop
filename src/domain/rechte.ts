// Vertrag Inkrement 1 – siehe docs/backlog.md §3.3
import type { Aktion, Id, Rolle, Sitzung } from './types';

export const RECHTE: Record<Aktion, readonly Rolle[]> = {
  'geraet.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'geraet.anlegen': ['admin', 'verantwortlicher'],
  'frist.freigeben': ['sifa', 'verantwortlicher'],
  'nachweis.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'nachweis.erfassen': ['verantwortlicher', 'pruefer'],
  'pruefaufgaben.lesen': ['pruefer'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
};

export function can(rolle: Rolle, aktion: Aktion): boolean {
  return RECHTE[aktion].includes(rolle);
}

/** Geltungsbereich: admin/sifa alles; verantwortlicher eigene Bereiche; pruefer nur zugewiesen; mitarbeiter nichts (I1). */
export function imGeltungsbereich(
  sitzung: Pick<Sitzung, 'rolle' | 'bereichIds' | 'benutzer'>,
  ziel: { bereichId: Id; zugewiesenePrueferIds: readonly Id[] },
): boolean {
  switch (sitzung.rolle) {
    case 'admin':
    case 'sifa':
      return true;
    case 'verantwortlicher':
      return sitzung.bereichIds.includes(ziel.bereichId);
    case 'pruefer':
      return ziel.zugewiesenePrueferIds.includes(sitzung.benutzer.id);
    case 'mitarbeiter':
      return false;
  }
}
