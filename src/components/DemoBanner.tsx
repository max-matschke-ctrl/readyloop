/**
 * Hinweise oben auf jeder Seite (§6.1): Demo-Modus (falls aktiv) und Katalogstatus
 * (immer, solange der Katalog Entwurf ist). Fläche ochre-50, Linie ochre-600, Text ink.
 */
export function DemoBanner({ demo }: { demo: boolean }) {
  return (
    <div role="note" aria-label="Hinweise" className="border-b border-ochre-600 bg-ochre-50 text-xs text-ink">
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-1.5 md:px-6 xl:px-8">
        <span
          aria-hidden="true"
          className="mt-px inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full bg-ochre text-[0.6875rem] font-bold leading-none text-ink"
        >
          !
        </span>
        <span>
          {demo && <strong className="font-semibold">Demo – keine echten Daten. </strong>}
          Prüfkatalog im Entwurf – Fristen sind Vorschläge und ersetzen nicht die Gefährdungsbeurteilung.
        </span>
      </p>
    </div>
  );
}
