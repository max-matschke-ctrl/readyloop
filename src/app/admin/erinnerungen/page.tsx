import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { ErinnerungenNav } from '@/components/ErinnerungenNav';
import { ErinnerungUebersicht } from '@/components/ErinnerungUebersicht';
import { MailModusMeldung } from '@/components/MailModusMeldung';
import { Seitenkopf } from '@/components/Seitenkopf';
import { can } from '@/domain/rechte';
import { erfordereSitzung, listeErinnerungEinstellungen, mailModus } from '@/server/data';

export const metadata: Metadata = { title: 'Erinnerungen' };

/** Übersicht je Bereich (§8.18, F-39, US-39). Nur ADM; andere Rollen → 404 (erfordereSitzung). */
export default async function ErinnerungenSeite() {
  const sitzung = await erfordereSitzung('erinnerung.einstellen');
  const eintraege = await listeErinnerungEinstellungen();
  const modus = mailModus();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="erinnerungen" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Seitenkopf pfad={[]} titel="Erinnerungen" />
          <ErinnerungenNav
            aktiv="einstellungen"
            zeigeEinstellungen
            zeigeVorschau={can(sitzung.rolle, 'mail.vorschau') && modus === 'vorschau'}
          />
        </div>
        <section aria-labelledby="einstellungen-titel" className="space-y-4">
          <h2 id="einstellungen-titel" className="sr-only">
            Einstellungen je Bereich
          </h2>
          <p className="max-w-prose">
            Fristen-Erinnerungen gehen werktags morgens an die Verantwortlichen der Bereiche. Je Bereich legen Sie
            Vorlauf, Eskalation und Empfänger fest.
          </p>
          <MailModusMeldung modus={modus} />
          <ErinnerungUebersicht eintraege={eintraege} />
        </section>
      </main>
    </>
  );
}
