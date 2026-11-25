import Link from 'next/link';
import { Leerzustand } from '@/components/Leerzustand';
import { OeffentlicheKopfleiste } from '@/components/OeffentlicheKopfleiste';

/** Ungültiger Abmeldelink (§8.21): Leer-Plakette mit „!“, HTTP 404, Kopfleiste ohne „Anmelden“. */
export default function AbmeldelinkNichtGueltig() {
  return (
    <>
      <OeffentlicheKopfleiste anmeldenHref={null} />
      <main className="mx-auto max-w-[40rem] px-4 py-6 md:px-6">
        <Leerzustand
          art="fehler"
          ebene="h1"
          titel="Dieser Link ist nicht gültig."
          text={
            <p className="text-base text-ink">
              Der Link ist unvollständig oder veraltet. Nach der Anmeldung ändern Sie Ihre Mails unter
              „Benachrichtigungen“.
            </p>
          }
          aktion={
            <Link href="/login?next=/einstellungen/benachrichtigungen" className="btn btn-sekundaer btn-halle">
              Anmelden
            </Link>
          }
        />
      </main>
    </>
  );
}
