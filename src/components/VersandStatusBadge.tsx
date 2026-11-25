import { VERSAND_STATUS_LABEL, type VersandStatus } from '@/domain/types';

/** Fläche/Rahmen, Symbol und Symbolkreis je Versandstatus (§6.23). Farben nach Bedeutung, nicht nach Fristlogik. */
const STIL: Record<VersandStatus, { marke: string; symbol: string; kreis: string }> = {
  vorbereitet: { marke: 'border-steel-200 bg-steel-50', symbol: 'i', kreis: 'bg-steel-400 text-white' },
  versendet: { marke: 'border-steel-400 bg-steel-50', symbol: '✓', kreis: 'bg-steel text-white' },
  zugestellt: { marke: 'border-moss bg-moss-50', symbol: '✓', kreis: 'bg-moss text-white' },
  fehler: { marke: 'border-ochre-600 bg-ochre-50', symbol: '!', kreis: 'bg-ochre text-ink' },
  bounce: { marke: 'border-brick bg-brick-50', symbol: '✕', kreis: 'bg-brick text-white' },
  beschwerde: { marke: 'border-brick bg-brick-50', symbol: '⚠', kreis: 'bg-brick text-white' },
  vorschau: { marke: 'border-dashed border-steel-400 bg-white', symbol: 'i', kreis: 'bg-steel text-white' },
};

/**
 * Versandstatus-Marke (§6.23): Form wie die Statusmarke (runde Pille, Symbolkreis, Text ink, nicht klickbar).
 * Text = VERSAND_STATUS_LABEL wörtlich; nie Farbe ohne Text.
 */
export function VersandStatusBadge({ status }: { status: VersandStatus }) {
  const s = STIL[status];
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${s.marke}`}>
      <span
        aria-hidden="true"
        className={`inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none ${s.kreis}`}
      >
        {s.symbol}
      </span>
      <span>{VERSAND_STATUS_LABEL[status]}</span>
    </span>
  );
}
