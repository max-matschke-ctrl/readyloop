import type { GeraetKurzansicht, MeinGeraet } from '@/domain/types';
import { MaAktionen } from './MaAktionen';
import { NutzungsHinweis } from './NutzungsHinweis';
import { PruefartKurzliste } from './PruefartKurzliste';
import { Pruefplakette } from './Pruefplakette';
import { datum, zeitpunkt } from './format';

interface Props {
  geraet: GeraetKurzansicht | MeinGeraet;
  /** meine: Abschnitte auf /meine-geraete (h3). treffer: Suchergebnis (h2, zusätzlich Bereich). */
  variante: 'meine' | 'treffer';
  /** Rücksprung für „Mangel melden“. */
  zurueck: string;
}

function istMeinGeraet(g: GeraetKurzansicht | MeinGeraet): g is MeinGeraet {
  return 'bezug' in g;
}

/** Zustandszeile (§6.6): nie mit Namen anderer Personen (F-27). */
function zustandText(g: GeraetKurzansicht | MeinGeraet): string | null {
  if (istMeinGeraet(g)) {
    if (g.bezug === 'zugeordnet') return 'Ihnen zugeordnet';
    return g.uebernommenSeit ? `Von Ihnen übernommen seit ${zeitpunkt(g.uebernommenSeit)} Uhr` : 'Von Ihnen übernommen';
  }
  if (g.zugeordnetMir) return 'Ihnen zugeordnet';
  switch (g.uebernahme) {
    case 'von_mir':
      return 'Von Ihnen übernommen';
    case 'von_anderen':
      return 'Wird von einer anderen Person genutzt';
    case 'frei':
      return 'Frei';
    default:
      return null;
  }
}

export function geraetAnker(geraetId: string): string {
  return `geraet-${geraetId}`;
}

/**
 * Gerätekarte Mitarbeiter (§6.19): kompaktes Nutzungsband oben (nur nicht „verwendbar“), Plakette 56,
 * Kennung und Zeilen, Aktionen (MaAktionen), Disclosure „Prüfungen (n)“ – zu bei „verwendbar“, sonst offen.
 * Ab lg Zeilenkarte (Grid 56px 1fr 16rem), Band und Disclosure über die volle Breite.
 */
export function MeinGeraetKarte({ geraet: g, variante, zurueck }: Props) {
  const Titel = variante === 'treffer' ? 'h2' : 'h3';
  const verwendbar = g.nutzung === 'verwendbar';
  const zustand = zustandText(g);
  const anzahlPruefungen = g.pruefarten.length;

  return (
    <li id={geraetAnker(g.geraetId)} className="karte scroll-mt-20 overflow-hidden">
      {!verwendbar && (
        <NutzungsHinweis
          groesse="kompakt"
          nutzung={g.nutzung}
          gesamtStatus={g.gesamtStatus}
          grund={g.gesamtStatusGrund}
          betriebsstatus={g.betriebsstatus}
          naechsteFaelligkeit={g.naechsteFaelligkeit}
        />
      )}

      <div className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-4 p-4 lg:grid-cols-[56px_1fr_16rem] lg:gap-x-6">
        <Pruefplakette status={g.gesamtStatus} faelligAm={g.naechsteFaelligkeit} groesse={56} />

        <div className="min-w-0 space-y-1">
          <Titel className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal text-ink [overflow-wrap:anywhere]">
            {g.bezeichnung}
          </Titel>
          <p className="text-base text-ink">
            {g.inventarnummer && <span className="font-mono tabular-nums">{g.inventarnummer}</span>}
            {variante === 'treffer' && (
              <>
                {g.inventarnummer && <span aria-hidden="true"> · </span>}
                <span className="sr-only">Bereich </span>
                {g.bereichName}
              </>
            )}
          </p>
          {verwendbar && (
            <NutzungsHinweis
              groesse="kompakt"
              nutzung={g.nutzung}
              gesamtStatus={g.gesamtStatus}
              grund={g.gesamtStatusGrund}
              betriebsstatus={g.betriebsstatus}
              naechsteFaelligkeit={g.naechsteFaelligkeit}
              className="py-1"
            />
          )}
          {zustand && <p className="text-sm text-ink">{zustand}</p>}
          <p className="text-base text-ink">
            Nächste Prüfung:{' '}
            {g.naechsteFaelligkeit ? <span className="font-mono tabular-nums">{datum(g.naechsteFaelligkeit)}</span> : 'unbekannt'}
          </p>
          {g.offeneMaengel > 0 && (
            <p className="flex items-center gap-2 text-base text-ink">
              <span
                aria-hidden="true"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-brick bg-brick-50 text-xs text-brick-800"
              >
                ⚠
              </span>
              {g.offeneMaengel === 1 ? '1 offener Mangel gemeldet' : `${g.offeneMaengel} offene Mängel gemeldet`}
            </p>
          )}
        </div>

        <div className="col-span-2 lg:col-span-1 lg:[&_.aktionen-halle]:flex-col lg:[&_.btn]:w-full">
          <MaAktionen key={g.geraetId} kurz={g} zurueck={zurueck} />
        </div>
      </div>

      <details open={!verwendbar} className="group border-t border-steel-200">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-base font-medium text-ink hover:bg-steel-50 [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-steel transition-transform duration-[var(--dauer-mittel)] group-open:rotate-90">
            ▸
          </span>
          Prüfungen ({anzahlPruefungen})
        </summary>
        <div className="px-4 pb-4">
          <PruefartKurzliste pruefarten={g.pruefarten} ebene={variante === 'treffer' ? 'h3' : 'h4'} />
        </div>
      </details>
    </li>
  );
}
