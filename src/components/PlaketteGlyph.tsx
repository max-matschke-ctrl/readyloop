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
  /** erledigt: Ring in moss mit ✓ (Leerzustand „alles erledigt“, §6.12). */
  variante?: 'leer' | 'erledigt';
  className?: string;
}

/**
 * Leere Plakette (§5.3, §6.12): gestrichelter Ring in steel-400, keine Füllung.
 * Bild eines Leerzustands; die Bedeutung trägt der Titel daneben, deshalb aria-hidden.
 */
export function PlaketteLeer({ groesse = 64, zeichen, variante = 'leer', className = '' }: LeerProps) {
  const erledigt = variante === 'erledigt';
  const ring = erledigt ? 'var(--color-moss)' : 'var(--color-steel-400)';
  const mitte = zeichen ?? (erledigt ? '✓' : '–');
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
          fill={erledigt ? 'color-mix(in srgb, var(--color-moss) 14%, white)' : 'none'}
          stroke={ring}
          strokeWidth={erledigt ? 0.6 : 1}
          strokeDasharray={erledigt ? undefined : '2 1.5'}
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
        fill={erledigt ? 'var(--color-moss)' : 'var(--color-steel)'}
      >
        {mitte}
      </text>
    </svg>
  );
}

interface BestaetigungProps {
  /** Neues Fälligkeitsdatum, nur wenn der Server es liefert (§8.8). Ohne Datum: ✓ in der Mitte. */
  faelligAm?: string | null;
  groesse?: 24 | 40;
}

/**
 * Bestätigungs-Plakette (§5.3): moss, Erfolgsmeldung nach „Nachweis speichern“. Mit Datum vom Server
 * ist der neue Monat gefüllt und das Jahr steht in der Mitte; das Datum wird nie im Browser berechnet.
 */
export function PlaketteBestaetigung({ faelligAm = null, groesse = 24 }: BestaetigungProps) {
  const teile = faelligAm?.split('-');
  const jahr = teile?.[0]?.slice(2);
  const monat = teile?.[1] ? Number(teile[1]) : null;
  const label = monat && jahr ? `Gespeichert. Nächste Prüfung ${String(monat).padStart(2, '0')}/${teile![0]}` : 'Gespeichert';
  return (
    <svg role="img" aria-label={label} width={groesse} height={groesse} viewBox={VIEWBOX} className="shrink-0">
      <circle cx={C} cy={C} r={R_INNEN - 1} fill="white" />
      {MONATE.map((m) => (
        <path
          key={m}
          d={segment(m)}
          fill={m === monat ? 'var(--color-moss)' : 'color-mix(in srgb, var(--color-moss) 14%, white)'}
          stroke="var(--color-moss)"
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
        fontSize={19}
        fill="var(--color-moss-800)"
      >
        {monat && jahr ? jahr : '✓'}
      </text>
    </svg>
  );
}
