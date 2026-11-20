import type { ReactNode } from 'react';

export type MeldungArt = 'erfolg' | 'warnung' | 'fehler' | 'hinweis';

const STIL: Record<MeldungArt, { flaeche: string; symbol: string; kreis: string }> = {
  erfolg: { flaeche: 'border-moss bg-moss-50', symbol: '✓', kreis: 'bg-moss text-white' },
  warnung: { flaeche: 'border-ochre-600 bg-ochre-50', symbol: '!', kreis: 'bg-ochre text-ink' },
  fehler: { flaeche: 'border-brick bg-brick-50', symbol: '✕', kreis: 'bg-brick text-white' },
  hinweis: { flaeche: 'border-steel bg-steel-50', symbol: 'i', kreis: 'bg-steel text-white' },
};

const ROLLE: Record<MeldungArt, 'status' | 'alert' | 'note'> = {
  erfolg: 'status',
  warnung: 'status',
  fehler: 'alert',
  hinweis: 'note',
};

interface Props {
  art: MeldungArt;
  /** Erster Satz (fett): was passiert ist. */
  children: ReactNode;
  /** Optional zweiter Satz (was jetzt zu tun ist) und/oder ein Link. */
  text?: ReactNode;
  /** Eigenes Symbol statt Symbolkreis, z. B. die Bestätigungs-Plakette nach „Nachweis speichern“. */
  symbol?: ReactNode;
  /** false: innerhalb einer bestehenden Live-Region (keine eigene Rolle status/alert). */
  live?: boolean;
  className?: string;
}

/**
 * Meldung (§6.11): Fläche -50, Linie links 4 px in der Statusfarbe, Symbolkreis, fetter Satz,
 * optional ein zweiter Satz. Keine Toasts: Meldungen stehen an der Stelle der Aktion und bleiben stehen.
 */
export function Meldung({ art, children, text, symbol, live = true, className = '' }: Props) {
  const s = STIL[art];
  const rolle = ROLLE[art];
  return (
    <div
      role={live || rolle === 'note' ? rolle : undefined}
      className={`flex items-start gap-3 rounded-flaeche border-l-4 px-3 py-2.5 text-sm text-ink ${s.flaeche} ${className}`}
    >
      {symbol ?? (
        <span
          aria-hidden="true"
          className={`mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold leading-none ${s.kreis}`}
        >
          {s.symbol}
        </span>
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold">{children}</p>
        {text && <div>{text}</div>}
      </div>
    </div>
  );
}
