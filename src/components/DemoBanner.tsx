/** Hinweise oben auf jeder Seite: Demo-Modus (falls aktiv) und Katalogstatus (immer, solange der Katalog Entwurf ist). */
export function DemoBanner({ demo }: { demo: boolean }) {
  return (
    <div role="note" aria-label="Hinweise" className="text-xs">
      {demo && (
        <p className="bg-ink px-4 py-1 text-center font-medium text-paper">
          Demo – keine echten Daten
        </p>
      )}
      <p className="border-b border-ochre/50 bg-ochre/15 px-4 py-1.5 text-center text-ink">
        <span aria-hidden="true" className="mr-1 font-bold text-ochre-dunkel">
          !
        </span>
        Prüfkatalog im Entwurf – Fristen sind Vorschläge und ersetzen nicht die Gefährdungsbeurteilung.
      </p>
    </div>
  );
}
