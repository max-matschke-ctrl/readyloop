'use client';

import Form from 'next/form';
import { MANGEL_SCHWEREN, type Bereich, type MangelFilter, type MangelSchwere } from '@/domain/types';

interface Props {
  bereiche: Bereich[];
  status: NonNullable<MangelFilter['status']>;
  bereich?: string;
  schwere?: MangelSchwere;
}

const SCHWERE_TEXT: Record<MangelSchwere, string> = { gefaehrlich: 'Gefährlich', erheblich: 'Erheblich', gering: 'Gering' };

/** GET-Formular: Werte stehen in der URL (status, bereich, schwere). */
export function MaengelFilter({ bereiche, status, bereich, schwere }: Props) {
  const absenden = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  return (
    <Form action="/maengel" className="flex flex-wrap items-end gap-3" role="search" aria-label="Mängel filtern">
      <div className="w-full sm:w-auto">
        <label htmlFor="mf-status" className="label">
          Status
        </label>
        <select id="mf-status" name="status" defaultValue={status} onChange={absenden} className="feld sm:w-48">
          <option value="offen">Offen und in Bearbeitung</option>
          <option value="behoben">Behoben</option>
          <option value="alle">Alle</option>
        </select>
      </div>
      {bereiche.length > 1 && (
        <div className="w-full sm:w-auto">
          <label htmlFor="mf-bereich" className="label">
            Bereich
          </label>
          <select id="mf-bereich" name="bereich" defaultValue={bereich ?? ''} onChange={absenden} className="feld sm:w-48">
            <option value="">Alle Bereiche</option>
            {bereiche.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="w-full sm:w-auto">
        <label htmlFor="mf-schwere" className="label">
          Schwere
        </label>
        <select id="mf-schwere" name="schwere" defaultValue={schwere ?? ''} onChange={absenden} className="feld sm:w-40">
          <option value="">Alle</option>
          {MANGEL_SCHWEREN.map((s) => (
            <option key={s} value={s}>
              {SCHWERE_TEXT[s]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-sekundaer">
        Filtern
      </button>
    </Form>
  );
}
