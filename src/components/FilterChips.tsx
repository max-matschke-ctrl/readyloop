import Link from 'next/link';
import { X } from 'lucide-react';

export interface FilterChip {
  /** Name des Parameters, z. B. „Bereich“. */
  name: string;
  /** Angezeigter Wert, z. B. „Werkstatt“. */
  wert: string;
  /** URL ohne genau diesen Parameter. */
  entfernenHref: string;
}

interface Props {
  chips: FilterChip[];
  /** Ab zwei Chips: Link „Filter zurücksetzen“. */
  zuruecksetzenHref?: string;
}

/**
 * Aktive Filter als Chips (§6.9): eckig (Radius 4), weiß, Rahmen steel-400 – bewusst anders als
 * runde Statusmarken. Der ✕-Teil ist ein Link und entfernt genau einen Parameter.
 */
export function FilterChips({ chips, zuruecksetzenHref }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label="Aktive Filter" className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li
            key={c.name}
            className="inline-flex min-h-8 max-w-full items-center rounded-feld border border-steel-400 bg-white pl-2.5 text-sm text-ink"
          >
            <span className="min-w-0 truncate">
              {c.name}: <span className="font-medium">{c.wert}</span>
            </span>
            <Link
              href={c.entfernenHref}
              aria-label={`Filter ${c.name} entfernen`}
              className="ml-1 inline-flex size-8 shrink-0 items-center justify-center rounded-feld text-steel hover:bg-steel-50 hover:text-ink"
            >
              <X aria-hidden="true" size={16} strokeWidth={1.75} />
            </Link>
          </li>
        ))}
      </ul>
      {zuruecksetzenHref && chips.length > 1 && (
        <Link href={zuruecksetzenHref} className="btn btn-still min-h-8">
          Filter zurücksetzen
        </Link>
      )}
    </div>
  );
}
