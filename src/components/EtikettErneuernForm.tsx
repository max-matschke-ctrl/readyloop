'use client';

import { etikettErneuern } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

/**
 * Aufkleber erneuern (F-24, US-31, §8.16, E-5): Warnung, Pflicht-Checkbox als Bestätigung, gefährlicher Button.
 * Kein Dialog. noValidate: Die Prüfung der Checkbox liefert der Server mit dem Schema-Text.
 */
export function EtikettErneuernForm({ geraetId }: { geraetId: string }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(etikettErneuern);
  const id = `bestaetigung-${geraetId}`;
  const fehler = feldProps(state, 'bestaetigung');
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-3">
      <input type="hidden" name="geraetId" value={geraetId} />
      <Meldung art="warnung" live={false} text="Drucken Sie danach ein neues Etikett und kleben Sie es über den alten.">
        Der alte Aufkleber wird sofort ungültig.
      </Meldung>
      <div>
        <label htmlFor={id} className="flex min-h-10 cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            id={id}
            type="checkbox"
            name="bestaetigung"
            required
            {...fehler}
            className="mt-0.5 size-5 shrink-0 accent-steel"
          />
          <span>Ich habe verstanden, dass der alte Aufkleber ungültig wird.</span>
        </label>
        <FeldFehler state={state} feld="bestaetigung" />
      </div>
      <ActionMeldung state={state} />
      <AbsendenButton pending={pending} art="gefaehrlich">
        Aufkleber erneuern
      </AbsendenButton>
    </form>
  );
}
