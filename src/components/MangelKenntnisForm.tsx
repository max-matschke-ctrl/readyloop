'use client';

import type { IsoDate, PersonOption } from '@/domain/types';
import { mangelKenntnisNehmen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

interface Props {
  mangelId: string;
  verantwortliche: PersonOption[];
  vorbelegtVerantwortlich: string | null;
  termin: IsoDate;
  heute: IsoDate;
}

/** F-14: offen → in_bearbeitung; Verantwortlicher und Termin festlegen. Name und Zeitpunkt stempelt der Server. */
export function MangelKenntnisForm({ mangelId, verantwortliche, vorbelegtVerantwortlich, termin, heute }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(mangelKenntnisNehmen);
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="mangelId" value={mangelId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="kenntnis-verantwortlich" className="label">
            Verantwortlich
          </label>
          <select
            id="kenntnis-verantwortlich"
            name="verantwortlichId"
            required
            defaultValue={vorbelegtVerantwortlich ?? ''}
            className="feld"
            {...feldProps(state, 'verantwortlichId')}
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            {verantwortliche.map((p) => (
              <option key={p.benutzerId} value={p.benutzerId}>
                {p.name}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="verantwortlichId" />
        </div>
        <div>
          <label htmlFor="kenntnis-termin" className="label">
            Termin
          </label>
          <input
            id="kenntnis-termin"
            name="termin"
            type="date"
            required
            min={heute}
            defaultValue={termin < heute ? heute : termin}
            className="feld font-mono"
            {...feldProps(state, 'termin')}
          />
          <FeldFehler state={state} feld="termin" />
        </div>
      </div>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : 'Zur Kenntnis nehmen'}
      </button>
    </form>
  );
}
