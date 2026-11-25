import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { BenachrichtigungKarte } from '@/components/BenachrichtigungKarte';
import { BereichsRegelnListe } from '@/components/BereichsRegelnListe';
import { MailModusMeldung } from '@/components/MailModusMeldung';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, holeEigeneBenachrichtigungen } from '@/server/data';

export const metadata: Metadata = { title: 'Benachrichtigungen' };

/** Eigene Mails (§8.20, F-40, US-40): genau eine Mailart je Rolle, Regeln der Bereiche nur lesend (VER, SIF, ADM). */
export default async function BenachrichtigungenSeite() {
  const sitzung = await erfordereSitzung('benachrichtigung.eigene');
  const daten = await holeEigeneBenachrichtigungen();

  return (
    <>
      <AppHeader sitzung={sitzung} />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf pfad={[]} titel="Benachrichtigungen" kontext={`bei ${daten.organisationName}`} />
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
          <dt className="text-sm text-steel sm:pt-0.5">E-Mail-Adresse</dt>
          <dd>
            <span className="font-mono [overflow-wrap:anywhere]">{daten.email}</span>
            <span className="block text-sm text-steel">Adresse ändern: über den Admin.</span>
          </dd>
        </dl>
        <MailModusMeldung modus={daten.mailModus} />
        <BenachrichtigungKarte benachrichtigung={daten.benachrichtigung} />
        {daten.bereichsRegeln.length > 0 && (
          <section aria-labelledby="regeln-titel" className="space-y-3">
            <h2 id="regeln-titel" className="text-xl font-semibold leading-7 tracking-[-0.01em]">
              Regeln in Ihren Bereichen
            </h2>
            <BereichsRegelnListe regeln={daten.bereichsRegeln} />
            <p className="text-sm text-steel">Ändern kann der Admin unter „Erinnerungen“.</p>
          </section>
        )}
      </main>
    </>
  );
}
