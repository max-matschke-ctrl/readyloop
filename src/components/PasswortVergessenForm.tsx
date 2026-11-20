'use client';

import { passwortVergessen } from '@/server/actions';
import { AbsendenButton, ActionMeldung, FeldGruppe, useFormularAction } from './formular';

/** Antwort ist immer gleich (keine Kontoaufzählung); nach Erfolg wird das Formular ausgeblendet. */
export function PasswortVergessenForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(passwortVergessen);

  if (state.status === 'ok') return <ActionMeldung state={state} />;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FeldGruppe id="vergessen-email" feld="email" label="E-Mail" state={state}>
        {(p) => <input {...p} name="email" type="email" autoComplete="username" inputMode="email" required className="feld" />}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <AbsendenButton pending={pending}>Link zum Zurücksetzen senden</AbsendenButton>
    </form>
  );
}
