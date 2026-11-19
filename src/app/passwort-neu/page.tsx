import type { Metadata } from 'next';
import Link from 'next/link';
import { PasswortNeuForm } from '@/components/PasswortNeuForm';
import { hatAuthSitzung } from '@/server/data';

export const metadata: Metadata = { title: 'Neues Passwort' };
export const dynamic = 'force-dynamic';

export default async function PasswortNeuSeite() {
  const angemeldet = await hatAuthSitzung();
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Readyloop</h1>
      <div className="karte mt-6 space-y-4 p-5">
        <h2 className="text-lg font-semibold">Neues Passwort</h2>
        {angemeldet ? (
          <PasswortNeuForm />
        ) : (
          <div className="space-y-2 text-sm">
            <p>Der Link ist ungültig oder abgelaufen, oder Sie haben die Seite direkt aufgerufen.</p>
            <p>
              <Link href="/passwort-vergessen" className="link">
                Neuen Link anfordern
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
