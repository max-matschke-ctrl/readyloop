// Sichere Rücksprungziele (BE-11): nur relative Pfade innerhalb der App, kein Protokoll, kein '//'.
const RELATIV = /^\/[a-z0-9/\-?=&]*$/i;

export function istSichererPfad(wert: unknown): wert is string {
  return typeof wert === 'string' && RELATIV.test(wert) && !wert.includes('//');
}

export function sichererRuecksprung(wert: unknown, standard: string): string {
  return istSichererPfad(wert) ? wert : standard;
}

/** Review I2 (Befund 7): Bestätigungsseite für Einladungs-/Reset-Links (Seite: frontend-dev). */
export const BESTAETIGEN_SEITE = '/auth/bestaetigen';
/** Standardziel nach bestätigtem Einladungs-/Reset-Link. */
export const NACH_BESTAETIGUNG = '/passwort-neu';
