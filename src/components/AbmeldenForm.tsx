'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AbmeldeSeite } from '@/domain/types';
import { mailAbmeldenPerToken } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, useFormularAction } from './formular';

type Aktion = 'abmelden' | 'anmelden';

/**
 * Abbestellen per Link (§8.21, F-40, E-9): ein Satz, ein Button (48 px). Der Seitenaufruf ändert nichts,
 * erst der Button. Ohne JavaScript nutzbar (Server Action, Button trägt das Feld aktion).
 * Keine Namen, keine E-Mail-Adresse.
 */
export function AbmeldenForm({ seite }: { seite: AbmeldeSeite }) {
  const basis = useFormularAction(mailAbmeldenPerToken);
  const { state, formAction, pending } = basis;
  const letzteAktion = useRef<Aktion | null>(null);
  const [abgemeldet, setAbgemeldet] = useState(seite.abgemeldet);
  const meldungRef = useRef<HTMLDivElement>(null);

  // Ohne JavaScript kommt die Seite mit frischen Daten zurück; dann ergibt sich die Aktion aus dem neuen Zustand.
  const ausgefuehrt: Aktion = letzteAktion.current ?? (seite.abgemeldet ? 'abmelden' : 'anmelden');

  useEffect(() => {
    if (state.status !== 'ok') return;
    setAbgemeldet(ausgefuehrt === 'abmelden');
    meldungRef.current?.focus();
    // ausgefuehrt hängt nur vom letzten Absenden ab, das state auslöst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    letzteAktion.current = submitter?.value === 'abmelden' ? 'abmelden' : 'anmelden';
    basis.onSubmit(e);
  };

  const { artLabel, organisationName } = seite;
  const erfolg = state.status === 'ok';
  const naechste: Aktion = abgemeldet ? 'anmelden' : 'abmelden';

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="t" value={seite.token} />
      <div ref={meldungRef} tabIndex={-1} aria-live="polite" className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
        {erfolg &&
          (ausgefuehrt === 'abmelden' ? (
            <Meldung art="erfolg" live={false} text="Das gilt ab dem nächsten Versand.">
              Sie erhalten die {artLabel} von {organisationName} nicht mehr.
            </Meldung>
          ) : (
            <Meldung art="erfolg" live={false}>
              Sie erhalten die {artLabel} von {organisationName} wieder.
            </Meldung>
          ))}
        {state.status === 'fehler' && state.meldung && (
          <Meldung art="fehler" live={false}>
            {state.meldung}
          </Meldung>
        )}
      </div>
      {!erfolg && (
        <p className="max-w-prose text-base">
          {abgemeldet
            ? `Sie haben die ${artLabel} von ${organisationName} abbestellt.`
            : `Sie erhalten derzeit die ${artLabel} von ${organisationName}.`}
        </p>
      )}
      <div className="aktionen-halle">
        <AbsendenButton pending={pending} art={erfolg ? 'sekundaer' : 'primaer'} name="aktion" value={naechste} className="btn-halle">
          {naechste === 'abmelden' ? 'Abbestellen' : 'Wieder erhalten'}
        </AbsendenButton>
      </div>
      <p className="text-sm text-steel">Andere Mails, etwa Hinweise zu Ihren Geräten, sind davon nicht betroffen.</p>
    </form>
  );
}
