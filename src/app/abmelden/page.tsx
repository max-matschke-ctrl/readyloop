import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AbmeldenForm } from '@/components/AbmeldenForm';
import { OeffentlicheKopfleiste } from '@/components/OeffentlicheKopfleiste';
import { holeAbmeldeSeite } from '@/server/data';

export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

/** Eine Abfrage je Anfrage für Metadaten und Seite. */
const ladeSeite = cache(holeAbmeldeSeite);

function tokenAus(sp: Record<string, string | string[] | undefined>): string {
  const t = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  return typeof t === 'string' ? t : '';
}

export async function generateMetadata({ searchParams }: { searchParams: SuchParams }): Promise<Metadata> {
  const seite = await ladeSeite(tokenAus(await searchParams));
  const robots = { index: false, follow: false };
  if (!seite) return { title: 'Link nicht gültig', robots };
  return { title: { absolute: `${seite.artLabel} abbestellen – Readyloop` }, robots };
}

/**
 * Öffentliche Abmeldeseite (§8.21, F-40, US-40): ohne Sitzung, Kopfleiste ohne „Anmelden“.
 * Der Aufruf (GET) ändert nichts; erst der Button. Ungültiger Token → not-found (404).
 */
export default async function AbmeldenSeite({ searchParams }: { searchParams: SuchParams }) {
  const seite = await ladeSeite(tokenAus(await searchParams));
  if (!seite) notFound();

  return (
    <>
      <OeffentlicheKopfleiste anmeldenHref={null} />
      <main className="mx-auto max-w-[40rem] space-y-4 px-4 py-6 md:px-6">
        <h1 className="text-[1.75rem] font-semibold leading-[2.125rem] tracking-[-0.015em] hyphens-auto [overflow-wrap:break-word]">
          {seite.abgemeldet ? seite.artLabel : `${seite.artLabel} abbestellen`}
        </h1>
        <AbmeldenForm seite={seite} />
      </main>
    </>
  );
}
