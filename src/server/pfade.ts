// Sichere Rücksprungziele (BE-11): nur relative Pfade innerhalb der App, kein Protokoll, kein '//'.
const RELATIV = /^\/[a-z0-9/\-?=&]*$/i;

export function istSichererPfad(wert: unknown): wert is string {
  return typeof wert === 'string' && RELATIV.test(wert) && !wert.includes('//');
}

export function sichererRuecksprung(wert: unknown, standard: string): string {
  return istSichererPfad(wert) ? wert : standard;
}
