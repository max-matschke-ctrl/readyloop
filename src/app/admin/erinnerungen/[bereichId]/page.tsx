import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ErinnerungEinstellungForm } from '@/components/ErinnerungEinstellungForm';
import { EinstellungStand } from '@/components/ErinnerungUebersicht';
import { MailModusMeldung } from '@/components/MailModusMeldung';
import { Meldung } from '@/components/Meldung';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, holeErinnerungEinstellung, mailModus } from '@/server/data';

export const metadata: Metadata = { title: 'Erinnerungen je Bereich' };

type Params = Promise<{ bereichId: string }>;

/** Einstellungen je Bereich (§8.19, F-39, US-39). Nur ADM; unbekannter Bereich oder andere Rolle → 404. */
export default async function ErinnerungBereichSeite({ params }: { params: Params }) {
  const sitzung = await erfordereSitzung('erinnerung.einstellen');
  const { bereichId } = await params;
  const ansicht = await holeErinnerungEinstellung(bereichId);
  if (!ansicht) notFound();
  const modus = mailModus();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="erinnerungen" />
      <main className="mx-auto max-w-[48rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf
          pfad={[{ label: 'Erinnerungen', href: '/admin/erinnerungen' }, { label: ansicht.bereich.name }]}
          titel={`Erinnerungen für ${ansicht.bereich.name}`}
          kontext={<EinstellungStand einstellung={ansicht.einstellung} />}
        />
        {(ansicht.warnungen.length > 0 || modus === 'aus') && (
          <div className="space-y-2">
            <MailModusMeldung modus={modus} />
            {ansicht.warnungen.map((w) => (
              <Meldung key={w} art="warnung">
                {w}
              </Meldung>
            ))}
          </div>
        )}
        <ErinnerungEinstellungForm ansicht={ansicht} />
      </main>
    </>
  );
}
