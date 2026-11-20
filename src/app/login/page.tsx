import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DemoRollenWahl, LoginForm } from '@/components/LoginForm';
import { Meldung } from '@/components/Meldung';
import { PlaketteLive } from '@/components/PlaketteLive';
import { betriebsmodus, heute, holeAnmeldestatus } from '@/server/data';

export const metadata: Metadata = { title: 'Anmelden' };
export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

const FEHLER_TEXT: Record<string, string> = {
  link: 'Der Link ist ungültig oder abgelaufen. Bitte neu anfordern.',
};

/** Login (§8.1): ab lg zweispaltig (links Live-Plakette und Claim auf steel, rechts das Formular auf paper). */
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

  // Monat und Jahr serverseitig (Europe/Berlin), kein new Date() im Browser.
  const [jahr, monat] = heute().split('-').map(Number) as [number, number];

  return (
    <main className="lg:grid lg:min-h-[calc(100dvh-2.125rem)] lg:grid-cols-2">
      <section aria-labelledby="login-marke" className="bg-steel text-white">
        <div className="mx-auto flex max-w-[26rem] items-center gap-4 px-4 py-5 lg:h-full lg:max-w-none lg:flex-col lg:justify-center lg:gap-6 lg:py-16">
          <span className="lg:hidden">
            <PlaketteLive monat={monat} jahr={jahr} groesse={64} />
          </span>
          <span className="hidden lg:block">
            <PlaketteLive monat={monat} jahr={jahr} groesse={160} />
          </span>
          <div className="min-w-0 lg:text-center">
            <h1
              id="login-marke"
              className="text-[1.75rem] font-semibold leading-8 tracking-[-0.02em] lg:text-[2.25rem] lg:leading-10"
            >
              Readyloop
            </h1>
            <p className="text-sm text-white/85 lg:mt-2 lg:text-base">
              Prüffristen für Arbeitsmittel. <span className="whitespace-nowrap">Nachweise griffbereit.</span>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="login-titel" className="flex justify-center px-4 py-6 lg:items-center lg:py-16">
        <div className="w-full max-w-[24rem] space-y-4">
          <h2 id="login-titel" className="text-xl font-semibold leading-7">
            Anmelden
          </h2>
          {fehler && <Meldung art="fehler">{fehler}</Meldung>}
          {modus === 'demo' && <DemoRollenWahl />}
          {modus === 'supabase' && <LoginForm />}
          {modus === 'unkonfiguriert' && (
            <Meldung art="hinweis" text="Es fehlen die Zugangsdaten zur Datenbank. Bitte wenden Sie sich an den Betreiber dieser Installation.">
              Readyloop ist nicht konfiguriert.
            </Meldung>
          )}
        </div>
      </section>
    </main>
  );
}
