// Vertrag Inkrement 1 + 2 + I3M – siehe docs/backlog.md §3.3, §5.3 und §7.3
import { EINLADBARE_ROLLEN, type Aktion, type Geraet, type Id, type Rolle, type Sitzung, type Uebernahme } from './types';

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
  'mangel.erfassen': ['sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'mangel.bearbeiten': ['admin', 'sifa', 'verantwortlicher'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
  'bereich.verwalten': ['admin'],
  'mitglied.verwalten': ['admin'],
  'meine_geraete.lesen': ['mitarbeiter'],
  'geraet.suchen': ['mitarbeiter'],
  'geraet.uebernehmen': ['mitarbeiter'],
  'geraet.zuordnen': ['admin', 'verantwortlicher'],
  'uebernahmen.lesen': ['admin'],
  'etikett.verwalten': ['admin', 'verantwortlicher'],
  'mitarbeiter.einladen': ['admin', 'verantwortlicher'],
};

export function can(rolle: Rolle, aktion: Aktion): boolean {
  return RECHTE[aktion].includes(rolle);
}

/** Geltungsbereich: admin/sifa alles; verantwortlicher eigene Bereiche; pruefer nur zugewiesen; mitarbeiter nichts (keine Geräteakte). */
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

/** F-20: admin darf jede EINLADBARE_ROLLE einladen; verantwortlicher nur 'mitarbeiter'; sonst false. */
export function darfEinladen(rolle: Rolle, zielRolle: Rolle): boolean {
  if (rolle === 'admin') return (EINLADBARE_ROLLEN as readonly Rolle[]).includes(zielRolle);
  if (rolle === 'verantwortlicher') return zielRolle === 'mitarbeiter';
  return false;
}

/** F-22/F-23: Gerät gehört zu „Meine Geräte“ (zugeordnet oder offene eigene Übernahme). */
export function istMeinGeraet(
  benutzerId: Id,
  geraet: Pick<Geraet, 'zugeordnetAn'>,
  offeneUebernahme: Pick<Uebernahme, 'benutzerId'> | null,
): boolean {
  return geraet.zugeordnetAn === benutzerId || (offeneUebernahme !== null && offeneUebernahme.benutzerId === benutzerId);
}
