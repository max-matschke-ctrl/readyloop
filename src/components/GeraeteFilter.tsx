'use client';

import Form from 'next/form';
import { FRIST_STATUS, type Bereich, type FristStatus } from '@/domain/types';
import { STATUS_KURZ } from './status';

interface Props {
  bereiche: Bereich[];
  bereich?: string;
  status?: FristStatus;
  q?: string;
}

/** Filter als GET-Formular: Werte landen in der URL (bereich, status, q). */
export function GeraeteFilter({ bereiche, bereich, status, q }: Props) {
  const absenden = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/geraete" className="flex flex-wrap items-end gap-3" role="search" aria-label="Geräte filtern">
      <div className="w-full sm:w-auto">
        <label htmlFor="filter-bereich" className="label">
          Bereich
        </label>
        <select id="filter-bereich" name="bereich" defaultValue={bereich ?? ''} onChange={absenden} className="feld sm:w-48">
          <option value="">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="filter-status" className="label">
          Status
        </label>
        <select id="filter-status" name="status" defaultValue={status ?? ''} onChange={absenden} className="feld sm:w-48">
          <option value="">Alle Status</option>
          {FRIST_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_KURZ[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1 sm:min-w-56">
        <label htmlFor="filter-q" className="label">
          Suche
        </label>
        <input
          id="filter-q"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Bezeichnung, Inventar-, Seriennummer, Hersteller"
          className="feld"
        />
      </div>
      <button type="submit" className="btn btn-sekundaer">
        Filtern
      </button>
    </Form>
  );
}
