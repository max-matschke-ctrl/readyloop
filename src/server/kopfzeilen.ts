// Kopfzeilen der öffentlichen QR-Seite (F-24) und der Abmeldeseite (F-40, I3). Ohne Node-Abhängigkeit (läuft in der Middleware).

/**
 * Nicht zwischenspeichern, Referrer nur an die eigene Origin, nicht indexieren.
 * 'same-origin' statt 'no-referrer': Bei 'no-referrer' sendet Chrome bei Formular-POST ohne JS `Origin: null`,
 * Next lehnt die Server Action dann ab (500). Fremde Seiten erhalten die Token-URL weiterhin nicht.
 */
export const QR_KOPFZEILEN = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

export function istQrPfad(pfad: string): boolean {
  return pfad === '/g' || pfad.startsWith('/g/');
}

/** I3: öffentliche Abmeldeseite /abmelden?t= (Token in der URL wie bei /g/*). */
export function istAbmeldePfad(pfad: string): boolean {
  return pfad === '/abmelden' || pfad.startsWith('/abmelden/');
}

/** Setzt die QR-Kopfzeilen auf eine Antwort, wenn der Pfad /g/* oder /abmelden ist. */
export function setzeQrKopfzeilen(pfad: string, kopf: Headers): void {
  if (!istQrPfad(pfad) && !istAbmeldePfad(pfad)) return;
  for (const [name, wert] of Object.entries(QR_KOPFZEILEN)) kopf.set(name, wert);
}
