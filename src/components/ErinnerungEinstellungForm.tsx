'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { STAFFEL_MAX_TAGE, type ActionState, type ErinnerungEinstellung, type ErinnerungEinstellungAnsicht } from '@/domain/types';
import { erinnerungEinstellungSpeichern, erinnerungEinstellungZuruecksetzen } from '@/server/actions';
import { EmpfaengerWahl } from './EmpfaengerWahl';
import { EskalationsKette, TageFeld } from './EskalationsKette';
import { Meldung } from './Meldung';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  Fehleruebersicht,
  anzahlFeldfehler,
  useFormularAction,
  useGeprueftesFormular,
} from './formular';

const STAFFEL_LABEL = ['Erste Erinnerung', 'Zweite Erinnerung', 'Dritte Erinnerung'] as const;

/** Felder → Sprungziel und Label für die Fehlerübersicht (§6.10). Namen exakt wie im Vertrag §9.8. */
const FEHLER_FELDER: Record<string, { id: string; label: string }> = {
  staffel: { id: 'staffel-0', label: 'Vorlauf vor der Fälligkeit' },
  eskalationVerantwortlicher: { id: 'eskalation-verantwortlicher', label: 'Eskalation Verantwortliche' },
  eskalationSifa: { id: 'eskalation-sifa', label: 'Eskalation Sifa' },
  eskalationAdmin: { id: 'eskalation-admin', label: 'Eskalation Admin/Geschäftsführung' },
  sifaEmpfaenger: { id: 'sifa-alle', label: 'Sifa' },
  adminEmpfaenger: { id: 'admin-alle', label: 'Admin/Geschäftsführung' },
};

/** Schlüssel der gespeicherten Werte: nach Speichern oder Zurücksetzen zeigen die Felder die Werte des Servers. */
function werteSchluessel(e: ErinnerungEinstellung): string {
  return JSON.stringify([e.staffelTage, e.eskalationTage, e.sifaInKopie, e.sifaEmpfaengerIds, e.adminEmpfaengerIds]);
}

/** Meldung der Action oben im Formular; Fokus darauf nach Erfolg (§8.19). */
function FokusMeldung({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === 'ok') ref.current?.focus();
  }, [state]);
  return (
    <div ref={ref} tabIndex={-1} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
      <ActionMeldung state={state} />
    </div>
  );
}

/**
 * Einstellungen je Bereich (§8.19, §6.24, §6.25, F-39): Staffel, Eskalationskette, Empfänger.
 * Darunter, getrennt durch Linie und eigene h2, das zweite Formular „Auf Standard zurücksetzen“.
 * Beide Formulare funktionieren ohne JavaScript (Server Actions).
 */
export function ErinnerungEinstellungForm({ ansicht }: { ansicht: ErinnerungEinstellungAnsicht }) {
  const { bereich, einstellung, verantwortliche, sifaOptionen, adminOptionen } = ansicht;
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(erinnerungEinstellungSpeichern);

  return (
    <div className="space-y-8">
      <form action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="space-y-6">
        <input type="hidden" name="bereichId" value={bereich.id} />
        <FokusMeldung state={state} />
        {anzahlFeldfehler(state) >= 2 && <Fehleruebersicht state={state} felder={FEHLER_FELDER} />}

        {/* key: nach dem Speichern zeigen die Felder die vom Server sortierten Werte. */}
        <div key={werteSchluessel(einstellung)} className="space-y-6">
          <div className="karte p-4 sm:p-6">
            <fieldset className="space-y-3">
              <legend className="text-[1.0625rem] font-semibold leading-6">Vorlauf vor der Fälligkeit</legend>
              <p className="text-xs text-steel">
                Mails an die Verantwortlichen des Bereichs, bevor eine Prüfung fällig wird. Leere Felder werden ignoriert.
              </p>
              <FeldFehler state={state} feld="staffel" />
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {STAFFEL_LABEL.map((label, i) => (
                  <div key={label}>
                    <label htmlFor={`staffel-${i}`} className="label">
                      {label}
                      {i > 0 && <span className="font-normal text-steel"> (optional)</span>}
                    </label>
                    <TageFeld
                      id={`staffel-${i}`}
                      name="staffel"
                      min={1}
                      max={STAFFEL_MAX_TAGE}
                      einheit="Tage vorher"
                      required={i === 0}
                      defaultValue={einstellung.staffelTage[i]}
                      state={state}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="karte p-4 sm:p-6">
            <EskalationsKette tage={einstellung.eskalationTage} state={state} />
          </div>

          <div className="karte p-4 sm:p-6">
            <fieldset className="space-y-5">
              <legend className="text-[1.0625rem] font-semibold leading-6">Empfänger</legend>
              <div>
                <p className="font-semibold">Verantwortliche des Bereichs</p>
                {verantwortliche.length > 0 ? (
                  <ul className="text-sm">
                    {verantwortliche.map((v) => (
                      <li key={v.benutzerId}>{v.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" aria-label="keine Angabe">
                    –
                  </p>
                )}
                <p className="mt-1 text-xs text-steel">Verantwortliche des Bereichs erhalten Erinnerungen immer.</p>
              </div>

              <div>
                <label className="flex min-h-10 cursor-pointer items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    name="sifaInKopie"
                    defaultChecked={einstellung.sifaInKopie}
                    aria-describedby="sifa-kopie-hilfe"
                    className="mt-0.5 size-5 shrink-0 accent-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
                  />
                  <span>Sifa beim Vorlauf und bei der ersten Eskalationsstufe in Kopie</span>
                </label>
                <p id="sifa-kopie-hilfe" className="ml-8 text-xs text-steel">
                  Ab der Stufe Sifa erhält die Sifa die Erinnerung immer.
                </p>
              </div>

              <EmpfaengerWahl
                gruppe="sifa"
                titel="Sifa"
                optionen={sifaOptionen}
                ausgewaehlt={einstellung.sifaEmpfaengerIds}
                keineText="Keine aktive Sifa im Betrieb."
                state={state}
              />
              <EmpfaengerWahl
                gruppe="admin"
                titel="Admin/Geschäftsführung"
                optionen={adminOptionen}
                ausgewaehlt={einstellung.adminEmpfaengerIds}
                keineText="Kein aktiver Admin im Betrieb."
                state={state}
              />
            </fieldset>
          </div>
        </div>

        <div className="space-y-2">
          <Aktionsleiste>
            <AbsendenButton pending={pending}>Erinnerungen speichern</AbsendenButton>
            <Link href="/admin/erinnerungen" className="btn btn-still">
              Abbrechen
            </Link>
          </Aktionsleiste>
          <p className="text-xs text-steel">Änderungen gelten ab dem nächsten Erinnerungslauf (werktags morgens).</p>
        </div>
      </form>

      <ZuruecksetzenForm bereichId={bereich.id} standard={einstellung.standard} />
    </div>
  );
}

/**
 * Zweites Formular (§8.19): nur bei angepasster Einstellung, unter einer Linie mit eigener h2, Sekundär.
 * Keine Rückfrage (§6.16). Nach dem Zurücksetzen bleibt die Erfolgsmeldung an dieser Stelle stehen.
 */
function ZuruecksetzenForm({ bereichId, standard }: { bereichId: string; standard: boolean }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(erinnerungEinstellungZuruecksetzen);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === 'ok') ref.current?.focus();
  }, [state]);

  if (standard && state.status !== 'ok') return null;

  return (
    <section aria-labelledby="zuruecksetzen-titel" className="space-y-3 border-t border-steel-200 pt-6">
      <h2 id="zuruecksetzen-titel" className="text-xl font-semibold leading-7 tracking-[-0.01em]">
        Auf Standard zurücksetzen
      </h2>
      {standard ? (
        <div ref={ref} tabIndex={-1} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
          <Meldung art="erfolg">{state.meldung ?? 'Auf Standard zurückgesetzt'}</Meldung>
        </div>
      ) : (
        <form action={formAction} onSubmit={onSubmit} className="space-y-3">
          <input type="hidden" name="bereichId" value={bereichId} />
          <p className="max-w-prose text-sm">
            Vorlauf 90/60/30 Tage, Eskalation 0/7/14 Tage, Sifa in Kopie, alle aktiven Sifa und Admins.
          </p>
          {/* Erfolg steht oben in diesem Abschnitt (Zweig „standard“); hier nur Fehler. */}
          {state.status === 'fehler' && <ActionMeldung state={state} />}
          <AbsendenButton pending={pending} art="sekundaer">
            Auf Standard zurücksetzen
          </AbsendenButton>
        </form>
      )}
    </section>
  );
}
