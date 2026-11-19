import Link from 'next/link';
import type { MangelAnsicht } from '@/domain/types';
import { MangelSchwereBadge, MangelStatusBadge } from './MangelStatusBadge';
import { datum } from './format';

/** Mängelliste. Keine Auswertung je Person (R-45): kein Erfasser, keine Personen-Summen. */
export function MaengelTabelle({ maengel, mitGeraet = true }: { maengel: MangelAnsicht[]; mitGeraet?: boolean }) {
  return (
    <div className="karte overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Mängel, sortiert nach Schwere und Termin</caption>
        <thead className="bg-steel-hell/60 text-left text-xs text-steel">
          <tr>
            {mitGeraet && <th scope="col" className="px-3 py-2">Gerät</th>}
            {mitGeraet && <th scope="col" className="hidden px-3 py-2 md:table-cell">Bereich</th>}
            <th scope="col" className="hidden px-3 py-2 lg:table-cell">Prüfart</th>
            <th scope="col" className="px-3 py-2">Beschreibung</th>
            <th scope="col" className="px-3 py-2">Schwere</th>
            <th scope="col" className="hidden px-3 py-2 sm:table-cell">Verantwortlich</th>
            <th scope="col" className="px-3 py-2">Termin</th>
            <th scope="col" className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {maengel.map((m) => (
            <tr key={m.id} className="border-t border-steel/15 align-top hover:bg-paper">
              {mitGeraet && (
                <td className="px-3 py-2">
                  <Link href={`/geraete/${m.geraetId}`} className="font-medium hover:underline">
                    {m.geraetBezeichnung}
                  </Link>
                  <span className="block font-mono text-xs text-steel">{m.inventarnummer ?? 'ohne Inventarnummer'}</span>
                </td>
              )}
              {mitGeraet && <td className="hidden px-3 py-2 md:table-cell">{m.bereichName}</td>}
              <td className="hidden px-3 py-2 lg:table-cell">{m.pruefartBezeichnung ?? <span className="text-steel">Gerät allgemein</span>}</td>
              <td className="px-3 py-2">
                <Link href={`/maengel/${m.id}`} className="link">
                  {m.beschreibung.length > 80 ? `${m.beschreibung.slice(0, 80)} …` : m.beschreibung}
                </Link>
              </td>
              <td className="px-3 py-2">
                <MangelSchwereBadge schwere={m.schwere} />
              </td>
              <td className="hidden px-3 py-2 sm:table-cell">{m.verantwortlichName ?? <span className="text-steel">offen</span>}</td>
              <td className={`px-3 py-2 font-mono ${m.terminUeberschritten ? 'font-semibold text-brick' : ''}`}>
                {datum(m.termin)}
                {m.terminUeberschritten && (
                  <span className="block font-sans text-xs">
                    <span aria-hidden="true">✕ </span>Termin überschritten
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <MangelStatusBadge status={m.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
