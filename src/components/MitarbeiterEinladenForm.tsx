'use client';

import { useEffect, useRef } from 'react';
import { mitarbeiterEinladen } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, Aktionsleiste, Fehleruebersicht, FeldGruppe, useGeprueftesFormular } from './formular';

/** Hinweis zur E-Mail (F-20, Q-33, Q-34), auch im Admin-Formular bei Rolle Mitarbeiter. */
export function EmailHinweisMitarbeiter() {
  return (
    <Meldung
      art="hinweis"
      text="Ohne E-Mail ist keine Anmeldung möglich; der Prüfstatus bleibt über den QR-Code am Gerät sichtbar."
    >
      Bitte dienstliche E-Mail-Adresse verwenden.
    </Meldung>
  );
}

/** Mitarbeiter einladen (US-27, F-20): Rolle fest „Mitarbeiter“, keine Bereiche. Nach Erfolg leer für die nächste Person. */
export function MitarbeiterEinladenForm() {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(mitarbeiterEinladen);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'ok') ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="max-w-[40rem] space-y-4">
      <Fehleruebersicht
        state={state}
        felder={{ email: { id: 'ma-email', label: 'E-Mail' }, name: { id: 'ma-name', label: 'Name' } }}
      />
      <EmailHinweisMitarbeiter />
      <FeldGruppe id="ma-email" feld="email" label="E-Mail" state={state}>
        {(p) => <input {...p} name="email" type="email" inputMode="email" autoComplete="off" required className="feld font-mono" />}
      </FeldGruppe>
      <FeldGruppe id="ma-name" feld="name" label="Name" state={state}>
        {(p) => <input {...p} name="name" type="text" autoComplete="off" required minLength={2} maxLength={120} className="feld" />}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Mitarbeiter einladen</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
