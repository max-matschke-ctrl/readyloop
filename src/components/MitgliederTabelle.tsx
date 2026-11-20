import Link from 'next/link';
import { PRUEFER_TYP_LABEL, ROLLE_LABEL, type MitgliedAnsicht } from '@/domain/types';
import { Leerzustand } from './Leerzustand';

const ZEILENLINK =
  'font-semibold text-ink after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-steel focus-visible:after:outline';

/** Zugang als neutrale Marke (§8.10): aktiv ✓, deaktiviert ○. Text immer sichtbar. */
export function ZugangMarke({ aktiv }: { aktiv: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-steel-200 bg-steel-50 px-2 py-0.5 text-xs font-medium text-ink">
      <span aria-hidden="true">{aktiv ? '✓' : '○'}</span>
      {aktiv ? 'aktiv' : 'deaktiviert'}
    </span>
  );
}

function Zuordnung({ m }: { m: MitgliedAnsicht }) {
  if (m.rolle === 'verantwortlicher') return m.bereichNamen.length ? <>{m.bereichNamen.join(', ')}</> : <span className="text-steel">kein Bereich</span>;
  if (m.rolle === 'pruefer')
    return m.prueferTypen.length > 0 ? <>{m.prueferTypen.map((t) => PRUEFER_TYP_LABEL[t]).join(', ')}</> : <span className="text-steel">keine Qualifikation hinterlegt</span>;
  return <span className="text-steel">alle Bereiche</span>;
}

/** Mitglieder (§6.7 ohne Plakettenspalte, §8.10): ganze Zeile öffnet das Mitglied, unter 640 px als Liste. */
export function MitgliederTabelle({ mitglieder }: { mitglieder: MitgliedAnsicht[] }) {
  if (mitglieder.length === 0) return <Leerzustand art="leer" titel="Noch keine Mitglieder." text="Laden Sie die erste Person ein." />;
  return (
    <>
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Mitglieder der Organisation, aktive zuerst</caption>
          <thead className="text-left">
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:whitespace-nowrap [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Name</th>
              <th scope="col" className="hidden md:table-cell">
                E-Mail
              </th>
              <th scope="col">Rolle</th>
              <th scope="col" className="hidden lg:table-cell">
                Bereiche oder Qualifikation
              </th>
              <th scope="col">Zugang</th>
            </tr>
          </thead>
          <tbody>
            {mitglieder.map((m) => (
              <tr
                key={m.mitgliedschaftId}
                className="relative align-middle hover:bg-steel-50 [&:not(:last-child)>*]:border-b [&>*]:border-steel-200 [&>*]:h-12 [&>*]:px-3 [&>*]:py-2"
              >
                <th scope="row" className="text-left font-normal">
                  <Link href={`/admin/mitglieder/${m.mitgliedschaftId}`} className={ZEILENLINK}>
                    {m.benutzer.name}
                  </Link>
                  {m.istEigeneMitgliedschaft && <span className="text-steel"> (Sie)</span>}
                  <span className="block font-mono text-xs text-steel md:hidden">{m.benutzer.email}</span>
                </th>
                <td className="hidden font-mono text-sm md:table-cell">{m.benutzer.email}</td>
                <td>{ROLLE_LABEL[m.rolle]}</td>
                <td className="hidden lg:table-cell">
                  <Zuordnung m={m} />
                </td>
                <td>
                  <ZugangMarke aktiv={m.aktiv} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label="Mitglieder der Organisation, aktive zuerst" className="karte divide-y divide-steel-200 sm:hidden">
        {mitglieder.map((m) => (
          <li key={m.mitgliedschaftId} className="relative space-y-1 px-3 py-3 text-sm hover:bg-steel-50">
            <Link href={`/admin/mitglieder/${m.mitgliedschaftId}`} className={`block ${ZEILENLINK}`}>
              {m.benutzer.name}
              {m.istEigeneMitgliedschaft && <span className="font-normal text-steel"> (Sie)</span>}
            </Link>
            <p className="font-mono text-xs text-steel [overflow-wrap:anywhere]">{m.benutzer.email}</p>
            <p className="flex flex-wrap items-center gap-2">
              {ROLLE_LABEL[m.rolle]}
              <ZugangMarke aktiv={m.aktiv} />
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
