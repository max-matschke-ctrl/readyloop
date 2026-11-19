import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { OrganisationWahl } from '@/components/OrganisationWahl';
import { erfordereSitzung, listeMeineOrganisationen } from '@/server/data';

export const metadata: Metadata = { title: 'Betrieb wählen' };

export default async function OrganisationSeite() {
  const sitzung = await erfordereSitzung();
  const organisationen = await listeMeineOrganisationen();

  return (
    <>
      <AppHeader sitzung={sitzung} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Betrieb wählen</h1>
          <p className="text-sm text-steel">Sie haben Zugang zu mehreren Betrieben. Die Daten bleiben je Betrieb getrennt.</p>
        </div>
        <OrganisationWahl organisationen={organisationen} aktuellId={sitzung.organisation.id} />
      </main>
    </>
  );
}
