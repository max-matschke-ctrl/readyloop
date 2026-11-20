import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  titel: ReactNode;
  /** Geschlossen sichtbare Zeile, z. B. der aktuelle Wert (§6.10). */
  zusammenfassung?: ReactNode;
  offen?: boolean;
  id?: string;
  children: ReactNode;
}

/** Disclosure für ein Inline-Formular innerhalb einer Fläche (§6.10): weiß, Rahmen steel-200, Radius 6. */
export function Unteraufklapper({ titel, zusammenfassung, offen, id, children }: Props) {
  return (
    <details open={offen} id={id} className="group/u rounded-flaeche border border-steel-200 bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-flaeche px-3 py-2 text-sm hover:bg-steel-50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{titel}</span>
          {zusammenfassung && <span className="block text-steel [overflow-wrap:anywhere]">{zusammenfassung}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-steel transition-transform duration-[var(--dauer-mittel)] group-open/u:rotate-180"
        />
      </summary>
      <div className="border-t border-steel-200 px-3 pb-3 pt-3">{children}</div>
    </details>
  );
}
