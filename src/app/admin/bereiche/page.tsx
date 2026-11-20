import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { BereicheTabelle } from '@/components/BereicheTabelle';
import { BereichForm } from '@/components/BereichForm';
import { Seitenkopf } from '@/components/Seitenkopf';
import { VerwaltungNav } from '@/components/VerwaltungNav';
import { erfordereSitzung, listeBereicheVerwaltung } from '@/server/data';

export const metadata: Metadata = { title: 'Bereiche' };

export default async function BereicheSeite() {
  const sitzung = await erfordereSitzung('bereich.verwalten');
  const bereiche = await listeBereicheVerwaltung();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Seitenkopf pfad={[]} titel="Verwaltung" />
          <VerwaltungNav aktiv="bereiche" />
        </div>
        <section aria-labelledby="bereiche-titel" className="space-y-3">
          <h2 id="bereiche-titel" className="sr-only">
            Bereiche
          </h2>
          <p className="max-w-prose text-sm text-steel">
            Der Einsatzort des Bereichs bestimmt die Fristvorschläge seiner Geräte. Bereiche werden nicht gelöscht.
          </p>
          <BereicheTabelle bereiche={bereiche} />
        </section>
        <section aria-labelledby="bereich-neu-titel" className="space-y-4">
          <h2 id="bereich-neu-titel" className="text-xl font-semibold leading-7">
            Bereich anlegen
          </h2>
          <BereichForm />
        </section>
      </main>
    </>
  );
}
