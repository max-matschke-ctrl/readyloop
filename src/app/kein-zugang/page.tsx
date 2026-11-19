import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { abmelden } from '@/server/actions';
import { holeAnmeldestatus } from '@/server/data';

export const metadata: Metadata = { title: 'Kein Zugang' };
export const dynamic = 'force-dynamic';

export default async function KeinZugangSeite() {
  const status = await holeAnmeldestatus();
  if (status !== 'ohne_mitgliedschaft') redirect('/');

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Readyloop</h1>
      <div className="karte mt-6 space-y-3 p-5">
        <h2 className="text-lg font-semibold">Kein Zugang</h2>
        <p className="text-sm">
          Ihr Konto ist angemeldet, hat aber keinen aktiven Zugang zu einem Betrieb. Bitte wenden Sie sich an die
          Administration Ihres Betriebs.
        </p>
        <form action={abmelden}>
          <button type="submit" className="btn btn-sekundaer">
            Abmelden
          </button>
        </form>
      </div>
    </main>
  );
}
