import { EINSATZORT_LABEL, type BereichAnsicht } from '@/domain/types';
import { BereichForm } from './BereichForm';

/** Bereiche mit Inline-Bearbeiten (details/summary, ohne JS bedienbar). Kein Löschen (F-17). */
export function BereicheTabelle({ bereiche }: { bereiche: BereichAnsicht[] }) {
  if (bereiche.length === 0) return <p className="karte px-4 py-6 text-sm">Noch keine Bereiche angelegt.</p>;
  return (
    <div className="karte overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Bereiche der Organisation</caption>
        <thead className="bg-steel-hell/60 text-left text-xs text-steel">
          <tr>
            <th scope="col" className="px-3 py-2">Name</th>
            <th scope="col" className="px-3 py-2">Einsatzort</th>
            <th scope="col" className="px-3 py-2 text-right">Geräte</th>
            <th scope="col" className="px-3 py-2">Verantwortliche</th>
          </tr>
        </thead>
        {bereiche.map(({ bereich, geraeteAnzahl, verantwortliche }) => (
          <tbody key={bereich.id} className="border-t border-steel/15">
            <tr className="align-top">
              <th scope="row" className="px-3 pt-2 text-left font-medium">
                {bereich.name}
              </th>
              <td className="px-3 pt-2">{EINSATZORT_LABEL[bereich.einsatzort]}</td>
              <td className="px-3 pt-2 text-right font-mono">{geraeteAnzahl}</td>
              <td className="px-3 pt-2">
                {verantwortliche.length > 0 ? (
                  verantwortliche.map((v) => v.name).join(', ')
                ) : (
                  <span className="text-steel">keine</span>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="px-3 pb-2 pt-1">
                <details>
                  <summary className="link w-fit cursor-pointer text-xs">
                    Bearbeiten<span className="sr-only">: {bereich.name}</span>
                  </summary>
                  <div className="mt-2 rounded border border-steel/20 bg-paper/60 p-3">
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
