// Vertrag §7.4 – Nutzbarkeit (F-21), Übernahme-Hinweis (F-23), Token-Format (F-24), Übernahme-Verlauf (F-27).
// Rein und deterministisch, ohne Framework-Abhängigkeit.
import {
  UEBERNAHME_AUFBEWAHRUNG_TAGE,
  type Betriebsstatus,
  type FristStatus,
  type Geraet,
  type Nutzung,
  type Uebernahme,
  type UebernahmeHinweis,
} from './types';

/** F-21. Reihenfolge: Betriebsstatus ≠ in_betrieb → nicht_verwenden; ueberfaellig/vor_nutzung_pruefen → nicht_verwenden;
 *  unbekannt/gbu → unklar; bald_faellig/ok → verwendbar. */
export function nutzungAus(gesamtStatus: FristStatus, betriebsstatus: Betriebsstatus): Nutzung {
  if (betriebsstatus !== 'in_betrieb') return 'nicht_verwenden';
  switch (gesamtStatus) {
    case 'ueberfaellig':
    case 'vor_nutzung_pruefen':
      return 'nicht_verwenden';
    case 'unbekannt':
    case 'gbu':
      return 'unklar';
    case 'bald_faellig':
    case 'ok':
      return 'verwendbar';
  }
}

/** F-23. null = Übernahme möglich. Reihenfolge wie UEBERNAHME_HINWEISE. 'unklar' blockiert nicht (Q-30). */
export function uebernahmeHinweis(
  geraet: Pick<Geraet, 'kategorie' | 'betriebsstatus'>,
  nutzung: Nutzung,
): UebernahmeHinweis | null {
  if (geraet.kategorie !== 'wechselnd') return 'nicht_wechselnd';
  if (geraet.betriebsstatus !== 'in_betrieb') return 'ausser_betrieb';
  if (nutzung === 'nicht_verwenden') return 'nicht_verwenden';
  return null;
}

/** F-24: 16 Zufallsbytes, base64url ohne Auffüllung = 22 Zeichen. Gespiegelt im Check von geraet_token.token. */
export const TOKEN_MUSTER = /^[A-Za-z0-9_-]{22}$/;

export function istTokenFormat(wert: string): boolean {
  return typeof wert === 'string' && TOKEN_MUSTER.test(wert);
}

const TAG_MS = 24 * 60 * 60 * 1000;

/** F-27: abgeschlossen, Person vorhanden und bis ≥ jetzt − tage. */
export function imUebernahmeVerlauf(
  u: Pick<Uebernahme, 'bis' | 'benutzerId'>,
  jetzt: Date,
  tage: number = UEBERNAHME_AUFBEWAHRUNG_TAGE,
): boolean {
  if (u.bis === null || u.benutzerId === null) return false;
  return new Date(u.bis).getTime() >= jetzt.getTime() - tage * TAG_MS;
}
