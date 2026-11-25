import type { BereichsRegel } from '@/domain/types';
import { eskalationText, jaNein, staffelText } from './erinnerung-format';

function Stand({ standard }: { standard: boolean }) {
  return <>{standard ? 'Standard' : 'angepasst'}</>;
}

/**
 * Regeln der Bereiche, nur lesend (§8.20): gleiche Zellformate wie die Übersicht §8.18, ohne Links und
 * ohne Warnungen. Ab 640 px Tabelle, darunter Liste.
 */
export function BereichsRegelnListe({ regeln }: { regeln: BereichsRegel[] }) {
  return (
    <>
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Erinnerungsregeln in Ihren Bereichen</caption>
          <thead className="text-left">
            <tr className="[&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Bereich</th>
              <th scope="col">Vorlauf</th>
              <th scope="col">Eskalation (Tage nach Fälligkeit)</th>
              <th scope="col" className="whitespace-nowrap">
                Sifa in Kopie
              </th>
              <th scope="col">Stand</th>
            </tr>
          </thead>
          <tbody>
            {regeln.map((r) => (
              <tr key={r.bereichName} className="align-top [&:not(:last-child)>*]:border-b [&>*]:border-steel-200 [&>*]:px-3 [&>*]:py-3">
                <th scope="row" className="text-left font-semibold">
                  {r.bereichName}
                </th>
                <td className="whitespace-nowrap tabular-nums">{staffelText(r.staffelTage)}</td>
                <td className="tabular-nums">{eskalationText(r.eskalationTage)}</td>
                <td>{jaNein(r.sifaInKopie)}</td>
                <td className="text-steel">
                  <Stand standard={r.standard} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label="Erinnerungsregeln in Ihren Bereichen" className="karte divide-y divide-steel-200 sm:hidden">
        {regeln.map((r) => (
          <li key={r.bereichName} className="px-3 py-3">
            <h3 className="text-[1.0625rem] font-semibold leading-6 [overflow-wrap:anywhere]">{r.bereichName}</h3>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              <dt className="text-steel">Vorlauf</dt>
              <dd className="tabular-nums">{staffelText(r.staffelTage)}</dd>
              <dt className="text-steel">Eskalation</dt>
              <dd className="tabular-nums">
                {eskalationText(r.eskalationTage)}
                <span className="block text-xs text-steel">Tage nach Fälligkeit</span>
              </dd>
              <dt className="text-steel">Sifa in Kopie</dt>
              <dd>{jaNein(r.sifaInKopie)}</dd>
            </dl>
            <p className="mt-1 text-sm text-steel">
              <Stand standard={r.standard} />
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
