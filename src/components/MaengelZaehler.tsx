import Link from 'next/link';
import { MANGEL_STATUS_LABEL, type MangelStatus } from '@/domain/types';
import { MANGEL_STATUS_STIL, MangelStatusSymbol } from './MangelStatusBadge';
import { ZAEHLER_AKTIV, ZAEHLER_FELD, ZAEHLER_INAKTIV } from './StatusZaehler';

const REIHENFOLGE: readonly MangelStatus[] = ['offen', 'in_bearbeitung', 'behoben'];

interface Props {
  zaehler: Record<MangelStatus, number>;
  gesamt: number;
  /** Aktive Status; mehrere bei „Unerledigt“ (offen und in Bearbeitung). Leer = alle. */
  aktiv: readonly MangelStatus[];
  hrefFuer: (status: MangelStatus | 'alle') => string;
}

/** Zählerleiste der Mängel im Baustein-Stil von /geraete (§6.8, §8.9): eine Fläche, zugleich Statusfilter. */
export function MaengelZaehler({ zaehler, gesamt, aktiv, hrefFuer }: Props) {
  return (
    <nav aria-label="Nach Mangelstatus filtern">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-flaeche border border-steel-200 bg-steel-200 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.15fr)]">
        {REIHENFOLGE.map((s) => {
          const ist = aktiv.includes(s);
          const anzahl = zaehler[s];
          const leer = anzahl === 0;
          return (
            <li key={s}>
              <Link
                href={hrefFuer(s)}
                aria-current={ist ? 'true' : undefined}
                className={`${ZAEHLER_FELD} ${ist ? ZAEHLER_AKTIV : ZAEHLER_INAKTIV}`}
                style={{ borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: leer ? 'var(--color-steel-200)' : MANGEL_STATUS_STIL[s].linie }}
              >
                <span className={`font-display text-[1.75rem] font-semibold leading-8 tabular-nums ${leer ? 'text-steel' : 'text-ink'}`}>
                  {anzahl}
                </span>
                <span className="flex items-center gap-1.5 text-xs leading-tight text-ink">
                  <MangelStatusSymbol status={s} />
                  {MANGEL_STATUS_LABEL[s]}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="sm:border-l-4 sm:border-steel-200">
          <Link
            href={hrefFuer('alle')}
            aria-current={aktiv.length === 0 ? 'true' : undefined}
            className={`${ZAEHLER_FELD} border-t-[3px] border-steel-200 ${aktiv.length === 0 ? ZAEHLER_AKTIV : ZAEHLER_INAKTIV}`}
          >
            <span className="font-display text-[1.75rem] font-semibold leading-8 tabular-nums text-ink">{gesamt}</span>
            <span className="text-xs leading-tight text-ink">Alle Mängel</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
