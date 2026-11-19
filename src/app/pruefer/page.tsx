import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { PrueferAufgabenListe } from '@/components/PrueferAufgabenListe';
import { erfordereSitzung, listePrueferAufgaben } from '@/server/data';

export const metadata: Metadata = { title: 'Prüfaufgaben' };

export default async function PrueferSeite() {
  const sitzung = await erfordereSitzung('pruefaufgaben.lesen');
  const aufgaben = await listePrueferAufgaben();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="pruefer" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Prüfaufgaben</h1>
          <p className="text-sm text-steel">Ihnen zugewiesene Prüfungen bei {sitzung.organisation.name}.</p>
        </div>
        {aufgaben.length === 0 ? (
          <p className="karte px-4 py-6 text-sm">Ihnen sind derzeit keine Prüfungen zugewiesen.</p>
        ) : (
          <PrueferAufgabenListe aufgaben={aufgaben} />
        )}
      </main>
    </>
  );
}
