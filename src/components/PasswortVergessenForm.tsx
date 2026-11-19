'use client';

import { passwortVergessen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

/** Antwort ist immer gleich (keine Kontoaufzählung); nach Erfolg wird das Formular ausgeblendet. */
export function PasswortVergessenForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(passwortVergessen);

  if (state.status === 'ok') return <ActionMeldung state={state} />;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="vergessen-email" className="label">
          E-Mail
        </label>
        <input
          id="vergessen-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          className="feld"
          {...feldProps(state, 'email')}
        />
        <FeldFehler state={state} feld="email" />
      </div>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gesendet …' : 'Link zum Zurücksetzen senden'}
      </button>
    </form>
  );
}
