import Link from 'next/link';
import type { GeraetListenEintrag } from '@/domain/types';
import { BetriebsstatusBadge } from './BetriebsstatusBadge';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { datum } from './format';

/** Gestreckter Zeilenlink: die ganze Zeile ist klickbar, Tab springt pro Zeile genau einmal, Fokus umrahmt die Zeile. */
const ZEILENLINK =
  'font-semibold text-ink after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-steel focus-visible:after:outline';

function Maengel({ anzahl }: { anzahl: number }) {
  if (anzahl === 0) return <span className="sr-only">keine offenen Mängel</span>;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-feld border border-brick bg-brick-50 px-1.5 tabular-nums text-ink"
      title={anzahl === 1 ? '1 offener Mangel' : `${anzahl} offene Mängel`}
    >
      <span aria-hidden="true">⚠</span>
      {anzahl}
      <span className="sr-only">{anzahl === 1 ? ' offener Mangel' : ' offene Mängel'}</span>
    </span>
  );
}

/**
 * Geräteliste (§6.7): ab 640 px Tabelle mit Sticky-Kopf, darunter Liste ohne horizontales Scrollen.
 * Erste Spalte Plakette, zweite Erkennung, Datum in Mono, Zahlen rechtsbündig.
 */
export function GeraeteTabelle({ eintraege }: { eintraege: GeraetListenEintrag[] }) {
  return (
    <>
      {/* Ab 640 px: Tabelle. overflow-x-clip statt auto, damit der Kopf am Fenster haftet. */}
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Geräte mit Prüfstatus, sortiert nach Dringlichkeit</caption>
          <thead className="text-left text-sm font-medium text-ink">
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col" className="w-16">
                <span className="sr-only">Prüfplakette</span>
              </th>
              <th scope="col">Gerät</th>
              <th scope="col" className="hidden md:table-cell">
                Bereich
              </th>
              <th scope="col">Status</th>
              <th scope="col">Nächste Prüfung</th>
              <th scope="col" className="text-right">
                Mängel
              </th>
              <th scope="col" className="text-right">
                Prüfarten
              </th>
            </tr>
          </thead>
          <tbody>
            {eintraege.map((e) => (
              <tr
                key={e.geraet.id}
                className="relative align-middle hover:bg-steel-50 [&:not(:last-child)>td]:border-b [&>td]:border-steel-200 [&>td]:px-3 [&>td]:py-1"
              >
                <td className="h-12">
                  <Pruefplakette status={e.gesamtStatus} faelligAm={e.naechsteFaelligkeit} groesse={40} />
                </td>
                <td className="min-w-0">
                  <Link href={`/geraete/${e.geraet.id}`} className={ZEILENLINK}>
                    {e.geraet.bezeichnung}
                  </Link>
                  <span className="block text-xs text-steel">
                    <span className="font-mono">{e.geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
                    <span className="md:hidden"> · {e.bereichName}</span>
                  </span>
                </td>
                <td className="hidden md:table-cell">{e.bereichName}</td>
                <td>
                  <span className="flex flex-wrap items-center gap-1">
                    <StatusAmpel status={e.gesamtStatus} kurz />
                    <BetriebsstatusBadge status={e.geraet.betriebsstatus} />
                  </span>
                </td>
                <td className="whitespace-nowrap font-mono tabular-nums">{datum(e.naechsteFaelligkeit)}</td>
                <td className="text-right">
                  <Maengel anzahl={e.offeneMaengel} />
                </td>
                <td
                  className="text-right font-mono tabular-nums"
                  title={e.pruefarten.map((p) => p.bezeichnung).join(', ')}
                >
                  {e.pruefarten.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unter 640 px: Liste, je Gerät eine Zeile mit Plakette links. */}
      <ul aria-label="Geräte mit Prüfstatus, sortiert nach Dringlichkeit" className="karte divide-y divide-steel-200 sm:hidden">
        {eintraege.map((e) => (
          <li key={e.geraet.id} className="relative flex gap-3 px-3 py-3 hover:bg-steel-50">
            <Pruefplakette status={e.gesamtStatus} faelligAm={e.naechsteFaelligkeit} groesse={40} />
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <Link href={`/geraete/${e.geraet.id}`} className={`block [overflow-wrap:anywhere] ${ZEILENLINK}`}>
                {e.geraet.bezeichnung}
              </Link>
              <p className="text-xs text-steel [overflow-wrap:anywhere]">
                <span className="font-mono">{e.geraet.inventarnummer ?? 'ohne Inventarnummer'}</span> · {e.bereichName}
              </p>
              <p className="flex flex-wrap items-center gap-1">
                <StatusAmpel status={e.gesamtStatus} kurz />
                <BetriebsstatusBadge status={e.geraet.betriebsstatus} />
                <Maengel anzahl={e.offeneMaengel} />
              </p>
              <p className="text-steel">
                Nächste Prüfung <span className="font-mono text-ink">{datum(e.naechsteFaelligkeit)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
