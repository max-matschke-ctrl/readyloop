import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { OeffentlicheGeraeteansicht } from '@/components/OeffentlicheGeraeteansicht';
import { OeffentlicheKopfleiste } from '@/components/OeffentlicheKopfleiste';
import { TokenAktionen } from '@/components/TokenAktionen';
import type { Nutzung } from '@/domain/types';
import { holeSitzung, holeTokenSeite } from '@/server/data';

export const dynamic = 'force-dynamic';

type Params = Promise<{ token: string }>;

/** Eine Abfrage je Anfrage für Metadaten und Seite. */
const ladeSeite = cache(holeTokenSeite);

const NUTZUNG_KURZ: Record<Nutzung, string> = {
  nicht_verwenden: 'Nicht verwenden',
  unklar: 'Prüfstatus unklar',
  verwendbar: 'Verwendbar',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params;
  const seite = await ladeSeite(token);
  const robots = { index: false, follow: false };
  if (!seite) return { title: 'Aufkleber nicht gültig', robots };
  return { title: { absolute: `${seite.ansicht.bezeichnung} – ${NUTZUNG_KURZ[seite.ansicht.nutzung]}` }, robots };
}

/**
 * Öffentliche QR-Seite (F-24, US-18, §8.12): ohne Login lesbar. Ohne Sitzung öffentliche Kopfleiste,
 * mit Sitzung die normale. Ungültiger, unbekannter oder ersetzter Token → not-found (404).
 */
export default async function TokenSeite({ params }: { params: Params }) {
  const { token } = await params;
  const seite = await ladeSeite(token);
  if (!seite) notFound();
  const sitzung = seite.angemeldet ? await holeSitzung() : null;

  return (
    <>
      {sitzung ? (
        <AppHeader sitzung={sitzung} />
      ) : (
        <OeffentlicheKopfleiste anmeldenHref={`/login?next=${encodeURIComponent(`/g/${seite.token}`)}`} />
      )}
      <main className="mx-auto max-w-[40rem] px-4 py-4 sm:py-6 md:px-6">
        <OeffentlicheGeraeteansicht ansicht={seite.ansicht} aktionen={<TokenAktionen seite={seite} />} />
      </main>
    </>
  );
}
