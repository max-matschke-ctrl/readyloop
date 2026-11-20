import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { MitgliederTabelle } from '@/components/MitgliederTabelle';
import { Seitenkopf } from '@/components/Seitenkopf';
import { VerwaltungNav } from '@/components/VerwaltungNav';
import { erfordereSitzung, listeMitglieder } from '@/server/data';

export const metadata: Metadata = { title: 'Mitglieder' };

export default async function MitgliederSeite() {
  const sitzung = await erfordereSitzung('mitglied.verwalten');
  const mitglieder = await listeMitglieder();
  const aktiv = mitglieder.filter((m) => m.aktiv).length;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="verwaltung" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Seitenkopf
            pfad={[]}
            titel="Verwaltung"
            aktion={
              <Link href="/admin/mitglieder/neu" className="btn btn-primaer">
                Person einladen
              </Link>
            }
          />
          <VerwaltungNav aktiv="mitglieder" />
        </div>
        <section aria-labelledby="mitglieder-titel" className="space-y-3">
          <h2 id="mitglieder-titel" className="sr-only">
            Mitglieder
          </h2>
          <p className="text-sm text-steel" aria-live="polite">
            {mitglieder.length} {mitglieder.length === 1 ? 'Mitglied' : 'Mitglieder'}, davon {aktiv} aktiv
          </p>
          <MitgliederTabelle mitglieder={mitglieder} />
        </section>
      </main>
    </>
  );
}
