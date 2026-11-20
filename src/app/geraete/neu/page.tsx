import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { GeraetAnlegenForm } from '@/components/GeraetAnlegenForm';
import { Leerzustand } from '@/components/Leerzustand';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, heute, listeBereiche, listeGeraetegruppen } from '@/server/data';

export const metadata: Metadata = { title: 'Gerät anlegen' };

export default async function GeraetNeuSeite() {
  // Ohne Recht geraet.anlegen: notFound() (in erfordereSitzung).
  const sitzung = await erfordereSitzung('geraet.anlegen');
  const [bereiche, gruppen] = await Promise.all([listeBereiche(), listeGeraetegruppen()]);

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="geraete" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[{ label: 'Geräte', href: '/geraete' }, { label: 'Gerät anlegen' }]}
          titel="Gerät anlegen"
          kontext="Stammdaten erfassen und Prüfarten aus dem Prüfkatalog übernehmen."
        />
        {bereiche.length === 0 ? (
          <Leerzustand
            art="fehler"
            titel="Kein Bereich verfügbar."
            text="Geräte gehören immer zu einem Bereich. Bitten Sie den Admin, Ihnen einen Bereich zuzuordnen."
          />
        ) : (
          <GeraetAnlegenForm bereiche={bereiche} gruppen={gruppen} heute={heute()} />
        )}
      </main>
    </>
  );
}
