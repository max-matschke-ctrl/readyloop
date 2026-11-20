import { C, MONATE, R_INNEN, VIEWBOX, segment } from './plakette-geometrie';

interface GlyphProps {
  /** 20–24 px (§5.3). */
  groesse?: 20 | 24;
  /** steel auf hellem Grund, weiss in der Kopfleiste. */
  ton?: 'steel' | 'weiss';
  /** Gefülltes Segment (Monat 1–12). */
  segmentNr?: number;
  className?: string;
}

/**
 * Glyph-Plakette (§5.3): Ring ohne Text, ein Segment gefüllt. Schmuck der Wortmarke und
 * Ladeanzeige, deshalb immer aria-hidden; der Text daneben trägt die Bedeutung.
 */
export function PlaketteGlyph({ groesse = 24, ton = 'steel', segmentNr = 1, className = '' }: GlyphProps) {
  const farbe = ton === 'weiss' ? 'white' : 'var(--color-steel)';
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={groesse}
      height={groesse}
      viewBox={VIEWBOX}
      className={`shrink-0 ${className}`}
    >
      {MONATE.map((m) => (
        <path key={m} d={segment(m)} fill={farbe} fillOpacity={m === segmentNr ? 1 : 0.38} />
      ))}
    </svg>
  );
}

interface LeerProps {
  /** Leer 64 oder 96 (§5.3). */
  groesse?: 64 | 96;
  /** Mittenzeichen, Standard „–“ (z. B. „!“ für Fehler/kein Zugriff). */
  zeichen?: string;
  className?: string;
}

/**
 * Leere Plakette (§5.3, §6.12): gestrichelter Ring in steel-400, keine Füllung.
 * Bild eines Leerzustands; die Bedeutung trägt der Titel daneben, deshalb aria-hidden.
 */
export function PlaketteLeer({ groesse = 64, zeichen = '–', className = '' }: LeerProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={groesse}
      height={groesse}
      viewBox={VIEWBOX}
      className={`shrink-0 ${className}`}
    >
      {MONATE.map((m) => (
        <path
          key={m}
          d={segment(m)}
          fill="none"
          stroke="var(--color-steel-400)"
          strokeWidth={1}
          strokeDasharray="2 1.5"
        />
      ))}
      <circle cx={C} cy={C} r={R_INNEN - 1} fill="white" />
      <text
        x={C}
        y={C}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontWeight={600}
        fontSize={19}
        fill="var(--color-steel)"
      >
        {zeichen}
      </text>
    </svg>
  );
}
