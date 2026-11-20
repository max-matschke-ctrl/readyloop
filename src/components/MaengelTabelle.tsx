import Link from 'next/link';
import type { FristStatus, IsoDate, MangelAnsicht } from '@/domain/types';
import { MangelSchwereBadge, MangelStatusBadge } from './MangelStatusBadge';
import { Pruefplakette } from './Pruefplakette';
import { datum, tagVon } from './format';

/** Plakette je Gerät (Status und nächste Fälligkeit), von der Seite aus der Geräteliste übergeben. */
export type GeraetePlaketten = Record<string, { status: FristStatus; faelligAm: IsoDate | null }>;

const ZEILENLINK =
  'font-semibold text-ink after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-steel focus-visible:after:outline';

function kurz(text: string): string {
  return text.length > 80 ? `${text.slice(0, 80)} …` : text;
}

function FristBis({ m }: { m: MangelAnsicht }) {
  return (
    <>
      <span className={`font-mono tabular-nums ${m.terminUeberschritten ? 'font-semibold' : ''}`}>{datum(m.termin)}</span>
      {m.terminUeberschritten && (
        <span className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brick">
          <span aria-hidden="true">✕</span>Überschritten
        </span>
      )}
    </>
  );
}

interface Props {
  maengel: MangelAnsicht[];
  /** false in der Geräteakte: Spalte Gerät ausgeblendet. */
  mitGeraet?: boolean;
  plaketten?: GeraetePlaketten;
}

/**
 * Mängelliste (§8.9, §6.7): Erkennung = Mangel (gekürzt, gestreckter Zeilenlink), Gerät mit Plakette 40,
 * Status, Gemeldet am, Frist bis. Unter 640 px als Liste. Keine Auswertung je Person (R-45).
 */
export function MaengelTabelle({ maengel, mitGeraet = true, plaketten = {} }: Props) {
  return (
    <>
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Mängel, sortiert nach Schwere und Termin</caption>
          <thead className="text-left text-sm font-medium text-ink">
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Mangel</th>
              {mitGeraet && <th scope="col">Gerät</th>}
              <th scope="col">Schwere</th>
              <th scope="col">Status</th>
              <th scope="col" className="hidden lg:table-cell">
                Verantwortlich
              </th>
              <th scope="col" className="hidden md:table-cell">
                Gemeldet am
              </th>
              <th scope="col">Frist bis</th>
            </tr>
          </thead>
          <tbody>
            {maengel.map((m) => {
              const p = plaketten[m.geraetId];
              return (
                <tr
                  key={m.id}
                  className="relative align-top hover:bg-steel-50 [&:not(:last-child)>td]:border-b [&>td]:border-steel-200 [&>td]:px-3 [&>td]:py-3"
                >
                  <td className="min-w-48">
                    <Link href={`/maengel/${m.id}`} className={`[overflow-wrap:anywhere] ${ZEILENLINK}`}>
                      {kurz(m.beschreibung)}
                    </Link>
                    <span className="block text-xs text-steel">{m.pruefartBezeichnung ?? 'Gerät allgemein'}</span>
                  </td>
                  {mitGeraet && (
                    <td className="py-1!">
                      <span className="flex items-center gap-2.5">
                        {p && <Pruefplakette status={p.status} faelligAm={p.faelligAm} groesse={40} />}
                        <span className="min-w-0">
                          <Link href={`/geraete/${m.geraetId}`} className="link relative z-10 text-ink">
                            {m.geraetBezeichnung}
                          </Link>
                          <span className="block text-xs text-steel">
                            <span className="font-mono">{m.inventarnummer ?? 'ohne Inventarnummer'}</span> · {m.bereichName}
                          </span>
                        </span>
                      </span>
                    </td>
                  )}
                  <td>
                    <MangelSchwereBadge schwere={m.schwere} />
                  </td>
                  <td>
                    <MangelStatusBadge status={m.status} />
                  </td>
                  <td className="hidden lg:table-cell">{m.verantwortlichName ?? <span className="text-steel">noch offen</span>}</td>
                  <td className="hidden whitespace-nowrap font-mono tabular-nums md:table-cell">{tagVon(m.erfasstAm)}</td>
                  <td className="whitespace-nowrap">
                    <FristBis m={m} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul aria-label="Mängel, sortiert nach Schwere und Termin" className="karte divide-y divide-steel-200 sm:hidden">
        {maengel.map((m) => {
          const p = mitGeraet ? plaketten[m.geraetId] : undefined;
          return (
            <li key={m.id} className="relative flex gap-3 px-3 py-3 hover:bg-steel-50">
              {p && <Pruefplakette status={p.status} faelligAm={p.faelligAm} groesse={40} />}
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <Link href={`/maengel/${m.id}`} className={`block [overflow-wrap:anywhere] ${ZEILENLINK}`}>
                  {kurz(m.beschreibung)}
                </Link>
                <p className="text-xs text-steel [overflow-wrap:anywhere]">
                  {mitGeraet && (
                    <>
                      {m.geraetBezeichnung} · <span className="font-mono">{m.inventarnummer ?? 'ohne Inventarnummer'}</span> ·{' '}
                    </>
                  )}
                  {m.pruefartBezeichnung ?? 'Gerät allgemein'}
                </p>
                <p className="flex flex-wrap items-center gap-1.5">
                  <MangelStatusBadge status={m.status} />
                  <MangelSchwereBadge schwere={m.schwere} />
                </p>
                <div className="text-steel">
                  Frist bis <FristBis m={m} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
