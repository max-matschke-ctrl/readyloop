import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { Leerzustand } from '@/components/Leerzustand';
import { PrueferAufgabenListe } from '@/components/PrueferAufgabenListe';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, listePrueferAufgaben } from '@/server/data';

export const metadata: Metadata = { title: 'Prüfaufgaben' };

export default async function PrueferSeite() {
  const sitzung = await erfordereSitzung('pruefaufgaben.lesen');
  const aufgaben = await listePrueferAufgaben();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="pruefer" />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf pfad={[]} titel="Prüfaufgaben" kontext={`bei ${sitzung.organisation.name}`} />
        {aufgaben.length === 0 ? (
          <Leerzustand
            art="erledigt"
            titel="Keine offenen Prüfungen."
            text="Neue Aufgaben erscheinen hier, sobald ein Betrieb Sie zuweist."
          />
        ) : (
          <PrueferAufgabenListe aufgaben={aufgaben} />
        )}
      </main>
    </>
  );
}
