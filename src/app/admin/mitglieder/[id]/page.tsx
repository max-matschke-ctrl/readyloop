import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MitgliedForm } from '@/components/MitgliedForm';
import { ZugangMarke } from '@/components/MitgliederTabelle';
import { Seitenkopf } from '@/components/Seitenkopf';
import { ROLLE_LABEL } from '@/domain/types';
import { erfordereSitzung, holeMitglied, listeBereiche } from '@/server/data';

export const metadata: Metadata = { title: 'Mitglied' };

export default async function MitgliedSeite({ params }: { params: Promise<{ id: string }> }) {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  const { id } = await params;
  const [mitglied, bereiche] = await Promise.all([holeMitglied(id), listeBereiche()]);
  if (!mitglied) notFound();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[
            { label: 'Verwaltung', href: '/admin/mitglieder' },
            { label: 'Mitglieder', href: '/admin/mitglieder' },
            { label: mitglied.benutzer.name },
          ]}
          titel={mitglied.benutzer.name}
          kontext={
            <span className="flex flex-wrap items-center gap-2">
              {ROLLE_LABEL[mitglied.rolle]}
              <ZugangMarke aktiv={mitglied.aktiv} />
            </span>
          }
        />
        <MitgliedForm key={mitglied.mitgliedschaftId} bereiche={bereiche} mitglied={mitglied} />
      </main>
    </>
  );
}
