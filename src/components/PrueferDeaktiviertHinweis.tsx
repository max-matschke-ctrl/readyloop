/**
 * Review I2 (Befund 2): Zugewiesener Prüfer ist deaktiviert. Die Zuweisung bleibt bestehen,
 * die Prüfart gilt aber als nicht versorgt. Status über Text und Symbol, nicht nur über Farbe.
 * Warnstreifen nach §6.11 (brick-50, Linie links), als span nutzbar in dd und Formularen.
 */
export function PrueferDeaktiviertHinweis({ name, className = '' }: { name: string | null; className?: string }) {
  return (
    <span role="note" className={`flex items-start gap-2 rounded-flaeche border-l-4 border-brick bg-brick-50 px-2.5 py-1.5 text-sm text-ink ${className}`}>
      <span
        aria-hidden="true"
        className="mt-px inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full bg-brick text-[0.6875rem] font-bold leading-none text-white"
      >
        !
      </span>
      <span>
        <strong className="font-semibold">Prüfer deaktiviert – neu zuweisen</strong>
        {name && <span className="block text-steel">{name} hat keine aktive Prüfer-Mitgliedschaft mehr.</span>}
      </span>
    </span>
  );
}
