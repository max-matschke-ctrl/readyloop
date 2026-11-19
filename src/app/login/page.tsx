import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DemoRollenWahl, LoginForm } from '@/components/LoginForm';
import { betriebsmodus, holeAnmeldestatus } from '@/server/data';

export const metadata: Metadata = { title: 'Anmelden' };
export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

const FEHLER_TEXT: Record<string, string> = {
  link: 'Der Link ist ungültig oder abgelaufen. Bitte neu anfordern.',
};

export default async function LoginSeite({ searchParams }: { searchParams: SuchParams }) {
  const modus = betriebsmodus();
  const sp = await searchParams;
  const fehlerKey = typeof sp.fehler === 'string' ? sp.fehler : undefined;
  const fehler = fehlerKey ? FEHLER_TEXT[fehlerKey] : undefined;

  if (modus === 'supabase') {
    const status = await holeAnmeldestatus();
    if (status === 'angemeldet') redirect('/');
    if (status === 'ohne_mitgliedschaft') redirect('/kein-zugang');
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Readyloop</h1>
      <p className="mt-1 text-sm text-steel">Prüffristen für Arbeitsmittel. Nachweise griffbereit.</p>
      <div className="karte mt-6 space-y-4 p-5">
        <h2 className="text-lg font-semibold">Anmelden</h2>
        {fehler && (
          <p role="alert" className="rounded border border-brick/50 bg-brick/10 px-3 py-2 text-sm">
            <span aria-hidden="true" className="mr-1 font-bold">
              ✕
            </span>
            {fehler}
          </p>
        )}
        {modus === 'demo' && <DemoRollenWahl />}
        {modus === 'supabase' && <LoginForm />}
        {modus === 'unkonfiguriert' && (
          <div role="status" className="space-y-2 text-sm">
            <p className="font-semibold">Readyloop ist nicht konfiguriert.</p>
            <p className="text-steel">
              Es fehlen die Zugangsdaten zur Datenbank. Bitte wenden Sie sich an den Betreiber dieser Installation.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
