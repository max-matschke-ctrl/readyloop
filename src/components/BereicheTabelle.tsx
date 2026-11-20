import { ChevronDown } from 'lucide-react';
import { EINSATZORT_LABEL, type BereichAnsicht } from '@/domain/types';
import { BereichForm } from './BereichForm';
import { Leerzustand } from './Leerzustand';


/** Bereiche (§6.7 ohne Plakettenspalte, §8.10) mit Inline-Bearbeiten als Disclosure (ohne JS bedienbar). Kein Löschen (F-17). */
export function BereicheTabelle({ bereiche }: { bereiche: BereichAnsicht[] }) {
  if (bereiche.length === 0)
    return <Leerzustand art="leer" titel="Noch keine Bereiche angelegt." text="Legen Sie unten den ersten Bereich an. Geräte gehören immer zu einem Bereich." />;
  return (
    <div className="karte overflow-x-clip">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Bereiche der Organisation</caption>
        <thead className="text-left">
          <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:whitespace-nowrap [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
            <th scope="col">Name</th>
            <th scope="col" className="hidden sm:table-cell">
              Einsatzort
            </th>
            <th scope="col" className="text-right">
              Geräte
            </th>
            <th scope="col" className="hidden md:table-cell">
              Verantwortliche
            </th>
          </tr>
        </thead>
        {bereiche.map(({ bereich, geraeteAnzahl, verantwortliche }, i) => (
          <tbody key={bereich.id} className={i > 0 ? '[&>tr:first-child>*]:border-t [&>tr:first-child>*]:border-steel-200' : ''}>
            <tr className="align-top [&>*]:px-3 [&>*]:pt-3">
              <th scope="row" className="text-left font-semibold">
                {bereich.name}
                <span className="block text-xs font-normal text-steel sm:hidden">{EINSATZORT_LABEL[bereich.einsatzort]}</span>
              </th>
              <td className="hidden sm:table-cell">{EINSATZORT_LABEL[bereich.einsatzort]}</td>
              <td className="text-right font-mono tabular-nums">{geraeteAnzahl}</td>
              <td className="hidden md:table-cell">
                {verantwortliche.length > 0 ? verantwortliche.map((v) => v.name).join(', ') : <span className="text-steel">keine</span>}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="px-3 pb-2 pt-0.5">
                <details className="group/b">
                  <summary className="btn btn-still min-h-8 w-fit cursor-pointer list-none gap-1 px-0 [&::-webkit-details-marker]:hidden">
                    Bereich bearbeiten<span className="sr-only">: {bereich.name}</span>
                    <ChevronDown
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.75}
                      className="transition-transform duration-[var(--dauer-mittel)] group-open/b:rotate-180"
                    />
                  </summary>
                  <div className="mt-2 rounded-flaeche border border-steel-200 bg-white p-4">
                    <BereichForm bereich={bereich} />
                  </div>
                </details>
              </td>
            </tr>
          </tbody>
        ))}
      </table>
    </div>
  );
}
