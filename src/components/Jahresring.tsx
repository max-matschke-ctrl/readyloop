import type { IsoDate } from '@/domain/types';
import { C, MONATE, R_INNEN, VIEWBOX, segment } from './plakette-geometrie';

const MONATSNAME = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

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
  /** naechsteFaelligkeit aller Geräte (ungefilterte Liste). */
  faelligkeiten: (IsoDate | null)[];
  /** Serverdatum aus heute(), nie im Browser ermittelt. */
  heute: IsoDate;
}

interface MonatEintrag {
  jahr: number;
  monat: number; // 1–12
  anzahl: number;
}

/**
 * Jahresring (§5.3, §9.3): Plakettenvariante, 12 Segmente = Kalendermonate (Januar oben),
 * Füllung nach Anzahl der Fälligkeiten von heute bis heute + 12 Monate, Mitte = Summe.
 * Daneben ein Monatsüberblick für Screenreader.
 */
export function Jahresring({ faelligkeiten, heute }: Props) {
  const [jHeute, mHeute, tHeute] = heute.split('-');
  const jahr0 = Number(jHeute);
  const monat0 = Number(mHeute);
  const ende = `${String(jahr0 + 1).padStart(4, '0')}-${mHeute}-${tHeute}`;

  // Chronologische Monate im Fenster: aktueller Monat bis gleicher Monat im Folgejahr (13 Einträge).
  const monate: MonatEintrag[] = Array.from({ length: 13 }, (_, i) => {
    const index = monat0 - 1 + i;
    return { jahr: jahr0 + Math.floor(index / 12), monat: (index % 12) + 1, anzahl: 0 };
  });
  for (const f of faelligkeiten) {
    if (!f || f < heute || f > ende) continue;
    const [j, m] = f.split('-');
    const eintrag = monate.find((e) => e.jahr === Number(j) && e.monat === Number(m));
    if (eintrag) eintrag.anzahl += 1;
  }
  const summe = monate.reduce((s, e) => s + e.anzahl, 0);

  // Ring: je Kalendermonat; der aktuelle Monat kommt im Fenster zweimal vor und wird zusammengezählt.
  const jeSegment = new Map<number, number>();
  for (const e of monate) jeSegment.set(e.monat, (jeSegment.get(e.monat) ?? 0) + e.anzahl);

  const maxEintrag = monate.reduce<MonatEintrag | null>((m, e) => (e.anzahl > (m?.anzahl ?? 0) ? e : m), null);
  const label =
    `${summe === 1 ? '1 Fälligkeit' : `${summe} Fälligkeiten`} in den nächsten 12 Monaten` +
    (maxEintrag ? `, die meisten im ${MONATSNAME[maxEintrag.monat - 1]} ${maxEintrag.jahr} (${maxEintrag.anzahl})` : '');

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
        {MONATE.map((m) => (
          <path
            key={m}
            d={segment(m)}
            fill={stufe(jeSegment.get(m) ?? 0).fuellung}
            stroke="var(--color-steel-400)"
            strokeWidth={0.6}
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
        <p className="text-ink" aria-hidden="true">
          fällig in den nächsten 12 Monaten
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
