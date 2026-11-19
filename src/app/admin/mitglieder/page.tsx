import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { MitgliederTabelle } from '@/components/MitgliederTabelle';
import { VerwaltungNav } from '@/components/VerwaltungNav';
import { erfordereSitzung, listeMitglieder } from '@/server/data';

export const metadata: Metadata = { title: 'Mitglieder' };

export default async function MitgliederSeite() {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  const mitglieder = await listeMitglieder();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold">Verwaltung</h1>
        <VerwaltungNav aktiv="mitglieder" />
        <section aria-labelledby="mitglieder-titel" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="mitglieder-titel" className="text-lg font-semibold">
              Mitglieder
            </h2>
            <Link href="/admin/mitglieder/neu" className="btn btn-primaer">
              Person einladen
            </Link>
          </div>
          <MitgliederTabelle mitglieder={mitglieder} />
        </section>
      </main>
    </>
  );
}
