import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthRahmen } from '@/components/AuthRahmen';
import { Meldung } from '@/components/Meldung';
import { PasswortNeuForm } from '@/components/PasswortNeuForm';
import { hatAuthSitzung } from '@/server/data';

export const metadata: Metadata = { title: 'Neues Passwort' };
export const dynamic = 'force-dynamic';

export default async function PasswortNeuSeite() {
  const angemeldet = await hatAuthSitzung();
  return (
    <AuthRahmen titel="Neues Passwort">
      {angemeldet ? (
        <PasswortNeuForm />
      ) : (
        <>
          <Meldung art="fehler" text="Oder Sie haben die Seite direkt aufgerufen.">
            Der Link ist ungültig oder abgelaufen.
          </Meldung>
          <Link href="/passwort-vergessen" className="btn btn-sekundaer">
            Neuen Link anfordern
          </Link>
        </>
      )}
    </AuthRahmen>
  );
}
