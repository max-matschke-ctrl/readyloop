import type { MitgliedAnsicht } from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { ZugangMarke } from './MitgliederTabelle';

/** Mitarbeiter (§6.7 ohne Plakettenspalte): Name, E-Mail, Zugang; ohne Aktionen. Unter 640 px als Liste. */
export function MitarbeiterTabelle({ mitarbeiter }: { mitarbeiter: MitgliedAnsicht[] }) {
  if (mitarbeiter.length === 0) {
    return <Leerzustand art="leer" ebene="h3" titel="Noch keine Mitarbeiter eingeladen." text="Laden Sie die erste Person mit dem Formular oben ein." />;
  }
  return (
    <>
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Mitarbeiter, aktive zuerst</caption>
          <thead className="text-left">
            <tr className="[&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Name</th>
              <th scope="col">E-Mail</th>
              <th scope="col">Zugang</th>
            </tr>
          </thead>
          <tbody>
            {mitarbeiter.map((m) => (
              <tr key={m.mitgliedschaftId} className="align-middle [&:not(:last-child)>*]:border-b [&>*]:h-12 [&>*]:border-steel-200 [&>*]:px-3 [&>*]:py-2">
                <th scope="row" className="text-left font-semibold">
                  {m.benutzer.name}
                </th>
                <td className="font-mono [overflow-wrap:anywhere]">{m.benutzer.email}</td>
                <td>
                  <ZugangMarke aktiv={m.aktiv} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label="Mitarbeiter, aktive zuerst" className="karte divide-y divide-steel-200 sm:hidden">
        {mitarbeiter.map((m) => (
          <li key={m.mitgliedschaftId} className="space-y-1 px-3 py-3 text-sm">
            <p className="font-semibold">{m.benutzer.name}</p>
            <p className="font-mono text-xs text-steel [overflow-wrap:anywhere]">{m.benutzer.email}</p>
            <ZugangMarke aktiv={m.aktiv} />
          </li>
        ))}
      </ul>
    </>
  );
}
