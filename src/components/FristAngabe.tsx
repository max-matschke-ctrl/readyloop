import { FRIST_QUELLE_LABEL, STUFE_LABEL, type PruefartAnsicht } from '@/domain/types';
import { StufeBadge } from './StufeBadge';
import { monate } from './format';

function Fundstelle({ text, url }: { text: string; url: string | null }) {
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link">
      {text}
      <span className="sr-only"> (öffnet in neuem Fenster)</span>
    </a>
  ) : (
    <>{text}</>
  );
}

/**
 * Frist in einer Zeile mit Stufe und Quelle (Leitsatz 3, §6.5): für Zusammenfassungen außerhalb der Akte
 * (Nachweisformular, Prüferkarte). Ohne freigegebene Frist steht der Vorschlag bzw. „Frist über GBU festlegen“.
 */
export function FristAngabe({ ansicht }: { ansicht: Pick<PruefartAnsicht, 'pruefart' | 'vorschlag'> }) {
  const { frist } = ansicht.pruefart;
  const v = ansicht.vorschlag;
  if (frist) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="font-medium text-ink">{monate(frist.monate)}</span>
        <StufeBadge stufe={frist.stufe} />
        <span>
          {STUFE_LABEL[frist.stufe]}. Quelle: {FRIST_QUELLE_LABEL[frist.quelle]}, <Fundstelle text={frist.fundstelle} url={frist.quelleUrl} />
        </span>
      </span>
    );
  }
  if (v.art === 'gbu') return <span className="font-medium text-ink">Frist über GBU festlegen</span>;
  const stufe = v.art === 'katalog' ? v.stufe : 'C';
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>Nicht freigegeben. Vorschlag {monate(v.monate)}</span>
      <StufeBadge stufe={stufe} />
      <span>
        Quelle: {v.art === 'katalog' ? 'Prüfkatalog' : 'Herstellerangabe'},{' '}
        {v.art === 'katalog' ? <Fundstelle text={v.fundstelle} url={v.quelleUrl} /> : v.fundstelle}
      </span>
    </span>
  );
}
