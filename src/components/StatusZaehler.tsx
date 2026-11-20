import Link from 'next/link';
import type { FristStatus } from '@/domain/types';
import { StatusSymbol } from './StatusAmpel';
import { STATUS_KURZ, STATUS_RAND, STATUS_REIHENFOLGE } from './status';

interface Props {
  zaehler: Record<FristStatus, number>;
  gesamt: number;
  aktiv?: FristStatus;
  /** Weitere Filterparameter, die beim Klick erhalten bleiben. */
  params: { bereich?: string; q?: string };
}

function href(params: Props['params'], status?: FristStatus): string {
  const sp = new URLSearchParams();
  if (params.bereich) sp.set('bereich', params.bereich);
  if (status) sp.set('status', status);
  if (params.q) sp.set('q', params.q);
  const s = sp.toString();
  return s ? `/geraete?${s}` : '/geraete';
}

export const ZAEHLER_FELD =
  'relative flex h-full min-h-[5.5rem] flex-col justify-between gap-1 px-3 pb-2.5 pt-2 focus-visible:z-10 focus-visible:-outline-offset-2';
export const ZAEHLER_AKTIV = 'bg-steel-50 shadow-[inset_0_0_0_2px_var(--color-steel)]';
export const ZAEHLER_INAKTIV = 'bg-white hover:bg-steel-50';

/**
 * Zählerleiste (§6.8): eine zusammenhängende Fläche, Felder durch Linien geteilt, zugleich Statusfilter.
 * Reihenfolge nach Dringlichkeit, „Alle“ rechts abgesetzt. Felder mit 0 gedämpft.
 */
export function StatusZaehler({ zaehler, gesamt, aktiv, params }: Props) {
  return (
    <nav aria-label="Nach Status filtern">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-flaeche border border-steel-200 bg-steel-200 sm:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.15fr)]">
        {STATUS_REIHENFOLGE.map((s) => {
          const ist = aktiv === s;
          const anzahl = zaehler[s];
          const leer = anzahl === 0;
          return (
            <li key={s}>
              <Link
                href={href(params, s)}
                aria-current={ist ? 'true' : undefined}
                className={`${ZAEHLER_FELD} ${ist ? ZAEHLER_AKTIV : ZAEHLER_INAKTIV}`}
                style={{
                  borderTopWidth: 3,
                  borderTopStyle: s === 'gbu' ? 'dashed' : 'solid',
                  borderTopColor: leer ? 'var(--color-steel-200)' : STATUS_RAND[s],
                }}
              >
                <span
                  className={`font-display text-[1.75rem] font-semibold leading-8 tabular-nums ${leer ? 'text-steel' : 'text-ink'}`}
                >
                  {anzahl}
                </span>
                <span className="flex items-center gap-1.5 text-xs leading-tight text-ink">
                  <StatusSymbol status={s} />
                  {STATUS_KURZ[s]}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="col-span-2 sm:col-span-3 lg:col-span-1 lg:border-l-4 lg:border-steel-200">
          <Link
            href={href(params)}
            aria-current={!aktiv ? 'true' : undefined}
            className={`${ZAEHLER_FELD} border-t-[3px] border-steel-200 ${!aktiv ? ZAEHLER_AKTIV : ZAEHLER_INAKTIV}`}
          >
            <span className="font-display text-[1.75rem] font-semibold leading-8 tabular-nums text-ink">{gesamt}</span>
            <span className="text-xs leading-tight text-ink">Alle Geräte</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
