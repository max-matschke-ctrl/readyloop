import type { ReactNode } from 'react';
import { PlaketteGlyph } from './PlaketteGlyph';

/**
 * Rahmen der Seiten ohne Sitzung (§8.2): einspaltig, zentriert, kleine Glyph-Plakette mit Wortmarke,
 * darunter eine Fläche mit Titel (h1), einem Satz und einem Formular bzw. einer Aktion.
 */
export function AuthRahmen({ titel, text, children }: { titel?: string; text?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[26rem] px-4 py-10 sm:py-16">
      <p className="mb-6 flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em] text-ink">
        <PlaketteGlyph groesse={24} />
        Readyloop
      </p>
      <div className="karte space-y-4 p-5 sm:p-6">
        {titel && <h1 className="text-xl font-semibold leading-7">{titel}</h1>}
        {text && <div className="text-sm text-steel">{text}</div>}
        {children}
      </div>
    </main>
  );
}
