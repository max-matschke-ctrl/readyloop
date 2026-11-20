import { ANLASS_ART_LABEL, type AnlassAnsicht } from '@/domain/types';
import { AnlassAufhebenForm } from './AnlassForm';
import { Leerzustand } from './Leerzustand';
import { datum, zeitpunkt } from './format';

/** Offene Anlässe zuerst, dann erledigte/aufgehobene. Kein Löschen. */
export function AnlassListe({ anlaesse, darfAufheben }: { anlaesse: AnlassAnsicht[]; darfAufheben: boolean }) {
  if (anlaesse.length === 0) return <Leerzustand art="leer" ebene="h3" titel="Keine Anlässe erfasst." />;
  const sortiert = [...anlaesse.filter((a) => a.offen), ...anlaesse.filter((a) => !a.offen)];
  return (
    <ul className="karte divide-y divide-steel-200">
      {sortiert.map((a) => (
        <li key={a.id} className="space-y-1 px-4 py-3 text-sm">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {a.offen ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-brick bg-brick-50 px-2 py-0.5 text-xs font-semibold text-ink">
                <span
                  aria-hidden="true"
                  className="inline-flex size-[1.125rem] items-center justify-center rounded-full bg-brick text-[0.6875rem] font-bold leading-none text-white"
                >
                  !
                </span>
                Offen – vor Nutzung prüfen
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-steel-200 bg-steel-50 px-2 py-0.5 text-xs text-ink">
                <span aria-hidden="true">✓</span>
                {a.aufgehobenAm ? 'Aufgehoben' : 'Erledigt'}
              </span>
            )}
            <span className="font-medium">{ANLASS_ART_LABEL[a.art]}</span>
            <span className="text-steel">· {a.pruefartBezeichnung}</span>
            <span className="font-mono text-xs text-steel">· {datum(a.datum)}</span>
          </p>
          <p>{a.beschreibung}</p>
          <p className="text-xs text-steel">
            erfasst von {a.erfasstVonName} am {zeitpunkt(a.erfasstAm)}
            {a.aufgehobenAm && (
              <>
                {' '}
                · aufgehoben von {a.aufgehobenVonName ?? 'unbekannt'} am {zeitpunkt(a.aufgehobenAm)}: {a.aufhebungsgrund}
              </>
            )}
            {!a.offen && !a.aufgehobenAm && a.erledigtDurchNachweisId && ' · erledigt durch bestandenen Nachweis'}
          </p>
          {a.offen && darfAufheben && <AnlassAufhebenForm anlassId={a.id} />}
        </li>
      ))}
    </ul>
  );
}
