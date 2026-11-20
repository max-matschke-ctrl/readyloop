import type { Etikett as EtikettDaten } from '@/domain/types';
import { Etikett, type EtikettPlakette } from './Etikett';

export const JE_BOGEN = 24;

interface Props {
  etiketten: EtikettDaten[];
  /** Erstes freies Feld (1–24): leere Felder vorne für angebrochene Bögen (§8.17). */
  start: number;
  plakette?: EtikettPlakette;
}

/** Anzahl der Bögen inklusive leerer Startfelder. */
export function anzahlBoegen(anzahl: number, start: number): number {
  return anzahl === 0 ? 0 : Math.ceil((start - 1 + anzahl) / JE_BOGEN);
}

/** Teilt die Etiketten in Bögen à 24 (je Bogen ein .bogen, Seitenumbruch nach jedem Bogen, §8.17). */
export function EtikettenBogen({ etiketten, start, plakette }: Props) {
  const felder: (EtikettDaten | null)[] = [...Array<null>(start - 1).fill(null), ...etiketten];
  const boegen: (EtikettDaten | null)[][] = [];
  for (let i = 0; i < felder.length; i += JE_BOGEN) boegen.push(felder.slice(i, i + JE_BOGEN));

  return (
    <div className="boegen">
      {boegen.map((bogen, b) => (
        <section key={b} className="bogen" aria-label={`Bogen ${b + 1} von ${boegen.length}`}>
          {bogen.map((e, i) =>
            e ? <Etikett key={e.geraetId} etikett={e} plakette={plakette} /> : <div key={`leer-${i}`} className="etikett etikett-leer" aria-hidden="true" />,
          )}
        </section>
      ))}
    </div>
  );
}
