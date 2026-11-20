import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Leerzustand } from '@/components/Leerzustand';
import { PlaketteGlyph } from '@/components/PlaketteGlyph';
import { abmelden } from '@/server/actions';
import { holeAnmeldestatus } from '@/server/data';

export const metadata: Metadata = { title: 'Kein Zugang' };
export const dynamic = 'force-dynamic';

/** Kein Zugriff als Leerzustand (§8.2, §6.12): Leer-Plakette mit „!“, Ursache und Weg. */
export default async function KeinZugangSeite() {
  const status = await holeAnmeldestatus();
  if (status !== 'ohne_mitgliedschaft') redirect('/');

  return (
    <main className="mx-auto w-full max-w-[32rem] px-4 py-10 sm:py-16">
      <p className="mb-6 flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em] text-ink">
        <PlaketteGlyph groesse={24} />
        Readyloop
      </p>
      <Leerzustand
        art="fehler"
        ebene="h1"
        titel="Kein Zugriff."
        text="Ihr Konto ist keinem Betrieb zugeordnet. Bitten Sie den Admin Ihres Betriebs um eine Einladung."
        aktion={
          <form action={abmelden}>
            <button type="submit" className="btn btn-sekundaer">
              Abmelden
            </button>
          </form>
        }
      />
    </main>
  );
}
