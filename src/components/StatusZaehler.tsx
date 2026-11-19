import Link from 'next/link';
import { FRIST_STATUS, type FristStatus } from '@/domain/types';
import { StatusSymbol } from './StatusAmpel';
import { STATUS_FARBE, STATUS_KURZ } from './status';

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

export function StatusZaehler({ zaehler, gesamt, aktiv, params }: Props) {
  return (
    <nav aria-label="Nach Status filtern">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <li>
          <Link
            href={href(params)}
            aria-current={!aktiv ? 'true' : undefined}
            className={`karte flex h-full flex-col px-3 py-2 hover:border-steel ${!aktiv ? 'border-steel ring-1 ring-steel' : ''}`}
          >
            <span className="font-mono text-2xl font-semibold">{gesamt}</span>
            <span className="text-xs text-steel">Alle Geräte</span>
          </Link>
        </li>
        {FRIST_STATUS.map((s) => {
          const ist = aktiv === s;
          return (
            <li key={s}>
              <Link
                href={href(params, s)}
                aria-current={ist ? 'true' : undefined}
                className={`karte flex h-full flex-col border-l-4 px-3 py-2 hover:border-steel ${ist ? 'ring-1 ring-steel' : ''}`}
                style={{ borderLeftColor: STATUS_FARBE[s], borderLeftStyle: s === 'gbu' ? 'dashed' : 'solid' }}
              >
                <span className="font-mono text-2xl font-semibold">{zaehler[s]}</span>
                <span className="flex items-center gap-1 text-xs text-ink">
                  <StatusSymbol status={s} />
                  {STATUS_KURZ[s]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
