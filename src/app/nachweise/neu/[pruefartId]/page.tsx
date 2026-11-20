import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { FristAngabe } from '@/components/FristAngabe';
import { NachweisForm } from '@/components/NachweisForm';
import { Pruefplakette } from '@/components/Pruefplakette';
import { Seitenkopf } from '@/components/Seitenkopf';
import { StatusAmpel } from '@/components/StatusAmpel';
import { datum, restTageText } from '@/components/format';
import { can } from '@/domain/rechte';
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
  const pfad = istPruefer
    ? [{ label: 'Prüfaufgaben', href: '/pruefer' }, { label: 'Nachweis erfassen' }]
    : [{ label: 'Geräte', href: '/geraete' }, { label: geraet.bezeichnung, href: zurueck }, { label: 'Nachweis erfassen' }];
  const { status } = ansicht;
  // §10 E-1 (wie PruefartKarte): Vorschlag vorhanden, aber keine Frist freigegeben (Status bleibt 'gbu').
  const nichtFreigegeben = !ansicht.pruefart.frist && ansicht.vorschlag.art !== 'gbu';
  const rest = restTageText(status.restTage);

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istPruefer ? 'pruefer' : 'geraete'} />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf pfad={pfad} titel="Nachweis erfassen" />

        {/* Zusammenfassung (§8.8): Plakette 56, Gerät, Prüfart, fällig am, Frist mit Stufe und Quelle. */}
        <section aria-labelledby="nachweis-geraet" className="karte space-y-3 p-4">
          <div className="flex items-center gap-4">
            <Pruefplakette status={status.status} faelligAm={status.faelligAm} groesse={56} ohneFreigabe={nichtFreigegeben} />
            <div className="min-w-0">
              <h2 id="nachweis-geraet" className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal [overflow-wrap:anywhere]">
                {geraet.bezeichnung}
              </h2>
              <p className="text-sm text-steel">
                <span className="font-mono">{geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, Bereich </span>
                {kontext.bereichName}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-steel-100 pt-3 text-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
            <dt className="text-steel">Prüfart</dt>
            <dd className="[overflow-wrap:anywhere]">{ansicht.pruefart.bezeichnung}</dd>
            <dt className="text-steel">Fällig am</dt>
            <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono tabular-nums">{datum(status.faelligAm)}</span>
              {rest && <span className="text-steel">{rest}</span>}
              {status.status !== 'ok' && (
                <StatusAmpel
                  status={status.status}
                  grund={status.grund}
                  kurz
                  text={nichtFreigegeben && status.status === 'gbu' ? 'Frist nicht freigegeben' : undefined}
                />
              )}
            </dd>
            <dt className="text-steel">Frist</dt>
            <dd className="text-steel">
              <FristAngabe ansicht={ansicht} />
            </dd>
          </dl>
        </section>

        <NachweisForm
          geraetPruefartId={ansicht.pruefart.id}
          heute={heute()}
          pruefumfang={ansicht.pruefart.bezeichnung}
          prueferName={sitzung.benutzer.name}
          mitMaengelHinweis={can(sitzung.rolle, 'mangel.erfassen')}
          abbrechenHref={zurueck}
        />
      </main>
    </>
  );
}
