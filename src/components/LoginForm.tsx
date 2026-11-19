'use client';

import { DEMO_ROLLEN, ROLLE_LABEL, type DemoRolle } from '@/domain/types';
import { setzeDemoRolle } from '@/server/actions';
import { ActionMeldung, FeldFehler, useFormularAction } from './formular';

const BESCHREIBUNG: Record<DemoRolle, string> = {
  admin: 'Organisation, Bereiche, Ersterfassung. Keine Fristfreigabe.',
  sifa: 'Alle Bereiche lesen, Fristen freigeben oder über GBU festlegen.',
  verantwortlicher: 'Eigener Bereich (Lager): Geräte anlegen, Fristen freigeben, Nachweise erfassen.',
  pruefer: 'Zugewiesene Prüfungen sehen und Nachweise hochladen.',
};

export function LoginForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(setzeDemoRolle);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Rolle für die Demo wählen</legend>
        <ul className="grid gap-2">
          {DEMO_ROLLEN.map((rolle) => (
            <li key={rolle}>
              <button
                type="submit"
                name="rolle"
                value={rolle}
                disabled={pending}
                className="karte w-full px-4 py-3 text-left hover:border-steel hover:bg-steel-hell/40 disabled:opacity-60"
              >
                <span className="block font-display font-semibold">{ROLLE_LABEL[rolle]}</span>
                <span className="block text-sm text-steel">{BESCHREIBUNG[rolle]}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <FeldFehler state={state} feld="rolle" />
      <ActionMeldung state={state} />
      {pending && <p className="text-sm text-steel">Anmeldung läuft …</p>}
    </form>
  );
}
