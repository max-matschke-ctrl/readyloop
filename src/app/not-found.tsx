import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Leerzustand } from '@/components/Leerzustand';
import { PlaketteGlyph } from '@/components/PlaketteGlyph';
import { holeSitzung } from '@/server/data';

/** §8.11: Leerzustand „Seite nicht gefunden.“ mit Weg je nach Rolle bzw. zur Anmeldung. */
export default async function NichtGefunden() {
  const sitzung = await holeSitzung();
  const ziel = !sitzung
    ? { href: '/login', text: 'Zur Anmeldung' }
    : sitzung.rolle === 'pruefer'
      ? { href: '/pruefer', text: 'Zu den Prüfaufgaben' }
      : { href: '/geraete', text: 'Zur Geräteliste' };

  const inhalt = (
    <Leerzustand
      art="fehler"
      ebene="h1"
      titel="Seite nicht gefunden."
      text="Die Seite existiert nicht oder Sie haben keinen Zugriff darauf."
      aktion={
        <Link href={ziel.href} className="btn btn-sekundaer">
          {ziel.text}
        </Link>
      }
    />
  );

  if (sitzung) {
    return (
      <>
        <AppHeader sitzung={sitzung} />
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 xl:px-8">{inhalt}</main>
      </>
    );
  }
  return (
    <main className="mx-auto w-full max-w-[32rem] px-4 py-10 sm:py-16">
      <p className="mb-6 flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em] text-ink">
        <PlaketteGlyph groesse={24} />
        Readyloop
      </p>
      {inhalt}
    </main>
  );
}
