import {
  FRIST_QUELLE_LABEL,
  FRIST_QUELLEN,
  PRUEF_ERGEBNIS_LABEL,
  PRUEF_ERGEBNISSE,
  type Ereignis,
  type Id,
} from '@/domain/types';
import { datum, monate, zeitpunkt } from './format';

function obj(wert: unknown): Record<string, unknown> | null {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert) ? (wert as Record<string, unknown>) : null;
}

function text(wert: unknown): string | null {
  return typeof wert === 'string' && wert !== '' ? wert : null;
}

/** Ereignistext aus Typ und (untypisierten) Daten; unbekannte Felder werden ignoriert. */
function beschreibung(e: Ereignis, pruefartNamen: Map<Id, string>): { titel: string; details: string[] } {
  const d = e.daten;
  const pruefartId = text(d.pruefartId) ?? text(d.geraetPruefartId);
  const pruefart = pruefartId ? pruefartNamen.get(pruefartId) : undefined;
  const details: string[] = [];
  if (pruefart) details.push(pruefart);

  switch (e.typ) {
    case 'geraet_angelegt':
      return { titel: 'Gerät angelegt', details };
    case 'frist_freigegeben': {
      const neu = obj(d.neu);
      if (neu) {
        if (typeof neu.monate === 'number') details.push(monate(neu.monate));
        const q = FRIST_QUELLEN.find((x) => x === neu.quelle);
        if (q) details.push(FRIST_QUELLE_LABEL[q]);
        if (text(neu.stufe)) details.push(`Stufe ${neu.stufe as string}`);
        if (text(neu.fundstelle)) details.push(neu.fundstelle as string);
      }
      const alt = obj(d.alt);
      if (alt && typeof alt.monate === 'number') details.push(`vorher ${monate(alt.monate)}`);
      return { titel: alt ? 'Frist geändert' : 'Frist freigegeben', details };
    }
    case 'nachweis_erfasst': {
      if (text(d.pruefdatum)) details.push(`Prüfung vom ${datum(d.pruefdatum as string)}`);
      const erg = PRUEF_ERGEBNISSE.find((x) => x === d.ergebnis);
      if (erg) details.push(PRUEF_ERGEBNIS_LABEL[erg]);
      return { titel: 'Nachweis erfasst', details };
    }
  }
}

export function VerlaufListe({ verlauf, pruefartNamen }: { verlauf: Ereignis[]; pruefartNamen: Map<Id, string> }) {
  if (verlauf.length === 0) return <p className="text-sm text-steel">Keine Ereignisse.</p>;
  return (
    <ol className="karte divide-y divide-steel/15">
      {verlauf.map((e) => {
        const b = beschreibung(e, pruefartNamen);
        return (
          <li key={e.id} className="grid gap-1 px-4 py-2 text-sm sm:grid-cols-[10rem_1fr]">
            <time dateTime={e.zeitpunkt} className="font-mono text-xs text-steel sm:pt-0.5">
              {zeitpunkt(e.zeitpunkt)}
            </time>
            <div>
              <p>
                <span className="font-medium">{b.titel}</span>
                <span className="text-steel"> · {e.akteurName}</span>
              </p>
              {b.details.length > 0 && <p className="text-xs text-steel">{b.details.join(' · ')}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
