'use client';

import Link from 'next/link';
import { DEMO_ROLLEN, ROLLE_LABEL, type DemoRolle } from '@/domain/types';
import { anmelden, setzeDemoRolle } from '@/server/actions';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldFehler, FeldGruppe, useFormularAction } from './formular';

const BESCHREIBUNG: Record<DemoRolle, string> = {
  admin: 'Bereiche und Mitglieder verwalten, Prüfer zuweisen, Geräte verschieben. Keine Fristfreigabe.',
  sifa: 'Alle Bereiche lesen, Fristen freigeben oder über GBU festlegen, Anlässe und Mängel erfassen.',
  verantwortlicher: 'Eigener Bereich (Lager): Geräte anlegen, Fristen freigeben, Nachweise und Mängel erfassen.',
  pruefer: 'Zugewiesene Prüfungen sehen, Nachweise hochladen, Mängel melden. Zwei Demo-Betriebe.',
  mitarbeiter: 'Eigene Geräte sehen, wechselnde Geräte übernehmen und zurückgeben, Mängel melden.',
};

/** Rücksprungziel (F-20) als verstecktes Feld; der Server prüft es mit sichererRuecksprung. */
function NextFeld({ next }: { next?: string }) {
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

/** Demo-Modus: Rollenwahl per Cookie. */
export function DemoRollenWahl({ next }: { next?: string }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(setzeDemoRolle);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <NextFeld next={next} />
      <fieldset>
        <legend className="mb-2 text-sm text-steel">Demo ohne Konto: Rolle wählen.</legend>
        <ul className="grid gap-2">
          {DEMO_ROLLEN.map((rolle) => (
            <li key={rolle}>
              <button
                type="submit"
                name="rolle"
                value={rolle}
                disabled={pending}
                aria-busy={pending || undefined}
                className="btn btn-sekundaer w-full flex-col items-start gap-0 px-4 py-2.5 text-left"
              >
                <span className="block text-base font-semibold text-ink">Als {ROLLE_LABEL[rolle]} anmelden</span>
                <span className="block text-sm font-normal text-steel">{BESCHREIBUNG[rolle]}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <FeldFehler state={state} feld="rolle" />
      <ActionMeldung state={state} />
      <p aria-live="polite" className="text-sm text-steel">
        {pending ? 'Anmeldung läuft …' : ''}
      </p>
    </form>
  );
}

/** Modus supabase: E-Mail und Passwort. Fehlermeldung unterscheidet nicht (kommt vom Server). */
export function LoginForm({ next }: { next?: string }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(anmelden);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <NextFeld next={next} />
      <FeldGruppe id="login-email" feld="email" label="E-Mail" state={state}>
        {(p) => <input {...p} name="email" type="email" autoComplete="username" inputMode="email" required className="feld" />}
      </FeldGruppe>
      <FeldGruppe id="login-passwort" feld="passwort" label="Passwort" state={state}>
        {(p) => <input {...p} name="passwort" type="password" autoComplete="current-password" required className="feld" />}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Anmelden</AbsendenButton>
        <Link href="/passwort-vergessen" className="btn btn-still">
          Passwort vergessen
        </Link>
      </Aktionsleiste>
    </form>
  );
}
