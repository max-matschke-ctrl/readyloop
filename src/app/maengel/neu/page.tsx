import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { Meldung } from '@/components/Meldung';
import { PlaketteBestaetigung } from '@/components/PlaketteGlyph';
import { MangelForm } from '@/components/MangelForm';
import { Seitenkopf } from '@/components/Seitenkopf';
import { erfordereSitzung, holeMangelFormular } from '@/server/data';

export const metadata: Metadata = { title: 'Mangel erfassen' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

function einzeln(wert: string | string[] | undefined): string | undefined {
  const v = Array.isArray(wert) ? wert[0] : wert;
  return v && v.trim() !== '' ? v.trim() : undefined;
}

/** Nur relative Pfade als Rücksprung (Server prüft zusätzlich). */
function sichererPfad(wert: string | undefined): string | null {
  return wert && /^\/[a-z0-9/\-?=&]*$/i.test(wert) && !wert.startsWith('//') ? wert : null;
}

export default async function MangelNeuSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('mangel.erfassen');
  const sp = await searchParams;
  const geraetId = einzeln(sp.geraet);
  if (!geraetId) notFound();
  const kontext = await holeMangelFormular(geraetId, {
    geraetPruefartId: einzeln(sp.pruefart),
    nachweisId: einzeln(sp.nachweis),
  });
  if (!kontext) notFound();

  const zurueck = sichererPfad(einzeln(sp.zurueck));
  const abbrechen = zurueck ?? `/geraete/${kontext.geraet.id}`;
  const istPruefer = sitzung.rolle === 'pruefer';

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istPruefer ? 'pruefer' : 'maengel'} />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf
          pfad={
            istPruefer
              ? [{ label: 'Prüfaufgaben', href: '/pruefer' }, { label: 'Mangel erfassen' }]
              : [
                  { label: 'Geräte', href: '/geraete' },
                  { label: kontext.geraet.bezeichnung, href: `/geraete/${kontext.geraet.id}` },
                  { label: 'Mangel erfassen' },
                ]
          }
          titel="Mangel erfassen"
          kontext={
            <>
              {kontext.geraet.bezeichnung} · <span className="font-mono">{kontext.geraet.inventarnummer ?? 'ohne Inventarnummer'}</span> ·{' '}
              {kontext.bereichName}
            </>
          }
        />
        {kontext.nachweis && (
          <Meldung art="erfolg" symbol={<PlaketteBestaetigung />} text="Erfassen Sie jetzt die festgestellten Mängel, je Befund einen. „Später erfassen“ ist möglich, die Prüfart zeigt bis dahin einen Hinweis.">
            Nachweis gespeichert.
          </Meldung>
        )}
        <MangelForm kontext={kontext} zurueck={zurueck} abbrechenHref={abbrechen} />
      </main>
    </>
  );
}
