import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { BereicheTabelle } from '@/components/BereicheTabelle';
import { BereichForm } from '@/components/BereichForm';
import { VerwaltungNav } from '@/components/VerwaltungNav';
import { erfordereSitzung, listeBereicheVerwaltung } from '@/server/data';

export const metadata: Metadata = { title: 'Bereiche' };

export default async function BereicheSeite() {
  const sitzung = await erfordereSitzung('bereich.verwalten');
  const bereiche = await listeBereicheVerwaltung();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold">Verwaltung</h1>
        <VerwaltungNav aktiv="bereiche" />
        <section aria-labelledby="bereiche-titel" className="space-y-3">
          <h2 id="bereiche-titel" className="text-lg font-semibold">
            Bereiche
          </h2>
          <p className="text-sm text-steel">
            Der Einsatzort des Bereichs bestimmt die Fristvorschläge seiner Geräte. Bereiche werden nicht gelöscht.
          </p>
          <BereicheTabelle bereiche={bereiche} />
        </section>
        <section aria-labelledby="bereich-neu-titel" className="karte space-y-3 p-4">
          <h2 id="bereich-neu-titel" className="text-lg font-semibold">
            Bereich anlegen
          </h2>
          <BereichForm />
        </section>
      </main>
    </>
  );
}
