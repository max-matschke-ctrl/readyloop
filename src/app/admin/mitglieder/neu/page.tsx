import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { MitgliedForm } from '@/components/MitgliedForm';
import { erfordereSitzung, listeBereiche } from '@/server/data';

export const metadata: Metadata = { title: 'Person einladen' };

export default async function MitgliedNeuSeite() {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  const bereiche = await listeBereiche();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <p className="text-sm">
          <Link href="/admin/mitglieder" className="link">
            ← Mitglieder
          </Link>
        </p>
        <h1 className="text-2xl font-bold">Person einladen</h1>
        <div className="karte p-4">
          <MitgliedForm bereiche={bereiche} />
        </div>
      </main>
    </>
  );
}
