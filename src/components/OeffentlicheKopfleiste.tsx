import Link from 'next/link';
import { PlaketteGlyph } from './PlaketteGlyph';

/**
 * Öffentliche Kopfleiste (§6.1, I3M): gleiche Fläche und Höhe wie die App-Kopfleiste, nur Glyph und Wortmarke
 * (kein Link), rechts „Anmelden“ mit Rücksprung. Kein Betriebsname, kein Menü.
 */
export function OeffentlicheKopfleiste({ anmeldenHref = '/login' }: { anmeldenHref?: string }) {
  return (
    <header className="bg-steel text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6 xl:px-8">
        <p className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em]">
          <PlaketteGlyph ton="weiss" groesse={24} />
          Readyloop
        </p>
        <Link
          href={anmeldenHref}
          className="flex min-h-12 items-center px-2 text-base underline decoration-white/60 underline-offset-4 hover:decoration-white"
        >
          Anmelden
        </Link>
      </div>
    </header>
  );
}
