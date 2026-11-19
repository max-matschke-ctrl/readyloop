import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';
import { istDemoModus } from '@/server/data';

export const metadata: Metadata = { title: 'Anmelden' };
export const dynamic = 'force-dynamic';

export default function LoginSeite() {
  const demo = istDemoModus();
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Readyloop</h1>
      <p className="mt-1 text-sm text-steel">Prüffristen für Arbeitsmittel. Nachweise griffbereit.</p>
      <div className="karte mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">Anmelden</h2>
        {demo ? (
          <LoginForm />
        ) : (
          <p className="text-sm">
            Die Anmeldung mit E-Mail und Passwort folgt mit dem Datenbankbetrieb (Inkrement 2).
          </p>
        )}
      </div>
    </main>
  );
}
