import { PRUEF_ERGEBNIS_LABEL, type NachweisAnsicht, type PruefErgebnis } from '@/domain/types';
import { datum } from './format';

const ERGEBNIS_STIL: Record<PruefErgebnis, { symbol: string; farbe: string }> = {
  ohne_maengel: { symbol: '✓', farbe: 'var(--color-moss)' },
  maengel_weiterbetrieb: { symbol: '!', farbe: 'var(--color-ochre)' },
  nicht_bestanden: { symbol: '✕', farbe: 'var(--color-brick)' },
};

export function NachweisListe({ nachweise }: { nachweise: NachweisAnsicht[] }) {
  if (nachweise.length === 0) return <p className="text-sm text-steel">Noch keine Nachweise erfasst.</p>;
  return (
    <div className="karte overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Prüfnachweise, neueste zuerst</caption>
        <thead className="bg-steel-hell/60 text-left text-xs text-steel">
          <tr>
            <th scope="col" className="px-3 py-2">Prüfdatum</th>
            <th scope="col" className="px-3 py-2">Prüfart</th>
            <th scope="col" className="px-3 py-2">Ergebnis</th>
            <th scope="col" className="hidden px-3 py-2 sm:table-cell">Prüfer</th>
            <th scope="col" className="px-3 py-2">Nachweis</th>
          </tr>
        </thead>
        <tbody>
          {nachweise.map((n) => {
            const stil = ERGEBNIS_STIL[n.ergebnis];
            return (
              <tr key={n.id} className="border-t border-steel/15 align-top">
                <td className="px-3 py-2 font-mono">{datum(n.pruefdatum)}</td>
                <td className="px-3 py-2">
                  {n.pruefartBezeichnung}
                  <span className="block text-xs text-steel">{n.pruefumfang}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-start gap-1.5">
                    <span aria-hidden="true" className="font-bold" style={{ color: stil.farbe }}>
                      {stil.symbol}
                    </span>
                    {PRUEF_ERGEBNIS_LABEL[n.ergebnis]}
                  </span>
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  {n.prueferName}
                  {!n.unterschriftImPdf && <span className="block text-xs text-steel">ohne Unterschrift im PDF</span>}
                </td>
                <td className="px-3 py-2">
                  <a href={n.pdfUrl} target="_blank" rel="noopener noreferrer" className="link">
                    PDF<span className="sr-only"> {n.pdfDateiname} (öffnet in neuem Fenster)</span>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
