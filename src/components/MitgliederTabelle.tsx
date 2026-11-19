import Link from 'next/link';
import { PRUEFER_TYP_LABEL, ROLLE_LABEL, type MitgliedAnsicht } from '@/domain/types';

export function MitgliederTabelle({ mitglieder }: { mitglieder: MitgliedAnsicht[] }) {
  if (mitglieder.length === 0) return <p className="karte px-4 py-6 text-sm">Noch keine Mitglieder.</p>;
  return (
    <div className="karte overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Mitglieder der Organisation, aktive zuerst</caption>
        <thead className="bg-steel-hell/60 text-left text-xs text-steel">
          <tr>
            <th scope="col" className="px-3 py-2">Name</th>
            <th scope="col" className="hidden px-3 py-2 md:table-cell">E-Mail</th>
            <th scope="col" className="px-3 py-2">Rolle</th>
            <th scope="col" className="hidden px-3 py-2 lg:table-cell">Bereiche / Qualifikation</th>
            <th scope="col" className="px-3 py-2">Zugang</th>
          </tr>
        </thead>
        <tbody>
          {mitglieder.map((m) => (
            <tr key={m.mitgliedschaftId} className={`border-t border-steel/15 align-top ${m.aktiv ? '' : 'text-steel'}`}>
              <th scope="row" className="px-3 py-2 text-left font-medium">
                <Link href={`/admin/mitglieder/${m.mitgliedschaftId}`} className="hover:underline">
                  {m.benutzer.name}
                </Link>
                {m.istEigeneMitgliedschaft && <span className="ml-1 text-xs font-normal text-steel">(Sie)</span>}
                <span className="block font-mono text-xs font-normal text-steel md:hidden">{m.benutzer.email}</span>
              </th>
              <td className="hidden px-3 py-2 font-mono text-xs md:table-cell">{m.benutzer.email}</td>
              <td className="px-3 py-2">{ROLLE_LABEL[m.rolle]}</td>
              <td className="hidden px-3 py-2 lg:table-cell">
                {m.rolle === 'verantwortlicher' && (m.bereichNamen.join(', ') || <span className="text-steel">–</span>)}
                {m.rolle === 'pruefer' &&
                  (m.prueferTypen.length > 0 ? (
                    m.prueferTypen.map((t) => PRUEFER_TYP_LABEL[t]).join(', ')
                  ) : (
                    <span className="text-steel">keine Qualifikation hinterlegt</span>
                  ))}
              </td>
              <td className="px-3 py-2">
                {m.aktiv ? (
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden="true" className="text-moss">
                      ●
                    </span>
                    aktiv
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded border border-steel/40 px-1.5 text-xs">
                    <span aria-hidden="true">○</span>
                    deaktiviert
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
