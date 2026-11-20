import type { CSSProperties } from 'react';
import { C, MONATE, R_INNEN, VIEWBOX, segment } from './plakette-geometrie';

interface Props {
  /** Aktueller Monat 1–12, serverseitig ermittelt (Europe/Berlin). */
  monat: number;
  /** Aktuelles Jahr, serverseitig ermittelt. */
  jahr: number;
  groesse?: number;
}

/**
 * Live-Plakette (§5.3, §4.4): Steel-Ring, Segmente bis zum aktuellen Monat in moss, Mitte das Jahr.
 * Einziger Bewegungsmoment: einmalige Füllung Segment für Segment (40 ms je Segment, gesamt < 600 ms),
 * reine CSS-Animation (.plakette-live in globals.css), bei reduzierter Bewegung sofort im Endzustand.
 * Schmuckbild ohne Datenbezug (§5.4 Ausnahme), deshalb aria-hidden.
 */
export function PlaketteLive({ monat, jahr, groesse = 160 }: Props) {
  return (
    <svg aria-hidden="true" focusable="false" width={groesse} height={groesse} viewBox={VIEWBOX} className="plakette-live shrink-0">
      <circle cx={C} cy={C} r={R_INNEN - 1} fill="white" />
      {MONATE.map((m) => {
        const gefuellt = m <= monat;
        return (
          <path
            key={m}
            d={segment(m)}
            className={gefuellt ? 'plakette-live-segment' : undefined}
            style={gefuellt ? ({ '--i': m - 1 } as CSSProperties) : undefined}
            fill={gefuellt ? 'var(--color-moss)' : 'color-mix(in srgb, var(--color-steel) 14%, white)'}
            stroke="var(--color-steel)"
            strokeWidth={0.6}
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
        fontSize={19}
        letterSpacing="-0.02em"
        fill="var(--color-ink)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {String(jahr).slice(2)}
      </text>
    </svg>
  );
}
