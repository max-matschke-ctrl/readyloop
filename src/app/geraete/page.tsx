import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { GeraeteFilter } from '@/components/GeraeteFilter';
import { GeraeteTabelle } from '@/components/GeraeteTabelle';
import { StatusZaehler } from '@/components/StatusZaehler';
import { can } from '@/domain/rechte';
import { FRIST_STATUS, type FristStatus, type GeraeteFilter as Filter } from '@/domain/types';
import { erfordereSitzung, listeBereiche, listeGeraete } from '@/server/data';

export const metadata: Metadata = { title: 'Geräte' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

function einzeln(wert: string | string[] | undefined): string | undefined {
  const v = Array.isArray(wert) ? wert[0] : wert;
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function alsStatus(wert: string | undefined): FristStatus | undefined {
  return FRIST_STATUS.find((s) => s === wert);
}

export default async function GeraeteSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('geraet.lesen');
  if (sitzung.rolle === 'pruefer') redirect('/pruefer');

  const sp = await searchParams;
  const bereich = einzeln(sp.bereich);
  const status = alsStatus(einzeln(sp.status));
  const q = einzeln(sp.q);

  const basis: Filter = { bereichId: bereich, suche: q };
  const [bereiche, ohneStatus, geraete] = await Promise.all([
    listeBereiche(),
    listeGeraete(basis),
    status ? listeGeraete({ ...basis, status }) : Promise.resolve(null),
  ]);
  const liste = geraete ?? ohneStatus;

  const zaehler = Object.fromEntries(FRIST_STATUS.map((s) => [s, 0])) as Record<FristStatus, number>;
  for (const g of ohneStatus) zaehler[g.gesamtStatus] += 1;

  const filterAktiv = Boolean(bereich || status || q);

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="geraete" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Geräte</h1>
          {can(sitzung.rolle, 'geraet.anlegen') && (
            <Link href="/geraete/neu" className="btn btn-primaer">
              Gerät anlegen
            </Link>
          )}
        </div>

        <StatusZaehler zaehler={zaehler} gesamt={ohneStatus.length} aktiv={status} params={{ bereich, q }} />

        <GeraeteFilter key={`${bereich}|${status}|${q}`} bereiche={bereiche} bereich={bereich} status={status} q={q} />

        <p className="text-sm text-steel" aria-live="polite">
          {liste.length === 1 ? '1 Gerät' : `${liste.length} Geräte`}
          {filterAktiv && ' (gefiltert)'}
        </p>

        {liste.length > 0 ? (
          <GeraeteTabelle eintraege={liste} />
        ) : (
          <div className="karte px-4 py-8 text-center text-sm">
            {filterAktiv ? (
              <>
                <p>Keine Geräte für diesen Filter.</p>
                <p className="mt-2">
                  <Link href="/geraete" className="link">
                    Filter zurücksetzen
                  </Link>
                </p>
              </>
            ) : (
              <p>Noch keine Geräte erfasst.</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
