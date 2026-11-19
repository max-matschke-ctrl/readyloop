import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { GeraetAnlegenForm } from '@/components/GeraetAnlegenForm';
import { erfordereSitzung, heute, listeBereiche, listeGeraetegruppen } from '@/server/data';

export const metadata: Metadata = { title: 'Gerät anlegen' };

export default async function GeraetNeuSeite() {
  // Ohne Recht geraet.anlegen: notFound() (in erfordereSitzung).
  const sitzung = await erfordereSitzung('geraet.anlegen');
  const [bereiche, gruppen] = await Promise.all([listeBereiche(), listeGeraetegruppen()]);

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="geraete" />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <p className="text-sm">
          <Link href="/geraete" className="link">
            ← Geräteliste
          </Link>
        </p>
        <h1 className="text-2xl font-bold">Gerät anlegen</h1>
        {bereiche.length === 0 ? (
          <p className="karte px-4 py-6 text-sm">Kein Bereich verfügbar. Ein Admin muss Ihnen zuerst einen Bereich zuordnen.</p>
        ) : (
          <GeraetAnlegenForm bereiche={bereiche} gruppen={gruppen} heute={heute()} />
        )}
      </main>
    </>
  );
}
