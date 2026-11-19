import { STUFE_LABEL, type Stufe } from '@/domain/types';

export function StufeBadge({ stufe }: { stufe: Stufe }) {
  return (
    <abbr
      title={`Stufe ${stufe}: ${STUFE_LABEL[stufe]}`}
      className="inline-flex size-5 items-center justify-center rounded border border-steel/60 bg-steel-hell font-mono text-xs font-bold text-ink no-underline"
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
