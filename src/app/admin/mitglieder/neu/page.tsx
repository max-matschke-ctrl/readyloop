import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { MitgliedForm } from '@/components/MitgliedForm';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, listeBereiche } from '@/server/data';

export const metadata: Metadata = { title: 'Person einladen' };

export default async function MitgliedNeuSeite() {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  const bereiche = await listeBereiche();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[
            { label: 'Verwaltung', href: '/admin/mitglieder' },
            { label: 'Mitglieder', href: '/admin/mitglieder' },
            { label: 'Person einladen' },
          ]}
          titel="Person einladen"
          kontext={`Zugang zu ${sitzung.organisation.name}.`}
        />
        <MitgliedForm bereiche={bereiche} />
      </main>
    </>
  );
}
