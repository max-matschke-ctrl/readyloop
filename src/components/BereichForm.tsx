'use client';

import { useEffect, useRef, useState } from 'react';
import { EINSATZORT_LABEL, EINSATZORTE, type Bereich, type Einsatzort } from '@/domain/types';
import { bereichSpeichern } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

/** Neu (ohne bereich) oder ändern. Kein Löschen (F-17). */
export function BereichForm({ bereich }: { bereich?: Bereich }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(bereichSpeichern);
  const [einsatzort, setEinsatzort] = useState<Einsatzort | ''>(bereich?.einsatzort ?? '');
  const praefix = bereich ? `bereich-${bereich.id}` : 'bereich-neu';
  const einsatzortGeaendert = bereich !== undefined && einsatzort !== bereich.einsatzort;
  const formRef = useRef<HTMLFormElement>(null);

  // Neuer Bereich gespeichert: Formular leeren, damit nicht versehentlich doppelt angelegt wird.
  useEffect(() => {
    if (!bereich && state.status === 'ok') formRef.current?.reset();
  }, [bereich, state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="bereichId" value={bereich?.id ?? ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${praefix}-name`} className="label">
            Name
          </label>
          <input
            id={`${praefix}-name`}
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            defaultValue={bereich?.name}
            className="feld"
            {...feldProps(state, 'name')}
          />
          <FeldFehler state={state} feld="name" />
        </div>
        <div>
          <label htmlFor={`${praefix}-einsatzort`} className="label">
            Einsatzort
          </label>
          <select
            id={`${praefix}-einsatzort`}
            name="einsatzort"
            required
            defaultValue={bereich?.einsatzort ?? ''}
            onChange={(e) => setEinsatzort(e.currentTarget.value as Einsatzort)}
            className="feld"
            {...feldProps(state, 'einsatzort')}
          >
            {!bereich && (
              <option value="" disabled>
                Bitte wählen
              </option>
            )}
            {EINSATZORTE.map((o) => (
              <option key={o} value={o}>
                {EINSATZORT_LABEL[o]}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="einsatzort" />
        </div>
      </div>
      {einsatzortGeaendert && (
        <p role="note" className="rounded border border-ochre/60 bg-ochre/15 px-3 py-2 text-sm">
          <span aria-hidden="true" className="mr-1 font-bold text-ochre-dunkel">
            !
          </span>
          Fristvorschläge der Geräte können sich ändern. Bereits freigegebene Fristen bleiben; betroffene Prüfarten
          zeigen danach einen Hinweis.
        </p>
      )}
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : bereich ? 'Änderung speichern' : 'Bereich anlegen'}
      </button>
    </form>
  );
}
