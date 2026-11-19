import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MitgliedForm } from '@/components/MitgliedForm';
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
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <p className="text-sm">
          <Link href="/admin/mitglieder" className="link">
            ← Mitglieder
          </Link>
        </p>
        <div>
          <h1 className="text-2xl font-bold">{mitglied.benutzer.name}</h1>
          <p className="text-sm text-steel">
            {ROLLE_LABEL[mitglied.rolle]} · {mitglied.aktiv ? 'aktiv' : 'deaktiviert'}
          </p>
        </div>
        <div className="karte p-4">
          <MitgliedForm key={mitglied.mitgliedschaftId} bereiche={bereiche} mitglied={mitglied} />
        </div>
      </main>
    </>
  );
}
