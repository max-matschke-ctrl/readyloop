import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { NachweisForm } from '@/components/NachweisForm';
import { StatusAmpel } from '@/components/StatusAmpel';
import { datum } from '@/components/format';
import { erfordereSitzung, heute, holeNachweisKontext } from '@/server/data';

export const metadata: Metadata = { title: 'Nachweis erfassen' };

export default async function NachweisNeuSeite({ params }: { params: Promise<{ pruefartId: string }> }) {
  const sitzung = await erfordereSitzung('nachweis.erfassen');
  const { pruefartId } = await params;
  const kontext = await holeNachweisKontext(pruefartId);
  if (!kontext) notFound();

  const { pruefartAnsicht: ansicht, geraet } = kontext;
  const istPruefer = sitzung.rolle === 'pruefer';
  const zurueck = istPruefer ? '/pruefer' : `/geraete/${geraet.id}`;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istPruefer ? 'pruefer' : 'geraete'} />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <p className="text-sm">
          <Link href={zurueck} className="link">
            ← {istPruefer ? 'Prüfaufgaben' : 'Geräteakte'}
          </Link>
        </p>
        <div>
          <h1 className="text-2xl font-bold">Nachweis erfassen</h1>
          <dl className="mt-2 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-steel">Gerät</dt>
            <dd>
              {geraet.bezeichnung}
              <span className="font-mono text-xs text-steel"> · {geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
            </dd>
            <dt className="text-steel">Bereich</dt>
            <dd>{kontext.bereichName}</dd>
            <dt className="text-steel">Prüfart</dt>
            <dd>{ansicht.pruefart.bezeichnung}</dd>
            <dt className="text-steel">Status</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <StatusAmpel status={ansicht.status.status} kurz />
              <span>
                fällig am <span className="font-mono">{datum(ansicht.status.faelligAm)}</span>
              </span>
            </dd>
          </dl>
        </div>
        <div className="karte p-4">
          <NachweisForm
            geraetPruefartId={ansicht.pruefart.id}
            heute={heute()}
            pruefumfang={ansicht.pruefart.bezeichnung}
            prueferName={sitzung.benutzer.name}
          />
        </div>
      </main>
    </>
  );
}
