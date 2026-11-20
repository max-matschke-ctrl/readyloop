'use client';

import { useEffect, useRef, useState } from 'react';
import { EINSATZORT_LABEL, EINSATZORTE, type Bereich, type Einsatzort } from '@/domain/types';
import { bereichSpeichern } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, useGeprueftesFormular } from './formular';

/** Neu (ohne bereich) oder ändern. Kein Löschen (F-17). */
export function BereichForm({ bereich }: { bereich?: Bereich }) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(bereichSpeichern);
  const [einsatzort, setEinsatzort] = useState<Einsatzort | ''>(bereich?.einsatzort ?? '');
  const praefix = bereich ? `bereich-${bereich.id}` : 'bereich-neu';
  const einsatzortGeaendert = bereich !== undefined && einsatzort !== bereich.einsatzort;
  const formRef = useRef<HTMLFormElement>(null);

  // Neuer Bereich gespeichert: Formular leeren, damit nicht versehentlich doppelt angelegt wird.
  useEffect(() => {
    if (!bereich && state.status === 'ok') formRef.current?.reset();
  }, [bereich, state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="max-w-[40rem] space-y-4">
      <input type="hidden" name="bereichId" value={bereich?.id ?? ''} />
      <FeldGruppe id={`${praefix}-name`} feld="name" label="Name" state={state}>
        {(p) => <input {...p} name="name" type="text" required minLength={2} maxLength={80} defaultValue={bereich?.name} className="feld" />}
      </FeldGruppe>
      <FeldGruppe
        id={`${praefix}-einsatzort`}
        feld="einsatzort"
        label="Einsatzort"
        hilfe="Bestimmt die Fristvorschläge der Geräte in diesem Bereich."
        state={state}
      >
        {(p) => (
          <select
            {...p}
            name="einsatzort"
            required
            defaultValue={bereich?.einsatzort ?? ''}
            onChange={(e) => setEinsatzort(e.currentTarget.value as Einsatzort)}
            className="feld"
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
        )}
      </FeldGruppe>
      {einsatzortGeaendert && (
        <Meldung art="warnung" text="Bereits freigegebene Fristen bleiben; betroffene Prüfarten zeigen danach einen Hinweis.">
          Fristvorschläge der Geräte können sich ändern.
        </Meldung>
      )}
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>{bereich ? 'Änderung speichern' : 'Bereich anlegen'}</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
