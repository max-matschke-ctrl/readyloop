import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { MitarbeiterEinladenForm } from '@/components/MitarbeiterEinladenForm';
import { MitarbeiterTabelle } from '@/components/MitarbeiterTabelle';
import { Seitenkopf } from '@/components/Seitenkopf';
import { can } from '@/domain/rechte';
import { erfordereSitzung, listeMitarbeiter } from '@/server/data';

export const metadata: Metadata = { title: 'Mitarbeiter' };
export const dynamic = 'force-dynamic';

/** Mitarbeiter einladen (US-27, F-20): Verantwortliche und Admin. Deaktivieren nur in der Verwaltung (Admin). */
export default async function MitarbeiterSeite() {
  const sitzung = await erfordereSitzung('mitarbeiter.einladen');
  const mitarbeiter = await listeMitarbeiter();
  const istAdmin = can(sitzung.rolle, 'mitglied.verwalten');
  const aktiv = mitarbeiter.filter((m) => m.aktiv).length;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istAdmin ? 'verwaltung' : 'mitarbeiter'} />
      <main className="mx-auto max-w-[72rem] space-y-8 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[]}
          titel="Mitarbeiter"
          kontext="Mitarbeiter sehen ihre Geräte, übernehmen wechselnde Geräte und melden Mängel."
        />

        <section aria-labelledby="einladen-titel" className="space-y-3">
          <h2 id="einladen-titel" className="text-xl font-semibold leading-7">
            Mitarbeiter einladen
          </h2>
          <MitarbeiterEinladenForm />
        </section>

        <section aria-labelledby="liste-titel" className="space-y-3">
          <h2 id="liste-titel" className="text-xl font-semibold leading-7">
            Eingeladene Mitarbeiter
          </h2>
          <p className="text-sm text-steel" aria-live="polite">
            {mitarbeiter.length} Mitarbeiter, davon {aktiv} aktiv
            {!istAdmin && '. Deaktivieren übernimmt der Admin.'}
          </p>
          <MitarbeiterTabelle mitarbeiter={mitarbeiter} />
        </section>
      </main>
    </>
  );
}
