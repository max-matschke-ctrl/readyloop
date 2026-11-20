import type { ReactNode } from 'react';
import { PlaketteLeer } from './PlaketteGlyph';

export type LeerzustandArt = 'leer' | 'filter' | 'erledigt' | 'fehler';

interface Props {
  art: LeerzustandArt;
  titel: string;
  text?: ReactNode;
  /** Genau eine Aktion (Button oder Link). */
  aktion?: ReactNode;
  /** Überschriftenebene im Dokument; die Optik ist immer h3 (§3.2). */
  ebene?: 'h1' | 'h2' | 'h3';
  groesse?: 64 | 96;
  className?: string;
}

/**
 * Leerzustand (§6.12): Leer-Plakette, Titel, ein Satz, eine Aktion. Linksbündig in der Fläche,
 * die sonst die Tabelle einnimmt. „erledigt“: moss-Plakette mit ✓, „fehler“: Mitte „!“.
 */
export function Leerzustand({ art, titel, text, aktion, ebene = 'h2', groesse = 64, className = '' }: Props) {
  const Ueberschrift = ebene;
  return (
    <div className={`karte flex flex-col items-start gap-4 px-4 py-6 sm:flex-row sm:px-6 ${className}`}>
      <PlaketteLeer
        groesse={groesse}
        variante={art === 'erledigt' ? 'erledigt' : 'leer'}
        zeichen={art === 'fehler' ? '!' : undefined}
      />
      <div className="min-w-0 max-w-prose space-y-2">
        <Ueberschrift className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal text-ink">
          {titel}
        </Ueberschrift>
        {text && <div className="text-sm text-steel">{text}</div>}
        {aktion && <div className="pt-1">{aktion}</div>}
      </div>
    </div>
  );
}
