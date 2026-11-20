'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
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
import { BestaetigungsDialog } from './BestaetigungsDialog';
import { EmailHinweisMitarbeiter } from './MitarbeiterEinladenForm';
import { Meldung } from './Meldung';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  FeldGruppe,
  Fehleruebersicht,
  feldProps,
  fehlerId,
  useFormularAction,
} from './formular';

const ROLLE_HILFE: Partial<Record<Rolle, string>> = {
  admin: 'Verwaltung, Prüfer zuweisen, Geräte verschieben. Keine Fristfreigabe.',
  sifa: 'Alle Bereiche, Fristen freigeben, Anlässe und Mängel.',
  verantwortlicher: 'Nur zugeordnete Bereiche: Geräte, Fristen, Nachweise, Mängel.',
  pruefer: 'Nur zugewiesene Prüfarten: Nachweise und Mängel erfassen.',
  mitarbeiter: 'Eigene Geräte sehen, wechselnde Geräte übernehmen, Mängel melden.',
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
  const formRef = useRef<HTMLFormElement>(null);
  const bestaetigt = useRef(false);
  const [dialogOffen, setDialogOffen] = useState(false);

  // §6.16: Deaktivieren (Haken „Zugang aktiv“ entfernt) erst nach Bestätigung. Ohne JS sendet das Formular direkt.
  const absenden = (e: FormEvent<HTMLFormElement>) => {
    const aktivFeld = e.currentTarget.elements.namedItem('aktiv');
    const deaktiviert = mitglied?.aktiv && aktivFeld instanceof HTMLInputElement && aktivFeld.type === 'checkbox' && !aktivFeld.checked;
    if (deaktiviert && !bestaetigt.current) {
      e.preventDefault();
      setDialogOffen(true);
      return;
    }
    bestaetigt.current = false;
    onSubmit(e);
  };
  const rollen: Rolle[] =
    mitglied && !EINLADBARE_ROLLEN.some((r) => r === mitglied.rolle) ? [...EINLADBARE_ROLLEN, mitglied.rolle] : [...EINLADBARE_ROLLEN];

  if (neu && state.status === 'ok') {
    return (
      <div className="space-y-4">
        <ActionMeldung state={state} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={weitere} className="btn btn-primaer">
            Weitere Person einladen
          </button>
          {state.id && (
            <Link href={`/admin/mitglieder/${state.id}`} className="btn btn-sekundaer">
              Mitglied ansehen
            </Link>
          )}
          <Link href="/admin/mitglieder" className="btn btn-still">
            Zur Mitgliederliste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={absenden} className="max-w-[40rem] space-y-5" noValidate>
      {mitglied && <input type="hidden" name="mitgliedschaftId" value={mitglied.mitgliedschaftId} />}
      <Fehleruebersicht
        state={state}
        felder={{
          email: { id: 'mitglied-email', label: 'E-Mail' },
          name: { id: 'mitglied-name', label: 'Name' },
          rolle: { id: 'mitglied-rolle', label: 'Rolle' },
          bereichIds: { id: `mitglied-bereich-${bereiche[0]?.id ?? ''}`, label: 'Bereiche' },
          prueferTypen: { label: 'Qualifikation' },
          aktiv: { id: 'mitglied-aktiv', label: 'Zugang' },
        }}
      />

      {neu ? (
        <FeldGruppe id="mitglied-email" feld="email" label="E-Mail" state={state}>
          {(p) => <input {...p} name="email" type="email" inputMode="email" autoComplete="off" required className="feld font-mono" />}
        </FeldGruppe>
      ) : (
        <div>
          <p className="label">E-Mail</p>
          <p className="font-mono text-sm">{mitglied.benutzer.email}</p>
        </div>
      )}

      <FeldGruppe id="mitglied-name" feld="name" label="Name" state={state}>
        {(p) => <input {...p} name="name" type="text" autoComplete="off" required minLength={2} maxLength={120} defaultValue={mitglied?.benutzer.name} className="feld" />}
      </FeldGruppe>

      <FeldGruppe
        id="mitglied-rolle"
        feld="rolle"
        label="Rolle"
        hilfe={gesperrt ? 'Die eigene Rolle kann nicht geändert werden.' : rolle ? ROLLE_HILFE[rolle] : undefined}
        state={state}
      >
        {(p) => (
          <select
            {...p}
            name="rolle"
            required
            value={rolle}
            disabled={gesperrt}
            onChange={(e) => setRolle(e.currentTarget.value as Rolle)}
            className="feld sm:max-w-72"
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
        )}
      </FeldGruppe>
      {/* Gesperrte Felder werden nicht gesendet; Wert für die Validierung mitgeben. Der Server prüft die Sperre selbst. */}
      {gesperrt && <input type="hidden" name="rolle" value={rolle} />}

      {rolle === 'verantwortlicher' && (
        <fieldset aria-describedby={state.feldfehler?.bereichIds?.length ? fehlerId('bereichIds') : undefined}>
          <legend className="label">Bereiche</legend>
          <p className="-mt-0.5 mb-1.5 text-xs text-steel">Mindestens einen Bereich wählen.</p>
          {bereiche.length === 0 ? (
            <p className="text-sm text-steel">Noch keine Bereiche angelegt.</p>
          ) : (
            <ul className="space-y-1">
              {bereiche.map((b) => (
                <li key={b.id}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                    <input
                      id={`mitglied-bereich-${b.id}`}
                      type="checkbox"
                      name="bereichIds"
                      value={b.id}
                      defaultChecked={mitglied?.bereichIds.includes(b.id)}
                      className="size-5 shrink-0 accent-steel"
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
          <legend className="label">
            Qualifikation <span className="font-normal text-steel">(optional)</span>
          </legend>
          <p className="-mt-0.5 mb-1.5 text-xs text-steel">Dient nur der Warnung bei der Zuweisung. Die Befähigung selbst verantwortet der Betrieb.</p>
          <ul className="space-y-1">
            {PRUEFER_TYPEN.map((t) => (
              <li key={t}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                  <input type="checkbox" name="prueferTypen" value={t} defaultChecked={mitglied?.prueferTypen.includes(t)} className="size-5 shrink-0 accent-steel" />
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
          <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              id="mitglied-aktiv"
              type="checkbox"
              name="aktiv"
              defaultChecked={mitglied.aktiv}
              disabled={gesperrt}
              className="size-5 shrink-0 accent-steel"
              {...feldProps(state, 'aktiv', 'mitglied-aktiv-hilfe')}
            />
            Zugang aktiv
          </label>
          {gesperrt && <input type="hidden" name="aktiv" value="on" />}
          <p id="mitglied-aktiv-hilfe" className="mt-0.5 text-xs text-steel">
            {gesperrt
              ? 'Die eigene Mitgliedschaft kann nicht deaktiviert werden.'
              : 'Deaktivierte Mitglieder haben keinen Zugriff mehr; ihr Name bleibt in Verlauf und Nachweisen erhalten.'}
          </p>
          <FeldFehler state={state} feld="aktiv" />
        </div>
      )}

      {neu && rolle === 'mitarbeiter' && <EmailHinweisMitarbeiter />}

      {neu && (
        <Meldung art="hinweis" text="Hat die Person bereits ein Konto, z. B. als Prüfer anderer Betriebe, wird nur der Zugang angelegt.">
          Neue E-Mail-Adressen erhalten eine Einladung zum Setzen des Passworts.
        </Meldung>
      )}

      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>{neu ? 'Person einladen' : 'Änderungen speichern'}</AbsendenButton>
        <Link href="/admin/mitglieder" className="btn btn-still">
          Abbrechen
        </Link>
      </Aktionsleiste>

      {mitglied && (
        <BestaetigungsDialog
          offen={dialogOffen}
          titel="Mitglied deaktivieren?"
          bestaetigen="Deaktivieren"
          onAbbrechen={() => setDialogOffen(false)}
          onBestaetigen={() => {
            bestaetigt.current = true;
            setDialogOffen(false);
            formRef.current?.requestSubmit();
          }}
        >
          {mitglied.benutzer.name} hat danach keinen Zugriff mehr auf diesen Betrieb. Der Name bleibt in Verlauf und Nachweisen erhalten.
        </BestaetigungsDialog>
      )}
    </form>
  );
}
