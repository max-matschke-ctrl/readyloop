import { MANGEL_SCHWERE_LABEL, MANGEL_STATUS_LABEL, type MangelSchwere, type MangelStatus } from '@/domain/types';

/** Mangelstatus (§6.6): Form der Statusmarke, offen brick-50 ⚠, in Bearbeitung ochre-50 !, behoben moss-50 ✓. */
export const MANGEL_STATUS_STIL: Record<MangelStatus, { symbol: string; flaeche: string; rand: string; kreis: string; linie: string }> = {
  offen: { symbol: '⚠', flaeche: 'bg-brick-50', rand: 'border-brick', kreis: 'bg-brick text-white', linie: 'var(--color-brick)' },
  in_bearbeitung: { symbol: '!', flaeche: 'bg-ochre-50', rand: 'border-ochre-600', kreis: 'bg-ochre text-ink', linie: 'var(--color-ochre-600)' },
  behoben: { symbol: '✓', flaeche: 'bg-moss-50', rand: 'border-moss', kreis: 'bg-moss text-white', linie: 'var(--color-moss)' },
};

/** Symbolkreis des Mangelstatus (Zählerleiste, Verlauf). */
export function MangelStatusSymbol({ status }: { status: MangelStatus }) {
  const s = MANGEL_STATUS_STIL[status];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none ${s.kreis}`}
    >
      {s.symbol}
    </span>
  );
}

/** Mangelstatus mit Symbol und Text (nie nur Farbe). Nicht klickbar. */
export function MangelStatusBadge({ status, className = '' }: { status: MangelStatus; className?: string }) {
  const s = MANGEL_STATUS_STIL[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${s.flaeche} ${s.rand} ${className}`}
    >
      <MangelStatusSymbol status={status} />
      {MANGEL_STATUS_LABEL[status]}
    </span>
  );
}

const SCHWERE_KURZ: Record<MangelSchwere, string> = { gefaehrlich: 'Gefährlich', erheblich: 'Erheblich', gering: 'Gering' };
const SCHWERE_SYMBOL: Record<MangelSchwere, string> = { gefaehrlich: '✕', erheblich: '!', gering: '–' };
const SCHWERE_STIL: Record<MangelSchwere, string> = {
  gefaehrlich: 'border-2 border-brick bg-brick-50 font-semibold',
  erheblich: 'border border-ochre-600 bg-ochre-50',
  gering: 'border border-steel-400 bg-white',
};

/** Schwere als eckige Marke (Radius 4, nicht rund: kein Fristenstatus), Symbol und Text; Langtext im title. */
export function MangelSchwereBadge({ schwere, lang = false }: { schwere: MangelSchwere; lang?: boolean }) {
  return (
    <span
      title={MANGEL_SCHWERE_LABEL[schwere]}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-feld px-1.5 py-0.5 text-xs text-ink ${SCHWERE_STIL[schwere]}`}
    >
      <span aria-hidden="true" className="font-bold">
        {SCHWERE_SYMBOL[schwere]}
      </span>
      {lang ? MANGEL_SCHWERE_LABEL[schwere] : SCHWERE_KURZ[schwere]}
    </span>
  );
}
