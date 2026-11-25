import { MAIL_ARTEN, MAIL_ART_LABEL, VERSAND_STATUS, VERSAND_STATUS_LABEL, type Bereich, type ProtokollSeite } from '@/domain/types';

interface Props {
  filter: ProtokollSeite['filter'];
  bereiche: Bereich[];
}

/**
 * Filterleiste des Versandprotokolls (§6.9 I3, §8.22): GET-Formular, alle Werte in der URL, ohne JavaScript.
 * Zeitraum, Status (inkl. „Probleme“), Art, Bereich. Kein Filter, keine Suche nach Person (R-45, F-41).
 */
export function ProtokollFilterLeiste({ filter, bereiche }: Props) {
  return (
    <form method="get" action="/erinnerungen/protokoll" className="karte flex flex-wrap items-end gap-x-4 gap-y-3 p-4">
      <div>
        <label htmlFor="filter-von" className="label">
          Von
        </label>
        <input id="filter-von" name="von" type="date" defaultValue={filter.von} className="feld w-40" />
      </div>
      <div>
        <label htmlFor="filter-bis" className="label">
          Bis
        </label>
        <input id="filter-bis" name="bis" type="date" defaultValue={filter.bis} className="feld w-40" />
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="filter-status" className="label">
          Status
        </label>
        <select id="filter-status" name="status" defaultValue={filter.status ?? ''} className="feld sm:w-80">
          <option value="">Alle</option>
          <option value="probleme">Probleme (Fehler, nicht zustellbar, Spam)</option>
          {VERSAND_STATUS.map((s) => (
            <option key={s} value={s}>
              {VERSAND_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="filter-art" className="label">
          Art
        </label>
        <select id="filter-art" name="art" defaultValue={filter.art ?? ''} className="feld sm:w-56">
          <option value="">Alle</option>
          {MAIL_ARTEN.map((a) => (
            <option key={a} value={a}>
              {MAIL_ART_LABEL[a]}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="filter-bereich" className="label">
          Bereich
        </label>
        <select id="filter-bereich" name="bereich" defaultValue={filter.bereichId ?? ''} className="feld sm:w-44">
          <option value="">Alle</option>
          {bereiche.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-sekundaer">
        Filter anwenden
      </button>
    </form>
  );
}
