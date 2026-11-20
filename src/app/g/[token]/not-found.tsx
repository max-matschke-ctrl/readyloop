import Link from 'next/link';
import { Leerzustand } from '@/components/Leerzustand';
import { OeffentlicheKopfleiste } from '@/components/OeffentlicheKopfleiste';

/**
 * Ungültiger Aufkleber (§8.12): eine Seite für falsch, unbekannt und ersetzt (keine Unterscheidung), HTTP 404.
 */
export default function AufkleberNichtGueltig() {
  return (
    <>
      <OeffentlicheKopfleiste />
      <main className="mx-auto max-w-[40rem] px-4 py-6 md:px-6">
        <Leerzustand
          art="fehler"
          ebene="h1"
          groesse={96}
          titel="Dieser Aufkleber ist nicht gültig."
          text={
            <p className="text-base text-ink">
              Der Aufkleber wurde ersetzt oder ist nicht mehr lesbar. Benutzen Sie das Gerät erst, wenn der
              Verantwortliche den Prüfstatus bestätigt hat.
            </p>
          }
          aktion={
            <Link href="/meine-geraete/suchen" className="btn btn-sekundaer btn-halle">
              Gerät suchen
            </Link>
          }
        />
      </main>
    </>
  );
}
