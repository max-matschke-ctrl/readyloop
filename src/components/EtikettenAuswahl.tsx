import { GERAETE_KATEGORIEN, KATEGORIE_LABEL, type Bereich, type GeraeteKategorie } from '@/domain/types';
import { JE_BOGEN } from './EtikettenBogen';

interface Props {
  bereiche: Bereich[];
  bereichId: string | null;
  kategorie: GeraeteKategorie;
  start: number;
  /** Einzelgerät aus der Akte: Bereich und Kategorie ausgeblendet, nur Startfeld (§8.17). */
  geraetIds: string[];
}

/** Auswahl der Etiketten als GET-Formular (funktioniert ohne JavaScript, URL teilbar). */
export function EtikettenAuswahl({ bereiche, bereichId, kategorie, start, geraetIds }: Props) {
  const einzel = geraetIds.length > 0;
  return (
    <form method="get" action="/etiketten" className="karte flex flex-wrap items-end gap-x-4 gap-y-3 p-4">
      {geraetIds.map((id) => (
        <input key={id} type="hidden" name="geraet" value={id} />
      ))}
      {!einzel && (
        <>
          <div className="min-w-48 flex-1 sm:flex-none">
            <label htmlFor="etiketten-bereich" className="label">
              Bereich
            </label>
            <select id="etiketten-bereich" name="bereich" defaultValue={bereichId ?? ''} className="feld">
              <option value="">Alle Bereiche</option>
              {bereiche.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-48 flex-1 sm:flex-none">
            <label htmlFor="etiketten-kategorie" className="label">
              Kategorie
            </label>
            <select id="etiketten-kategorie" name="kategorie" defaultValue={kategorie} className="feld">
              {GERAETE_KATEGORIEN.map((k) => (
                <option key={k} value={k}>
                  {KATEGORIE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="min-w-48 flex-1 sm:flex-none">
        <label htmlFor="etiketten-start" className="label">
          Erstes freies Feld auf dem Bogen
        </label>
        <select id="etiketten-start" name="start" defaultValue={String(start)} className="feld">
          {Array.from({ length: JE_BOGEN }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? '1 (neuer Bogen)' : n}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-sekundaer">
        Etiketten anzeigen
      </button>
    </form>
  );
}
