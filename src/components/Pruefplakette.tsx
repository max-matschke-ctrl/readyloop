import { STATUS_KURZ, STATUS_FARBE, STATUS_RAND } from './status';
import { C, MONATE, R_INNEN, VIEWBOX, segment } from './plakette-geometrie';
import type { FristStatus, IsoDate } from '@/domain/types';

interface Props {
  status: FristStatus;
  faelligAm: IsoDate | null;
  /** Varianten nach Designsystem §5.3: Zeile 40, Karte mobil 56, Leer 64, Akte 96. */
  groesse?: 40 | 56 | 64 | 96;
}

/**
 * Prüfplakette (§5): Ring mit 12 Monatssegmenten, Fälligkeitsmonat gefüllt, Jahr in der Mitte.
 * Ring und Rahmen über STATUS_RAND (ochre → ochre-600 für 3:1), Füllung über STATUS_FARBE.
 */
export function Pruefplakette({ status, faelligAm, groesse = 40 }: Props) {
  const farbe = STATUS_FARBE[status];
  const rand = STATUS_RAND[status];
  const teile = faelligAm?.split('-');
  const jahr = teile?.[0]?.slice(2) ?? null;
  const monat = teile?.[1] ? Number(teile[1]) : null;
  const mitDatum = status !== 'unbekannt' && status !== 'gbu' && jahr !== null && monat !== null;

  const vorNutzung = status === 'vor_nutzung_pruefen';
  const mitte =
    status === 'gbu' ? 'GBU' : vorNutzung && !mitDatum ? '!' : status === 'unbekannt' || !mitDatum ? '?' : jahr;
  const label = mitDatum
    ? `Nächste Prüfung ${String(monat).padStart(2, '0')}/${teile![0]}, ${STATUS_KURZ[status].toLowerCase()}`
    : status === 'gbu'
      ? 'Keine Frist: Frist über GBU festlegen'
      : vorNutzung
        ? 'Vor Nutzung prüfen – nicht verwenden'
        : 'Nächste Prüfung unbekannt: Prüfdatum unbekannt';

  return (
    <svg role="img" aria-label={label} width={groesse} height={groesse} viewBox={VIEWBOX} className="shrink-0">
      <title>{label}</title>
      <circle cx={C} cy={C} r={R_INNEN - 1} fill="#fff" />
      {MONATE.map((m) => {
        const aktiv = mitDatum && m === monat;
        return (
          <path
            key={m}
            d={segment(m)}
            fill={aktiv ? farbe : `color-mix(in srgb, ${farbe} 14%, white)`}
            stroke={rand}
            strokeWidth={status === 'gbu' ? 1 : 0.6}
            strokeDasharray={status === 'gbu' ? '2 1.5' : undefined}
          />
        );
      })}
      <text
        x={C}
        y={C}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontWeight={600}
        fontSize={mitte === 'GBU' ? 13 : 19}
        letterSpacing="-0.02em"
        fill={mitte === '!' ? farbe : 'var(--color-ink)'}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {mitte}
      </text>
    </svg>
  );
}
