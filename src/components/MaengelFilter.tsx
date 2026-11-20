'use client';

import Form from 'next/form';
import { MANGEL_SCHWEREN, type Bereich, type MangelSchwere } from '@/domain/types';

interface Props {
  bereiche: Bereich[];
  /** Status aus der Zählerleiste, bleibt als verstecktes Feld erhalten. */
  status?: string;
  bereich?: string;
  schwere?: MangelSchwere;
}

export const SCHWERE_TEXT: Record<MangelSchwere, string> = { gefaehrlich: 'Gefährlich', erheblich: 'Erheblich', gering: 'Gering' };

/** Filterleiste (§6.9) als GET-Formular: Bereich und Schwere. Der Status kommt aus der Zählerleiste. */
export function MaengelFilter({ bereiche, status, bereich, schwere }: Props) {
  const absenden = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  return (
    <Form action="/maengel" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" role="search" aria-label="Mängel filtern">
      {status && <input type="hidden" name="status" value={status} />}
      {bereiche.length > 1 && (
        <div className="sm:w-56">
          <label htmlFor="mf-bereich" className="label">
            Bereich
          </label>
          <select id="mf-bereich" name="bereich" defaultValue={bereich ?? ''} onChange={absenden} className="feld">
            <option value="">Alle Bereiche</option>
            {bereiche.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:w-48">
        <label htmlFor="mf-schwere" className="label">
          Schwere
        </label>
        <select id="mf-schwere" name="schwere" defaultValue={schwere ?? ''} onChange={absenden} className="feld">
          <option value="">Alle</option>
          {MANGEL_SCHWEREN.map((s) => (
            <option key={s} value={s}>
              {SCHWERE_TEXT[s]}
            </option>
          ))}
        </select>
      </div>
      <noscript>
        <button type="submit" className="btn btn-sekundaer">
          Filter anwenden
        </button>
      </noscript>
    </Form>
  );
}
