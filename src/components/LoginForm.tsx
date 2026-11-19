'use client';

import Link from 'next/link';
import { DEMO_ROLLEN, ROLLE_LABEL, type DemoRolle } from '@/domain/types';
import { anmelden, setzeDemoRolle } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

const BESCHREIBUNG: Record<DemoRolle, string> = {
  admin: 'Bereiche und Mitglieder verwalten, Prüfer zuweisen, Geräte verschieben. Keine Fristfreigabe.',
  sifa: 'Alle Bereiche lesen, Fristen freigeben oder über GBU festlegen, Anlässe und Mängel erfassen.',
  verantwortlicher: 'Eigener Bereich (Lager): Geräte anlegen, Fristen freigeben, Nachweise und Mängel erfassen.',
  pruefer: 'Zugewiesene Prüfungen sehen, Nachweise hochladen, Mängel melden. Zwei Demo-Betriebe.',
};

/** Demo-Modus: Rollenwahl per Cookie. */
export function DemoRollenWahl() {
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

/** Modus supabase: E-Mail und Passwort. Fehlermeldung unterscheidet nicht (kommt vom Server). */
export function LoginForm() {
  const { state, formAction, pending, onSubmit } = useFormularAction(anmelden);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="label">
          E-Mail
        </label>
        <input
          id="login-email"
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
      <div>
        <label htmlFor="login-passwort" className="label">
          Passwort
        </label>
        <input
          id="login-passwort"
          name="passwort"
          type="password"
          autoComplete="current-password"
          required
          className="feld"
          {...feldProps(state, 'passwort')}
        />
        <FeldFehler state={state} feld="passwort" />
      </div>
      <ActionMeldung state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="submit" className="btn btn-primaer" disabled={pending}>
          {pending ? 'Anmeldung läuft …' : 'Anmelden'}
        </button>
        <Link href="/passwort-vergessen" className="link text-sm">
          Passwort vergessen?
        </Link>
      </div>
    </form>
  );
}
