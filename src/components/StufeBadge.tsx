import { STUFE_LABEL, type Stufe } from '@/domain/types';

/** Stufe-Marke (§6.5): Quadrat 20 px, steel-50, Rahmen steel-400. In Tabellen allein mit title, in der Akte mit Text. */
export function StufeBadge({ stufe }: { stufe: Stufe }) {
  return (
    <abbr
      title={`Stufe ${stufe}: ${STUFE_LABEL[stufe]}`}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-feld border border-steel-400 bg-steel-50 font-display text-xs font-semibold text-ink no-underline"
    >
      <span className="sr-only">Stufe </span>
      {stufe}
    </abbr>
  );
}

/** Stufe mit ausgeschriebener Erläuterung (Geräteakte). */
export function StufeMitText({ stufe }: { stufe: Stufe }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StufeBadge stufe={stufe} />
      <span className="text-xs text-steel">{STUFE_LABEL[stufe]}</span>
    </span>
  );
}
