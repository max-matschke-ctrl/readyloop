import { FileText } from 'lucide-react';
import { PRUEF_ERGEBNIS_LABEL, type NachweisAnsicht, type PruefErgebnis } from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { datum } from './format';

/** Ergebnis mit Symbol und Text (Status nie nur über Farbe). Ochre nur als Füllung mit ink-Glyph. */
const ERGEBNIS_STIL: Record<PruefErgebnis, { symbol: string; flaeche: string; glyph: string }> = {
  ohne_maengel: { symbol: '✓', flaeche: 'var(--color-moss)', glyph: 'white' },
  maengel_weiterbetrieb: { symbol: '!', flaeche: 'var(--color-ochre)', glyph: 'var(--color-ink)' },
  nicht_bestanden: { symbol: '✕', flaeche: 'var(--color-brick)', glyph: 'white' },
};

interface Props {
  nachweise: NachweisAnsicht[];
  /** Text im Leerzustand, z. B. Hinweis auf „Nachweis erfassen“. */
  leerText?: string;
}

/** Nachweisliste der Geräteakte (§8.5) als Tabelle nach §6.7: Datum, Prüfart, Ergebnis, Prüfer, PDF. */
export function NachweisListe({ nachweise, leerText }: Props) {
  if (nachweise.length === 0) {
    return <Leerzustand art="leer" ebene="h3" titel="Noch keine Nachweise." text={leerText} />;
  }
  return (
    <div className="karte relative overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Prüfnachweise, neueste zuerst</caption>
        <thead className="text-left">
          <tr className="[&>th]:h-12 [&>th]:border-b [&>th]:border-steel-200 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:text-ink">
            <th scope="col">Prüfdatum</th>
            <th scope="col">Prüfart</th>
            <th scope="col">Ergebnis</th>
            <th scope="col" className="hidden sm:table-cell">
              Prüfer
            </th>
            <th scope="col">Nachweis</th>
          </tr>
        </thead>
        <tbody>
          {nachweise.map((n) => {
            const stil = ERGEBNIS_STIL[n.ergebnis];
            return (
              <tr
                key={n.id}
                className="align-top [&:not(:last-child)>td]:border-b [&>td]:border-steel-200 [&>td]:px-3 [&>td]:py-3"
              >
                <td className="whitespace-nowrap font-mono tabular-nums">{datum(n.pruefdatum)}</td>
                <td className="min-w-40">
                  {n.pruefartBezeichnung}
                  <span className="block text-xs text-steel">{n.pruefumfang}</span>
                </td>
                <td>
                  <span className="inline-flex items-start gap-1.5">
                    <span
                      aria-hidden="true"
                      className="mt-px inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none"
                      style={{ background: stil.flaeche, color: stil.glyph }}
                    >
                      {stil.symbol}
                    </span>
                    {PRUEF_ERGEBNIS_LABEL[n.ergebnis]}
                  </span>
                </td>
                <td className="hidden sm:table-cell">
                  {n.prueferName}
                  {!n.unterschriftImPdf && <span className="block text-xs text-steel">ohne Unterschrift im PDF</span>}
                </td>
                <td>
                  <a
                    href={n.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FileText aria-hidden="true" size={16} strokeWidth={1.75} />
                    PDF öffnen<span className="sr-only">: {n.pdfDateiname} (öffnet in neuem Fenster)</span>
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
