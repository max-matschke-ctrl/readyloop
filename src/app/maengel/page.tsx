import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { FilterChips, type FilterChip } from '@/components/FilterChips';
import { Leerzustand } from '@/components/Leerzustand';
import { MaengelFilter, SCHWERE_TEXT } from '@/components/MaengelFilter';
import { MaengelTabelle, type GeraetePlaketten } from '@/components/MaengelTabelle';
import { MaengelZaehler } from '@/components/MaengelZaehler';
import { Seitenkopf } from '@/components/Seitenkopf';
import { MANGEL_SCHWEREN, MANGEL_STATUS, MANGEL_STATUS_LABEL, type MangelSchwere, type MangelStatus } from '@/domain/types';
import { erfordereSitzung, listeBereiche, listeGeraete, listeMaengel } from '@/server/data';

export const metadata: Metadata = { title: 'Mängel' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

function einzeln(wert: string | string[] | undefined): string | undefined {
  const v = Array.isArray(wert) ? wert[0] : wert;
  return v && v.trim() !== '' ? v.trim() : undefined;
}

/** Statusfilter aus der Zählerleiste. Ohne Angabe: unerledigt (offen und in Bearbeitung). */
type StatusWahl = MangelStatus | 'alle' | 'unerledigt';

function alsStatus(wert: string | undefined): StatusWahl {
  if (wert === 'alle') return 'alle';
  return MANGEL_STATUS.find((s) => s === wert) ?? 'unerledigt';
}

function maengelHref(p: { status?: StatusWahl; bereich?: string; schwere?: MangelSchwere }): string {
  const sp = new URLSearchParams();
  if (p.status && p.status !== 'unerledigt') sp.set('status', p.status);
  if (p.bereich) sp.set('bereich', p.bereich);
  if (p.schwere) sp.set('schwere', p.schwere);
  const s = sp.toString();
  return s ? `/maengel?${s}` : '/maengel';
}

export default async function MaengelSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('mangel.lesen');
  const sp = await searchParams;
  const status = alsStatus(einzeln(sp.status));
  const bereich = einzeln(sp.bereich);
  const schwere = MANGEL_SCHWEREN.find((s) => s === einzeln(sp.schwere));

  // Eine Abfrage für Zähler und Liste; der Server prüft Recht und Geltungsbereich.
  const [bereiche, alleMaengel, geraete] = await Promise.all([
    listeBereiche(),
    listeMaengel({ status: 'alle', bereichId: bereich, schwere }),
    listeGeraete(),
  ]);

  const aktiv: MangelStatus[] = status === 'alle' ? [] : status === 'unerledigt' ? ['offen', 'in_bearbeitung'] : [status];
  const maengel = aktiv.length === 0 ? alleMaengel : alleMaengel.filter((m) => aktiv.includes(m.status));
  const zaehler = Object.fromEntries(MANGEL_STATUS.map((s) => [s, 0])) as Record<MangelStatus, number>;
  for (const m of alleMaengel) zaehler[m.status] += 1;
  const ueberschritten = maengel.filter((m) => m.terminUeberschritten).length;

  const plaketten: GeraetePlaketten = Object.fromEntries(
    geraete.map((g) => [g.geraet.id, { status: g.gesamtStatus, faelligAm: g.naechsteFaelligkeit }]),
  );

  const chips: FilterChip[] = [];
  if (status !== 'unerledigt') {
    chips.push({
      name: 'Status',
      wert: status === 'alle' ? 'Alle' : MANGEL_STATUS_LABEL[status],
      entfernenHref: maengelHref({ bereich, schwere }),
    });
  }
  if (bereich) {
    chips.push({
      name: 'Bereich',
      wert: bereiche.find((b) => b.id === bereich)?.name ?? 'unbekannt',
      entfernenHref: maengelHref({ status, schwere }),
    });
  }
  if (schwere) chips.push({ name: 'Schwere', wert: SCHWERE_TEXT[schwere], entfernenHref: maengelHref({ status, bereich }) });

  const istPruefer = sitzung.rolle === 'pruefer';
  const filterAktiv = Boolean(bereich || schwere);

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="maengel" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf
          pfad={[]}
          titel="Mängel"
          kontext={
            istPruefer
              ? 'Mängel an Ihnen zugewiesenen Prüfarten.'
              : 'Neue Mängel erfassen Sie in der Geräteakte oder direkt nach einem Nachweis.'
          }
        />

        <MaengelZaehler
          zaehler={zaehler}
          gesamt={alleMaengel.length}
          aktiv={aktiv}
          hrefFuer={(s) => maengelHref({ status: s, bereich, schwere })}
        />

        <div className="space-y-3">
          <MaengelFilter
            key={`${status}|${bereich}|${schwere}`}
            bereiche={bereiche}
            status={status === 'unerledigt' ? undefined : status}
            bereich={bereich}
            schwere={schwere}
          />
          <FilterChips chips={chips} zuruecksetzenHref="/maengel" />
          <p className="flex flex-wrap gap-x-3 text-sm text-steel" aria-live="polite">
            <span>
              {maengel.length} von {alleMaengel.length} {alleMaengel.length === 1 ? 'Mangel' : 'Mängeln'}
              {status === 'unerledigt' && ' (offen und in Bearbeitung)'}
            </span>
            {ueberschritten > 0 && (
              <span className="font-semibold text-brick">
                <span aria-hidden="true">✕ </span>
                {ueberschritten} mit überschrittener Frist
              </span>
            )}
          </p>
        </div>

        {maengel.length > 0 ? (
          <MaengelTabelle maengel={maengel} plaketten={plaketten} />
        ) : alleMaengel.length > 0 && status !== 'alle' && aktiv.every((s) => s !== 'behoben') ? (
          <Leerzustand
            art="erledigt"
            titel={status === 'in_bearbeitung' ? 'Keine Mängel in Bearbeitung.' : 'Keine offenen Mängel.'}
            text="Behobene Mängel bleiben unter „Behoben“ nachvollziehbar."
          />
        ) : filterAktiv || status !== 'unerledigt' ? (
          <Leerzustand
            art="filter"
            titel="Keine Mängel für diese Filter."
            text="Entfernen Sie einzelne Filter."
            aktion={
              <Link href="/maengel" className="btn btn-sekundaer">
                Filter zurücksetzen
              </Link>
            }
          />
        ) : (
          <Leerzustand art="erledigt" titel="Keine offenen Mängel." text="Mängel erscheinen hier, sobald sie erfasst werden." />
        )}
      </main>
    </>
  );
}
