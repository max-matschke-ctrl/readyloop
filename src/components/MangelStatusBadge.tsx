import { MANGEL_SCHWERE_LABEL, MANGEL_STATUS_LABEL, type MangelSchwere, type MangelStatus } from '@/domain/types';

const STATUS_SYMBOL: Record<MangelStatus, string> = { offen: '○', in_bearbeitung: '◐', behoben: '✓' };

/** Mangelstatus mit Symbol und Text (nie nur Farbe). */
export function MangelStatusBadge({ status }: { status: MangelStatus }) {
  const klasse =
    status === 'behoben'
      ? 'border-moss/60 bg-moss/10'
      : status === 'in_bearbeitung'
        ? 'border-ochre/70 bg-ochre/15'
        : 'border-brick/60 bg-brick/10';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${klasse}`}>
      <span aria-hidden="true">{STATUS_SYMBOL[status]}</span>
      {MANGEL_STATUS_LABEL[status]}
    </span>
  );
}

const SCHWERE_KURZ: Record<MangelSchwere, string> = { gefaehrlich: 'Gefährlich', erheblich: 'Erheblich', gering: 'Gering' };
const SCHWERE_SYMBOL: Record<MangelSchwere, string> = { gefaehrlich: '✕', erheblich: '!', gering: '·' };

/** Schwere mit Symbol und Text; Langtext im title. */
export function MangelSchwereBadge({ schwere, lang = false }: { schwere: MangelSchwere; lang?: boolean }) {
  const klasse =
    schwere === 'gefaehrlich'
      ? 'border-2 border-brick bg-brick/10 font-semibold'
      : schwere === 'erheblich'
        ? 'border border-ochre bg-ochre/15'
        : 'border border-steel/50 bg-white';
  return (
    <span title={MANGEL_SCHWERE_LABEL[schwere]} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-ink ${klasse}`}>
      <span aria-hidden="true" className="font-bold">
        {SCHWERE_SYMBOL[schwere]}
      </span>
      {lang ? MANGEL_SCHWERE_LABEL[schwere] : SCHWERE_KURZ[schwere]}
    </span>
  );
}
