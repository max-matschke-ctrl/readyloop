import { STATUS_LABEL, type FristStatus } from '@/domain/types';
import { STATUS_FARBE, STATUS_KURZ, STATUS_SYMBOL } from './status';

interface Props {
  status: FristStatus;
  /** kurz: Kurzlabel (Tabellen), sonst Langtext aus STATUS_LABEL. */
  kurz?: boolean;
  className?: string;
}

export function StatusSymbol({ status }: { status: FristStatus }) {
  const farbe = STATUS_FARBE[status];
  const hell = status === 'bald_faellig';
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none"
      style={
        status === 'gbu'
          ? { border: `1.5px dashed ${farbe}`, color: farbe }
          : { background: farbe, color: hell ? 'var(--color-ink)' : '#fff' }
      }
    >
      {STATUS_SYMBOL[status]}
    </span>
  );
}

export function StatusAmpel({ status, kurz = false, className = '' }: Props) {
  const farbe = STATUS_FARBE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${className}`}
      style={{
        borderColor: farbe,
        borderStyle: status === 'gbu' ? 'dashed' : 'solid',
        background: `color-mix(in srgb, ${farbe} 12%, white)`,
      }}
      title={STATUS_LABEL[status]}
    >
      <StatusSymbol status={status} />
      <span>{kurz ? STATUS_KURZ[status] : STATUS_LABEL[status]}</span>
    </span>
  );
}
