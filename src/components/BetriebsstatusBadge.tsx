import { BETRIEBSSTATUS_LABEL, type Betriebsstatus } from '@/domain/types';

/** Zeigt nur Abweichungen von „in Betrieb“; Text immer sichtbar (nicht nur Farbe). */
export function BetriebsstatusBadge({
  status,
  immer = false,
  className = '',
}: {
  status: Betriebsstatus;
  /** true: auch „In Betrieb“ anzeigen (Gerätekopf). */
  immer?: boolean;
  className?: string;
}) {
  if (status === 'in_betrieb' && !immer) return null;
  const aus = status !== 'in_betrieb';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${
        aus ? 'border-steel bg-steel-hell text-ink' : 'border-moss/50 text-ink'
      } ${className}`}
    >
      <span aria-hidden="true" className="font-mono">
        {aus ? '⏻' : '●'}
      </span>
      {BETRIEBSSTATUS_LABEL[status]}
    </span>
  );
}
