// Kopfzeilen der öffentlichen QR-Seite (F-24). Ohne Node-Abhängigkeit (läuft in der Middleware).

/** Nicht zwischenspeichern, keinen Referrer weitergeben, nicht indexieren. */
export const QR_KOPFZEILEN = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

export function istQrPfad(pfad: string): boolean {
  return pfad === '/g' || pfad.startsWith('/g/');
}

/** Setzt die QR-Kopfzeilen auf eine Antwort, wenn der Pfad /g/* ist. */
export function setzeQrKopfzeilen(pfad: string, kopf: Headers): void {
  if (!istQrPfad(pfad)) return;
  for (const [name, wert] of Object.entries(QR_KOPFZEILEN)) kopf.set(name, wert);
}
