import { STATUS_KURZ, STATUS_FARBE } from './status';
import type { FristStatus, IsoDate } from '@/domain/types';

interface Props {
  status: FristStatus;
  faelligAm: IsoDate | null;
  groesse?: 40 | 64;
}

const C = 32;
const R_AUSSEN = 31;
const R_INNEN = 22;

function punkt(r: number, grad: number): [number, number] {
  const rad = ((grad - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}

/** Ringsegment für Monat 1–12 (1 oben, im Uhrzeigersinn). */
function segment(monat: number): string {
  const luecke = 2;
  const a0 = (monat - 1) * 30 + luecke / 2;
  const a1 = monat * 30 - luecke / 2;
  const [x0, y0] = punkt(R_AUSSEN, a0);
  const [x1, y1] = punkt(R_AUSSEN, a1);
  const [x2, y2] = punkt(R_INNEN, a1);
  const [x3, y3] = punkt(R_INNEN, a0);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} A${R_AUSSEN} ${R_AUSSEN} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${R_INNEN} ${R_INNEN} 0 0 0 ${f(x3)} ${f(y3)} Z`;
}

const MONATE = Array.from({ length: 12 }, (_, i) => i + 1);

/** Prüfplakette: Ring mit 12 Monatssegmenten, Fälligkeitsmonat gefüllt, Jahr in der Mitte. */
export function Pruefplakette({ status, faelligAm, groesse = 40 }: Props) {
  const farbe = STATUS_FARBE[status];
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
    <svg
      role="img"
      aria-label={label}
      width={groesse}
      height={groesse}
      viewBox="0 0 64 64"
      className="shrink-0"
    >
      <title>{label}</title>
      <circle cx={C} cy={C} r={R_INNEN - 1} fill="#fff" />
      {MONATE.map((m) => {
        const aktiv = mitDatum && m === monat;
        return (
          <path
            key={m}
            d={segment(m)}
            fill={aktiv ? farbe : `color-mix(in srgb, ${farbe} 14%, white)`}
            stroke={farbe}
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
        fontFamily="var(--font-mono)"
        fontWeight={700}
        fontSize={mitte === 'GBU' ? 12 : 17}
        fill={mitte === '!' ? farbe : 'var(--color-ink)'}
      >
        {mitte}
      </text>
    </svg>
  );
}
