'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  EINLADBARE_ROLLEN,
  PRUEFER_TYP_LABEL,
  PRUEFER_TYPEN,
  ROLLE_LABEL,
  type Bereich,
  type MitgliedAnsicht,
  type Rolle,
} from '@/domain/types';
import { mitgliedAendern, mitgliedEinladen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, fehlerId, useFormularAction } from './formular';

const ROLLE_HILFE: Partial<Record<Rolle, string>> = {
  admin: 'Verwaltung, Prüfer zuweisen, Geräte verschieben. Keine Fristfreigabe.',
  sifa: 'Alle Bereiche, Fristen freigeben, Anlässe und Mängel.',
  verantwortlicher: 'Nur zugeordnete Bereiche: Geräte, Fristen, Nachweise, Mängel.',
  pruefer: 'Nur zugewiesene Prüfarten: Nachweise und Mängel erfassen.',
};

interface Props {
  bereiche: Bereich[];
  /** Ohne mitglied: Einladen. Mit mitglied: Ändern. */
  mitglied?: MitgliedAnsicht;
}

/** Wrapper: „Weitere Person einladen“ setzt das Formular über einen neuen key vollständig zurück. */
export function MitgliedForm(props: Props) {
  const [runde, setRunde] = useState(0);
  return <MitgliedFormInnen key={runde} {...props} weitere={() => setRunde((r) => r + 1)} />;
}

function MitgliedFormInnen({ bereiche, mitglied, weitere }: Props & { weitere: () => void }) {
  const neu = mitglied === undefined;
  const { state, formAction, pending, onSubmit } = useFormularAction(neu ? mitgliedEinladen : mitgliedAendern);
  const [rolle, setRolle] = useState<Rolle | ''>(mitglied?.rolle ?? '');
  const gesperrt = mitglied?.istEigeneMitgliedschaft ?? false;
  const rollen: Rolle[] =
    mitglied && !EINLADBARE_ROLLEN.some((r) => r === mitglied.rolle) ? [...EINLADBARE_ROLLEN, mitglied.rolle] : [...EINLADBARE_ROLLEN];

  if (neu && state.status === 'ok') {
    return (
      <div className="space-y-3">
        <ActionMeldung state={state} />
        <p className="flex flex-wrap gap-3 text-sm">
          {state.id && (
            <Link href={`/admin/mitglieder/${state.id}`} className="link">
              Mitglied ansehen
            </Link>
          )}
          <Link href="/admin/mitglieder" className="link">
            Zur Mitgliederliste
          </Link>
          <button type="button" onClick={weitere} className="link">
            Weitere Person einladen
          </button>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      {mitglied && <input type="hidden" name="mitgliedschaftId" value={mitglied.mitgliedschaftId} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          {neu ? (
            <>
              <label htmlFor="mitglied-email" className="label">
                E-Mail
              </label>
              <input
                id="mitglied-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                required
                className="feld"
                {...feldProps(state, 'email')}
              />
              <FeldFehler state={state} feld="email" />
            </>
          ) : (
            <>
              <p className="label">E-Mail</p>
              <p className="py-1.5 font-mono text-sm">{mitglied.benutzer.email}</p>
            </>
          )}
        </div>
        <div>
          <label htmlFor="mitglied-name" className="label">
            Name
          </label>
          <input
            id="mitglied-name"
            name="name"
            type="text"
            autoComplete="off"
            required
            minLength={2}
            maxLength={120}
            defaultValue={mitglied?.benutzer.name}
            className="feld"
            {...feldProps(state, 'name')}
          />
          <FeldFehler state={state} feld="name" />
        </div>
      </div>

      <div>
        <label htmlFor="mitglied-rolle" className="label">
          Rolle
        </label>
        <select
          id="mitglied-rolle"
          name="rolle"
          required
          value={rolle}
          disabled={gesperrt}
          onChange={(e) => setRolle(e.currentTarget.value as Rolle)}
          className="feld sm:w-72"
          {...feldProps(state, 'rolle')}
        >
          {neu && (
            <option value="" disabled>
              Bitte wählen
            </option>
          )}
          {rollen.map((r) => (
            <option key={r} value={r}>
              {ROLLE_LABEL[r]}
            </option>
          ))}
        </select>
        {/* Gesperrte Felder werden nicht gesendet; Wert für die Validierung mitgeben. Der Server prüft die Sperre selbst. */}
        {gesperrt && <input type="hidden" name="rolle" value={rolle} />}
        {rolle && ROLLE_HILFE[rolle] && <p className="mt-1 text-xs text-steel">{ROLLE_HILFE[rolle]}</p>}
        {gesperrt && <p className="mt-1 text-xs text-steel">Die eigene Rolle kann nicht geändert werden.</p>}
        <FeldFehler state={state} feld="rolle" />
      </div>

      {rolle === 'verantwortlicher' && (
        <fieldset aria-describedby={state.feldfehler?.bereichIds?.length ? fehlerId('bereichIds') : undefined}>
          <legend className="label">Bereiche (mindestens einer)</legend>
          {bereiche.length === 0 ? (
            <p className="text-sm text-steel">Noch keine Bereiche angelegt.</p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {bereiche.map((b) => (
                <li key={b.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="bereichIds"
                      value={b.id}
                      defaultChecked={mitglied?.bereichIds.includes(b.id)}
                      className="size-4"
                    />
                    {b.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <FeldFehler state={state} feld="bereichIds" />
        </fieldset>
      )}

      {rolle === 'pruefer' && (
        <fieldset>
          <legend className="label">Qualifikation (optional)</legend>
          <p className="mb-2 text-xs text-steel">
            Dient nur der Warnung bei der Zuweisung. Die Befähigung selbst verantwortet der Betrieb.
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {PRUEFER_TYPEN.map((t) => (
              <li key={t}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="prueferTypen"
                    value={t}
                    defaultChecked={mitglied?.prueferTypen.includes(t)}
                    className="size-4"
                  />
                  {PRUEFER_TYP_LABEL[t]}
                </label>
              </li>
            ))}
          </ul>
          <FeldFehler state={state} feld="prueferTypen" />
        </fieldset>
      )}

      {mitglied && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="aktiv"
              defaultChecked={mitglied.aktiv}
              disabled={gesperrt}
              className="size-4"
              {...feldProps(state, 'aktiv')}
            />
            Zugang aktiv
          </label>
          {gesperrt && <input type="hidden" name="aktiv" value="on" />}
          <p className="mt-1 text-xs text-steel">
            {gesperrt
              ? 'Die eigene Mitgliedschaft kann nicht deaktiviert werden.'
              : 'Deaktivierte Mitglieder haben keinen Zugriff mehr; ihr Name bleibt in Verlauf und Nachweisen erhalten.'}
          </p>
          <FeldFehler state={state} feld="aktiv" />
        </div>
      )}

      {neu && (
        <p className="text-xs text-steel">
          Neue E-Mail-Adressen erhalten eine Einladung zum Setzen des Passworts. Hat die Person bereits ein Konto (z. B. ein
          Prüfer anderer Betriebe), wird nur der Zugang angelegt.
        </p>
      )}

      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer" disabled={pending}>
        {pending ? 'Wird gespeichert …' : neu ? 'Einladen' : 'Speichern'}
      </button>
    </form>
  );
}
