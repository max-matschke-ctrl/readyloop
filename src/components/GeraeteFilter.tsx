'use client';

import Form from 'next/form';
import { Search } from 'lucide-react';
import type { Bereich, FristStatus } from '@/domain/types';

interface Props {
  bereiche: Bereich[];
  bereich?: string;
  status?: FristStatus;
  q?: string;
}

/**
 * Filterleiste (§6.9) als GET-Formular: Suche und Bereich. Der Status kommt aus der Zählerleiste
 * und bleibt als verstecktes Feld erhalten, damit eine Suche ihn nicht verwirft.
 */
export function GeraeteFilter({ bereiche, bereich, status, q }: Props) {
  const absenden = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <Form
      action="/geraete"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      role="search"
      aria-label="Geräte filtern"
    >
      {status && <input type="hidden" name="status" value={status} />}
      <div className="min-w-0 sm:flex-1 sm:basis-72">
        <label htmlFor="filter-q" className="label">
          Suche
        </label>
        <div className="flex gap-2">
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder="Bezeichnung, Inventar-, Seriennummer, Hersteller"
            className="feld min-h-10 min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-sekundaer shrink-0">
            <Search aria-hidden="true" size={16} strokeWidth={1.75} />
            Suchen
          </button>
        </div>
      </div>
      <div className="sm:w-56">
        <label htmlFor="filter-bereich" className="label">
          Bereich
        </label>
        <select
          id="filter-bereich"
          name="bereich"
          defaultValue={bereich ?? ''}
          onChange={absenden}
          className="feld min-h-10"
        >
          <option value="">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </Form>
  );
}
