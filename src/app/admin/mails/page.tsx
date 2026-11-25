import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { ErinnerungenNav } from '@/components/ErinnerungenNav';
import { ErinnerungslaufForm } from '@/components/ErinnerungslaufForm';
import { MailModusMeldung } from '@/components/MailModusMeldung';
import { MailVorschauListe, type VorschauAnsicht } from '@/components/MailVorschauListe';
import { MailVorschauRahmen } from '@/components/MailVorschauRahmen';
import { Seitenkopf } from '@/components/Seitenkopf';
import { can } from '@/domain/rechte';
import { erfordereSitzung, holeMailVorschau } from '@/server/data';

export const metadata: Metadata = { title: 'Mail-Vorschau' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

function einzeln(wert: string | string[] | undefined): string | undefined {
  return Array.isArray(wert) ? wert[0] : wert;
}

/**
 * Mail-Vorschau (§8.23, F-37, US-42): nur ADM und nur im Modus „vorschau“ (sonst 404 über holeMailVorschau).
 * Ohne Auswahl ist die neueste Mail gewählt.
 */
export default async function MailVorschauSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('mail.vorschau');
  const vorschau = await holeMailVorschau();
  const sp = await searchParams;
  const ansicht: VorschauAnsicht = einzeln(sp.ansicht) === 'text' ? 'text' : 'html';
  const gewaehlt = vorschau.mails.find((m) => m.id === einzeln(sp.mail)) ?? vorschau.mails[0] ?? null;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="erinnerungen" />
      <main className="mx-auto max-w-[80rem] space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Seitenkopf pfad={[]} titel="Mail-Vorschau" />
          <ErinnerungenNav aktiv="vorschau" zeigeEinstellungen={can(sitzung.rolle, 'erinnerung.einstellen')} zeigeVorschau />
        </div>
        <MailModusMeldung modus="vorschau" mitVorschau />
        <ErinnerungslaufForm heute={vorschau.heute} datumWaehlbar={vorschau.datumWaehlbar} />
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
          <MailVorschauListe mails={vorschau.mails} gewaehltId={gewaehlt?.id ?? null} ansicht={ansicht} />
          {gewaehlt && <MailVorschauRahmen mail={gewaehlt} ansicht={ansicht} />}
        </div>
      </main>
    </>
  );
}
