'use client';

import { ANLASS_ART_LABEL, ANLASS_ARTEN, type IsoDate } from '@/domain/types';
import { anlassAufheben, anlassErfassen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, fehlerId, useFormularAction } from './formular';

interface Props {
  geraetId: string;
  pruefarten: { id: string; bezeichnung: string }[];
  heute: IsoDate;
}

/** F-10: Anlass für 1..n Prüfarten; Datum ≤ heute; Beschreibung Pflicht. */
export function AnlassForm({ geraetId, pruefarten, heute }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(anlassErfassen);
  const id = (n: string) => `anlass-${n}-${geraetId}`;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="geraetId" value={geraetId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <div>
          <label htmlFor={id('art')} className="label">
            Anlass
          </label>
          <select id={id('art')} name="art" required defaultValue="" className="feld" {...feldProps(state, 'art')}>
            <option value="" disabled>
              Bitte wählen
            </option>
            {ANLASS_ARTEN.map((a) => (
              <option key={a} value={a}>
                {ANLASS_ART_LABEL[a]}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="art" />
        </div>
        <div>
          <label htmlFor={id('datum')} className="label">
            Datum
          </label>
          <input
            id={id('datum')}
            name="datum"
            type="date"
            required
            defaultValue={heute}
            max={heute}
            className="feld font-mono"
            {...feldProps(state, 'datum')}
          />
          <FeldFehler state={state} feld="datum" />
        </div>
      </div>
      <div>
        <label htmlFor={id('beschreibung')} className="label">
          Beschreibung
        </label>
        <textarea
          id={id('beschreibung')}
          name="beschreibung"
          rows={2}
          required
          minLength={5}
          maxLength={1000}
          placeholder="Was ist passiert?"
          className="feld"
          {...feldProps(state, 'beschreibung')}
        />
        <FeldFehler state={state} feld="beschreibung" />
      </div>
      <fieldset aria-describedby={state.feldfehler?.geraetPruefartIds?.length ? fehlerId('geraetPruefartIds') : undefined}>
        <legend className="label">Betroffene Prüfarten</legend>
        <ul className="grid gap-1 sm:grid-cols-2">
          {pruefarten.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="geraetPruefartIds" value={p.id} defaultChecked={pruefarten.length === 1} className="size-4" />
                {p.bezeichnung}
              </label>
            </li>
          ))}
        </ul>
        <FeldFehler state={state} feld="geraetPruefartIds" />
      </fieldset>
      <p className="text-xs text-steel">
        Die gewählten Prüfarten stehen danach auf „Vor Nutzung prüfen – nicht verwenden“, bis ein bestandener Nachweis
        vorliegt.
      </p>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : 'Anlass erfassen'}
      </button>
    </form>
  );
}

/** Q-25: Aufheben mit Begründung ≥ 10 Zeichen; bleibt im Verlauf sichtbar. */
export function AnlassAufhebenForm({ anlassId }: { anlassId: string }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(anlassAufheben);
  const feld = `aufheben-grund-${anlassId}`;
  return (
    <details>
      <summary className="link w-fit cursor-pointer text-xs">Aufheben</summary>
      <form action={formAction} onSubmit={onSubmit} className="mt-2 space-y-2" noValidate>
        <input type="hidden" name="anlassId" value={anlassId} />
        <label htmlFor={feld} className="label">
          Begründung (mindestens 10 Zeichen)
        </label>
        <input id={feld} name="grund" type="text" required minLength={10} maxLength={500} className="feld" {...feldProps(state, 'grund')} />
        <FeldFehler state={state} feld="grund" />
        <ActionMeldung state={state} />
        <button type="submit" className="btn btn-sekundaer" disabled={pending}>
          {pending ? 'Wird gespeichert …' : 'Anlass aufheben'}
        </button>
      </form>
    </details>
  );
}
