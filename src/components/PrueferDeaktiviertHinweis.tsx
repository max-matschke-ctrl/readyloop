/**
 * Review I2 (Befund 2): Zugewiesener Prüfer ist deaktiviert. Die Zuweisung bleibt bestehen,
 * die Prüfart gilt aber als nicht versorgt. Status über Text und Symbol, nicht nur über Farbe.
 */
export function PrueferDeaktiviertHinweis({ name, className = '' }: { name: string | null; className?: string }) {
  return (
    <span role="note" className={`block rounded border border-brick/60 bg-brick/10 px-2 py-1 text-sm ${className}`}>
      <span aria-hidden="true" className="mr-1 font-bold text-brick">
        !
      </span>
      <strong className="font-semibold">Prüfer deaktiviert – neu zuweisen</strong>
      {name && <span className="text-steel"> ({name} hat keine aktive Prüfer-Mitgliedschaft mehr)</span>}
    </span>
  );
}
