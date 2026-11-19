// Vertrag Inkrement 1 + 2 – siehe docs/backlog.md §3.3 und §5.3
import type { Aktion, Id, Rolle, Sitzung } from './types';

export const RECHTE: Record<Aktion, readonly Rolle[]> = {
  'geraet.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'geraet.anlegen': ['admin', 'verantwortlicher'],
  'geraet.bearbeiten': ['admin', 'verantwortlicher'],
  'frist.freigeben': ['sifa', 'verantwortlicher'],
  'nachweis.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'nachweis.erfassen': ['verantwortlicher', 'pruefer'],
  'pruefaufgaben.lesen': ['pruefer'],
  'pruefer.zuweisen': ['admin', 'verantwortlicher'],
  'anlass.erfassen': ['sifa', 'verantwortlicher'],
  'mangel.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'mangel.erfassen': ['sifa', 'verantwortlicher', 'pruefer'],
  'mangel.bearbeiten': ['admin', 'sifa', 'verantwortlicher'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
  'bereich.verwalten': ['admin'],
  'mitglied.verwalten': ['admin'],
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

/** F-16: admin immer (Ziel in eigener Organisation – prüft der Aufrufer); verantwortlicher nur, wenn Quelle und Ziel
 *  eigene Bereiche sind; sonst false. Prüft nicht can(…, 'geraet.bearbeiten') – das tut der Aufrufer zusätzlich. */
export function darfVerschieben(
  sitzung: Pick<Sitzung, 'rolle' | 'bereichIds'>,
  vonBereichId: Id,
  nachBereichId: Id,
): boolean {
  switch (sitzung.rolle) {
    case 'admin':
      return true;
    case 'verantwortlicher':
      return sitzung.bereichIds.includes(vonBereichId) && sitzung.bereichIds.includes(nachBereichId);
    default:
      return false;
  }
}
