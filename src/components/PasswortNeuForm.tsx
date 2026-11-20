'use client';

import { PASSWORT_MIN } from '@/domain/schemas';
import { passwortSetzen } from '@/server/actions';
import { AbsendenButton, ActionMeldung, FeldGruppe, Fehleruebersicht, useFormularAction } from './formular';

export function PasswortNeuForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(passwortSetzen);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <Fehleruebersicht
        state={state}
        felder={{ passwort: { id: 'pw-neu', label: 'Neues Passwort' }, passwortWiederholung: { id: 'pw-wdh', label: 'Passwort wiederholen' } }}
      />
      <FeldGruppe id="pw-neu" feld="passwort" label="Neues Passwort" hilfe={`Mindestens ${PASSWORT_MIN} Zeichen.`} state={state}>
        {(p) => <input {...p} name="passwort" type="password" autoComplete="new-password" minLength={PASSWORT_MIN} maxLength={72} required className="feld" />}
      </FeldGruppe>
      <FeldGruppe id="pw-wdh" feld="passwortWiederholung" label="Passwort wiederholen" state={state}>
        {(p) => <input {...p} name="passwortWiederholung" type="password" autoComplete="new-password" required className="feld" />}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <AbsendenButton pending={pending}>Passwort speichern</AbsendenButton>
    </form>
  );
}
