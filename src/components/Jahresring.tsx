import type { IsoDate } from '@/domain/types';
import { MONATSKURZ, MONATSNAME, jahresringFenster } from './jahresring-fenster';
import { C, R_INNEN, VIEWBOX, segment } from './plakette-geometrie';

/** Vier Steel-Stufen nach Anzahl (§5.3): 0 / 1–2 / 3–5 / ab 6. Keine Statusfarben. */
const STUFEN = [
  { bis: 0, fuellung: 'white', text: 'keine' },
  { bis: 2, fuellung: 'var(--color-steel-200)', text: '1–2' },
  { bis: 5, fuellung: 'var(--color-steel-400)', text: '3–5' },
  { bis: Infinity, fuellung: 'var(--color-steel)', text: 'ab 6' },
] as const;

function stufe(n: number) {
  return STUFEN.find((s) => n <= s.bis) ?? STUFEN[STUFEN.length - 1]!;
}

interface Props {
  /** faelligAm aller Prüfarten aller Geräte (ungefilterte Liste), nicht nur die nächste je Gerät. */
  faelligkeiten: (IsoDate | null)[];
  /** Serverdatum aus heute(), nie im Browser ermittelt. */
  heute: IsoDate;
}

/**
 * Jahresring (§5.3, §9.3): Plakettenvariante, 12 Segmente = Kalendermonate (Januar oben),
 * Füllung nach Anzahl der Prüfart-Fälligkeiten von heute bis Ende des 11. Folgemonats (§10 E-3), Mitte = Summe.
 * Überfällige (vor heute) liegen außerhalb des Fensters und stehen als Hinweis daneben, nie stillschweigend weg.
 * Daneben ein Monatsüberblick für Screenreader.
 */
export function Jahresring({ faelligkeiten, heute }: Props) {
  const { monate, summe, ueberfaellig } = jahresringFenster(faelligkeiten, heute);
  const erster = monate[0]!;
  const letzter = monate[11]!;
  const zeitraumLang = `von ${MONATSNAME[erster.monat - 1]} ${erster.jahr} bis ${MONATSNAME[letzter.monat - 1]} ${letzter.jahr}`;

  const maxEintrag = monate.reduce<(typeof monate)[number] | null>((m, e) => (e.anzahl > (m?.anzahl ?? 0) ? e : m), null);
  const label =
    `${summe === 1 ? '1 Prüffälligkeit' : `${summe} Prüffälligkeiten`} aller Prüfarten ${zeitraumLang}` +
    (maxEintrag ? `, die meisten im ${MONATSNAME[maxEintrag.monat - 1]} ${maxEintrag.jahr} (${maxEintrag.anzahl})` : '') +
    (ueberfaellig > 0 ? `; zusätzlich ${ueberfaellig} überfällig` : '');

  const ueberblickId = 'jahresring-ueberblick';

  return (
    <div className="flex items-center gap-4">
      <svg
        role="img"
        aria-label={label}
        width={112}
        height={112}
        viewBox={VIEWBOX}
        className="shrink-0"
      >
        <title>{label}</title>
        <circle cx={C} cy={C} r={R_INNEN - 1} fill="white" />
        {/* Ein Eintrag je Segment; der aktuelle Monat (Fensteranfang) zuletzt, mit Rahmen ink 1,5. */}
        {[...monate.slice(1), erster].map((e, i) => (
          <path
            key={`${e.jahr}-${e.monat}`}
            d={segment(e.monat)}
            fill={stufe(e.anzahl).fuellung}
            stroke={i === 11 ? 'var(--color-ink)' : 'var(--color-steel-400)'}
            strokeWidth={i === 11 ? 1.5 : 0.6}
          />
        ))}
        <text
          x={C}
          y={C}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-display)"
          fontWeight={600}
          fontSize={summe > 99 ? 14 : 18}
          fill="var(--color-ink)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {summe}
        </text>
      </svg>

      <div className="w-36 min-w-0 space-y-2 text-sm">
        {ueberfaellig > 0 && (
          <p className="inline-flex items-center gap-1.5 font-medium text-ink">
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-brick font-display text-[0.625rem] font-bold text-white"
            >
              ✕
            </span>
            <span>
              {ueberfaellig} überfällig
              <span className="sr-only">{ueberfaellig === 1 ? ' (1 Prüfung' : ` (${ueberfaellig} Prüfungen`} vor heute fällig, nicht im Ring enthalten)</span>
            </span>
          </p>
        )}
        <p className="text-ink" aria-hidden="true">
          fällig <span className="whitespace-nowrap">{`${MONATSKURZ[erster.monat - 1]} ${erster.jahr}`}</span> –{' '}
          <span className="whitespace-nowrap">{`${MONATSKURZ[letzter.monat - 1]} ${letzter.jahr}`}</span>
        </p>
        <ul aria-label="Legende: Fälligkeiten je Monat" className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-steel">
          {STUFEN.map((s) => (
            <li key={s.text} className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="inline-block size-3 border border-steel-400"
                style={{ background: s.fuellung }}
              />
              {s.text}
            </li>
          ))}
          <li className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block size-3 border-[1.5px] border-ink bg-white" />
            Rahmen dunkel: aktueller Monat
          </li>
        </ul>
        <dl id={ueberblickId} aria-label="Fälligkeiten je Monat" className="sr-only">
          {monate.map((e) => (
            <div key={`${e.jahr}-${e.monat}`}>
              <dt>
                {MONATSNAME[e.monat - 1]} {e.jahr}
              </dt>
              <dd>{e.anzahl === 1 ? '1 Fälligkeit' : `${e.anzahl} Fälligkeiten`}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
