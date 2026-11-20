import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { FilterChips, type FilterChip } from '@/components/FilterChips';
import { GeraeteFilter } from '@/components/GeraeteFilter';
import { GeraeteTabelle } from '@/components/GeraeteTabelle';
import { Leerzustand } from '@/components/Leerzustand';
import { Seitenkopf } from '@/components/Seitenkopf';
import { StatusZaehler } from '@/components/StatusZaehler';
import { STATUS_KURZ } from '@/components/status';
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

function geraeteHref(p: { bereich?: string; status?: FristStatus; q?: string }): string {
  const sp = new URLSearchParams();
  if (p.bereich) sp.set('bereich', p.bereich);
  if (p.status) sp.set('status', p.status);
  if (p.q) sp.set('q', p.q);
  const s = sp.toString();
  return s ? `/geraete?${s}` : '/geraete';
}

export default async function GeraeteSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('geraet.lesen');
  if (sitzung.rolle === 'pruefer') redirect('/pruefer');

  const sp = await searchParams;
  const bereich = einzeln(sp.bereich);
  const status = alsStatus(einzeln(sp.status));
  const q = einzeln(sp.q);

  const basis: Filter = { bereichId: bereich, suche: q };
  const basisGefiltert = Boolean(bereich || q);
  const [bereiche, alle, ohneStatusGefiltert, geraete] = await Promise.all([
    listeBereiche(),
    listeGeraete(),
    basisGefiltert ? listeGeraete(basis) : Promise.resolve(null),
    status ? listeGeraete({ ...basis, status }) : Promise.resolve(null),
  ]);
  const ohneStatus = ohneStatusGefiltert ?? alle;
  const liste = geraete ?? ohneStatus;

  const zaehler = Object.fromEntries(FRIST_STATUS.map((s) => [s, 0])) as Record<FristStatus, number>;
  for (const g of ohneStatus) zaehler[g.gesamtStatus] += 1;

  const darfAnlegen = can(sitzung.rolle, 'geraet.anlegen');
  const filterAktiv = Boolean(bereich || status || q);

  const chips: FilterChip[] = [];
  if (status) chips.push({ name: 'Status', wert: STATUS_KURZ[status], entfernenHref: geraeteHref({ bereich, q }) });
  if (bereich) {
    const name = bereiche.find((b) => b.id === bereich)?.name ?? 'unbekannt';
    chips.push({ name: 'Bereich', wert: name, entfernenHref: geraeteHref({ status, q }) });
  }
  if (q) chips.push({ name: 'Suche', wert: q, entfernenHref: geraeteHref({ bereich, status }) });

  const gesamt = alle.length;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="geraete" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[]}
          titel="Geräte"
          aktion={
            darfAnlegen && (
              <Link href="/geraete/neu" className="btn btn-primaer">
                Gerät anlegen
              </Link>
            )
          }
        />

        <StatusZaehler zaehler={zaehler} gesamt={ohneStatus.length} aktiv={status} params={{ bereich, q }} />

        <div className="space-y-3">
          <GeraeteFilter key={`${bereich}|${status}|${q}`} bereiche={bereiche} bereich={bereich} status={status} q={q} />
          <FilterChips chips={chips} zuruecksetzenHref="/geraete" />
          <p className="text-sm text-steel" aria-live="polite">
            {liste.length} von {gesamt} {gesamt === 1 ? 'Gerät' : 'Geräten'}
          </p>
        </div>

        {liste.length > 0 ? (
          <GeraeteTabelle eintraege={liste} />
        ) : gesamt === 0 || !filterAktiv ? (
          <Leerzustand
            art="leer"
            titel="Noch keine Geräte erfasst."
            text={
              darfAnlegen
                ? 'Legen Sie das erste Arbeitsmittel an. Fristen schlägt Readyloop aus dem Prüfkatalog vor.'
                : 'Geräte legt der Verantwortliche des Bereichs an.'
            }
            aktion={
              darfAnlegen && (
                <Link href="/geraete/neu" className="btn btn-primaer">
                  Gerät anlegen
                </Link>
              )
            }
          />
        ) : (
          <Leerzustand
            art="filter"
            titel="Keine Geräte für diese Filter."
            text="Entfernen Sie einzelne Filter oder ändern Sie die Suche."
            aktion={
              <Link href="/geraete" className="btn btn-sekundaer">
                Filter zurücksetzen
              </Link>
            }
          />
        )}
      </main>
    </>
  );
}
