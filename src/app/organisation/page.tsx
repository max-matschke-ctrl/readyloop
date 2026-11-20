import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { OrganisationWahl } from '@/components/OrganisationWahl';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, listeMeineOrganisationen } from '@/server/data';

export const metadata: Metadata = { title: 'Betrieb wählen' };

/** Betriebswahl (§8.3): große Zeilen (56 px) mit Betriebsname und Rolle. */
export default async function OrganisationSeite() {
  const sitzung = await erfordereSitzung();
  const organisationen = await listeMeineOrganisationen();

  return (
    <>
      <AppHeader sitzung={sitzung} />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf
          pfad={[]}
          titel="Betrieb wählen"
          kontext={
            organisationen.length > 1
              ? 'Sie haben Zugang zu mehreren Betrieben. Die Daten bleiben je Betrieb getrennt.'
              : 'Sie haben Zugang zu einem Betrieb.'
          }
        />
        <OrganisationWahl organisationen={organisationen} aktuellId={sitzung.organisation.id} />
      </main>
    </>
  );
}
