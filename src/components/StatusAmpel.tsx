import { STATUS_LABEL, VOR_NUTZUNG_GRUND_LABEL, type FristStatus, type VorNutzungGrund } from '@/domain/types';
import { STATUS_FARBE, STATUS_FLAECHE, STATUS_KURZ, STATUS_RAND, STATUS_SYMBOL } from './status';

interface Props {
  status: FristStatus;
  /** kurz: Kurzlabel (Tabellen), sonst Langtext aus STATUS_LABEL. */
  kurz?: boolean;
  /** Nur bei vor_nutzung_pruefen: Grund als Zusatztext. */
  grund?: VorNutzungGrund | null;
  /** §10 E-1: ersetzt Anzeigetext und title (z. B. „Frist nicht freigegeben“); Symbol und Form bleiben. */
  text?: string;
  className?: string;
}

/** Symbolkreis (§6.4): Füllung Statusfarbe, Glyph weiß (auf ochre: ink, 5,6:1). GBU: gestrichelter Kreis. */
export function StatusSymbol({ status }: { status: FristStatus }) {
  const farbe = STATUS_FARBE[status];
  const hell = status === 'bald_faellig';
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none"
      style={
        status === 'gbu'
          ? { border: `1.5px dashed ${STATUS_RAND[status]}`, color: 'var(--color-ink)' }
          : { background: farbe, color: hell ? 'var(--color-ink)' : 'white' }
      }
    >
      {STATUS_SYMBOL[status]}
    </span>
  );
}

/** Statusmarke (§6.4): runde Pille, Fläche Status-50, Rahmen Statusfarbe (ochre → ochre-600), Text ink. Nicht klickbar. */
export function StatusAmpel({ status, kurz = false, grund, text: eigenerText, className = '' }: Props) {
  const grundText = status === 'vor_nutzung_pruefen' && grund ? VOR_NUTZUNG_GRUND_LABEL[grund] : null;
  const text = eigenerText ?? (kurz ? STATUS_KURZ[status] : STATUS_LABEL[status]);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${
        status === 'vor_nutzung_pruefen' ? 'font-semibold' : ''
      } ${className}`}
      style={{
        borderColor: STATUS_RAND[status],
        borderStyle: status === 'gbu' ? 'dashed' : 'solid',
        borderWidth: status === 'vor_nutzung_pruefen' ? 2 : undefined,
        background: STATUS_FLAECHE[status],
      }}
      title={eigenerText ?? (grundText ? `${STATUS_LABEL[status]} (${grundText})` : STATUS_LABEL[status])}
    >
      <StatusSymbol status={status} />
      <span>
        {text}
        {grundText && <span className="font-normal"> · {grundText}</span>}
      </span>
    </span>
  );
}
