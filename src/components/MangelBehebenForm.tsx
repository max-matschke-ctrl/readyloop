'use client';

import type { IsoDate } from '@/domain/types';
import { mangelBeheben } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

interface Props {
  mangelId: string;
  heute: IsoDate;
  /** Frühestes Behebungsdatum (Erfassungsdatum). */
  fruehestens: IsoDate;
}

/** F-14: → behoben. Endgültig, kein Rückweg. */
export function MangelBehebenForm({ mangelId, heute, fruehestens }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(mangelBeheben);
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="mangelId" value={mangelId} />
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="beheben-am" className="label">
            Behoben am
          </label>
          <input
            id="beheben-am"
            name="behobenAm"
            type="date"
            required
            min={fruehestens}
            max={heute}
            defaultValue={heute}
            className="feld font-mono"
            {...feldProps(state, 'behobenAm')}
          />
          <FeldFehler state={state} feld="behobenAm" />
        </div>
        <div>
          <label htmlFor="beheben-durch" className="label">
            Behoben durch (Person oder Firma)
          </label>
          <input
            id="beheben-durch"
            name="behobenDurch"
            type="text"
            required
            minLength={2}
            maxLength={120}
            className="feld"
            {...feldProps(state, 'behobenDurch')}
          />
          <FeldFehler state={state} feld="behobenDurch" />
        </div>
      </div>
      <div>
        <label htmlFor="beheben-massnahme" className="label">
          Maßnahme
        </label>
        <textarea
          id="beheben-massnahme"
          name="behebung"
          rows={2}
          required
          minLength={5}
          maxLength={1000}
          className="feld"
          {...feldProps(state, 'behebung')}
        />
        <FeldFehler state={state} feld="behebung" />
      </div>
      <p className="text-xs text-steel">Die Behebung ist endgültig. Ein neuer Befund wird als neuer Mangel erfasst.</p>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : 'Als behoben speichern'}
      </button>
    </form>
  );
}
