'use client';

import { PASSWORT_MIN } from '@/domain/schemas';
import { passwortSetzen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

export function PasswortNeuForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(passwortSetzen);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="pw-neu" className="label">
          Neues Passwort
        </label>
        <input
          id="pw-neu"
          name="passwort"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORT_MIN}
          maxLength={72}
          required
          className="feld"
          {...feldProps(state, 'passwort')}
          aria-describedby={['pw-neu-hinweis', feldProps(state, 'passwort')['aria-describedby']].filter(Boolean).join(' ')}
        />
        <p id="pw-neu-hinweis" className="mt-1 text-xs text-steel">
          Mindestens {PASSWORT_MIN} Zeichen.
        </p>
        <FeldFehler state={state} feld="passwort" />
      </div>
      <div>
        <label htmlFor="pw-wdh" className="label">
          Passwort wiederholen
        </label>
        <input
          id="pw-wdh"
          name="passwortWiederholung"
          type="password"
          autoComplete="new-password"
          required
          className="feld"
          {...feldProps(state, 'passwortWiederholung')}
        />
        <FeldFehler state={state} feld="passwortWiederholung" />
      </div>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : 'Passwort speichern'}
      </button>
    </form>
  );
}
