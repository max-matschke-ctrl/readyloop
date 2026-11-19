import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MangelForm } from '@/components/MangelForm';
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
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <p className="text-sm">
          <Link href={abbrechen} className="link">
            ← Zurück
          </Link>
        </p>
        <div>
          <h1 className="text-2xl font-bold">Mangel erfassen</h1>
          <dl className="mt-2 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-steel">Gerät</dt>
            <dd>
              {kontext.geraet.bezeichnung}
              <span className="font-mono text-xs text-steel"> · {kontext.geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
            </dd>
            <dt className="text-steel">Bereich</dt>
            <dd>{kontext.bereichName}</dd>
          </dl>
          {kontext.nachweis && (
            <p className="mt-2 text-sm text-steel">
              Der Nachweis ist gespeichert. Erfassen Sie jetzt die festgestellten Mängel – je Befund einen Mangel.
            </p>
          )}
        </div>
        <div className="karte p-4">
          <MangelForm kontext={kontext} zurueck={zurueck} />
        </div>
        {kontext.nachweis && (
          <p className="text-sm">
            <Link href={abbrechen} className="link">
              Später erfassen
            </Link>
            <span className="text-steel"> – die Prüfart zeigt bis dahin einen Hinweis.</span>
          </p>
        )}
      </main>
    </>
  );
}
