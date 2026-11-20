import { BETRIEBSSTATUS_LABEL, type Betriebsstatus } from '@/domain/types';

/**
 * Betriebsstatus-Marke (§6.6): neutral (steel-50, Rahmen steel-200). Nur „außer Betrieb“ bekommt
 * brick-50 mit ✕, weil das Gerät dann nicht benutzt werden darf. Text immer sichtbar.
 * Zeigt nur Abweichungen von „in Betrieb“, außer mit `immer` (Aktenkopf).
 */
export function BetriebsstatusBadge({
  status,
  immer = false,
  className = '',
}: {
  status: Betriebsstatus;
  immer?: boolean;
  className?: string;
}) {
  if (status === 'in_betrieb' && !immer) return null;
  const warnung = status === 'ausser_betrieb';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${
        warnung ? 'border-brick bg-brick-50' : 'border-steel-200 bg-steel-50'
      } ${className}`}
    >
      {warnung && (
        <span
          aria-hidden="true"
          className="inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full bg-brick text-[0.6875rem] font-bold leading-none text-white"
        >
          ✕
        </span>
      )}
      {BETRIEBSSTATUS_LABEL[status]}
    </span>
  );
}
