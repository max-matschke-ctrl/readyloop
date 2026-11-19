import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { MaengelFilter } from '@/components/MaengelFilter';
import { MaengelTabelle } from '@/components/MaengelTabelle';
import { MANGEL_SCHWEREN, type MangelFilter } from '@/domain/types';
import { erfordereSitzung, listeBereiche, listeMaengel } from '@/server/data';

export const metadata: Metadata = { title: 'Mängel' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

function einzeln(wert: string | string[] | undefined): string | undefined {
  const v = Array.isArray(wert) ? wert[0] : wert;
  return v && v.trim() !== '' ? v.trim() : undefined;
}

const STATUS_WERTE = ['offen', 'behoben', 'alle'] as const;

export default async function MaengelSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('mangel.lesen');
  const sp = await searchParams;
  const status = STATUS_WERTE.find((s) => s === einzeln(sp.status)) ?? 'offen';
  const bereich = einzeln(sp.bereich);
  const schwere = MANGEL_SCHWEREN.find((s) => s === einzeln(sp.schwere));

  const filter: MangelFilter = { status, bereichId: bereich, schwere };
  const [bereiche, maengel] = await Promise.all([listeBereiche(), listeMaengel(filter)]);
  const ueberschritten = maengel.filter((m) => m.terminUeberschritten).length;
  const istPruefer = sitzung.rolle === 'pruefer';

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="maengel" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Mängel</h1>
          <p className="text-sm text-steel">
            {istPruefer
              ? 'Mängel an Ihnen zugewiesenen Prüfarten.'
              : 'Neue Mängel erfassen Sie in der Geräteakte oder direkt nach einem Nachweis.'}
          </p>
        </div>

        <MaengelFilter key={`${status}|${bereich}|${schwere}`} bereiche={bereiche} status={status} bereich={bereich} schwere={schwere} />

        <p className="text-sm text-steel" aria-live="polite">
          {maengel.length === 1 ? '1 Mangel' : `${maengel.length} Mängel`}
          {ueberschritten > 0 && (
            <span className="ml-2 font-semibold text-brick">
              <span aria-hidden="true">✕ </span>
              {ueberschritten} mit überschrittenem Termin
            </span>
          )}
        </p>

        {maengel.length > 0 ? (
          <MaengelTabelle maengel={maengel} />
        ) : (
          <div className="karte px-4 py-8 text-center text-sm">
            <p>{status === 'offen' ? 'Keine offenen Mängel.' : 'Keine Mängel für diesen Filter.'}</p>
            {(bereich || schwere || status !== 'offen') && (
              <p className="mt-2">
                <Link href="/maengel" className="link">
                  Filter zurücksetzen
                </Link>
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
