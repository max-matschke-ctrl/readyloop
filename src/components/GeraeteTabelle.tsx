import Link from 'next/link';
import type { GeraetListenEintrag } from '@/domain/types';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { datum } from './format';

export function GeraeteTabelle({ eintraege }: { eintraege: GeraetListenEintrag[] }) {
  return (
    <div className="karte overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Geräte mit Prüfstatus, sortiert nach Dringlichkeit</caption>
        <thead className="bg-steel-hell/60 text-left text-xs text-steel">
          <tr>
            <th scope="col" className="w-14 px-3 py-2">
              <span className="sr-only">Prüfplakette</span>
            </th>
            <th scope="col" className="px-3 py-2">Gerät</th>
            <th scope="col" className="hidden px-3 py-2 md:table-cell">Bereich</th>
            <th scope="col" className="px-3 py-2">Status</th>
            <th scope="col" className="px-3 py-2">Nächste Prüfung</th>
            <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">Prüfarten</th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((e) => (
            <tr key={e.geraet.id} className="border-t border-steel/15 align-middle hover:bg-paper">
              <td className="px-3 py-2">
                <Pruefplakette status={e.gesamtStatus} faelligAm={e.naechsteFaelligkeit} groesse={40} />
              </td>
              <td className="px-3 py-2">
                <Link href={`/geraete/${e.geraet.id}`} className="font-medium text-ink hover:underline">
                  {e.geraet.bezeichnung}
                </Link>
                <span className="block font-mono text-xs text-steel">
                  {e.geraet.inventarnummer ?? 'ohne Inventarnummer'}
                  <span className="md:hidden"> · {e.bereichName}</span>
                </span>
              </td>
              <td className="hidden px-3 py-2 md:table-cell">{e.bereichName}</td>
              <td className="px-3 py-2">
                <StatusAmpel status={e.gesamtStatus} kurz />
              </td>
              <td className="px-3 py-2 font-mono">{datum(e.naechsteFaelligkeit)}</td>
              <td
                className="hidden px-3 py-2 text-right font-mono sm:table-cell"
                title={e.pruefarten.map((p) => p.bezeichnung).join(', ')}
              >
                {e.pruefarten.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
