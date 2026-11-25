'use client';

import { Lock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { EigeneBenachrichtigung } from '@/domain/types';
import { benachrichtigungSetzen } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, useFormularAction } from './formular';

/**
 * Karte der eigenen Mailart (§8.20, E-9): genau eine je Rolle. Pflichtmail mit Schloss und Begründung, ohne
 * Bedienelement. Abbestellbare Mail mit Zustandszeile (Text + Symbol, keine Marke, kein Schalter) und einem
 * Formular-Button (48 px), ohne JavaScript nutzbar. Erfolgsmeldung in der Karte über dem Button, Fokus darauf.
 */
export function BenachrichtigungKarte({ benachrichtigung }: { benachrichtigung: EigeneBenachrichtigung }) {
  const { art, label, beschreibung, abbestellbar, abgemeldet, pflichtBegruendung } = benachrichtigung;
  const { state, formAction, pending, onSubmit } = useFormularAction(benachrichtigungSetzen);
  const meldungRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== 'idle') meldungRef.current?.focus();
  }, [state]);

  return (
    <section aria-labelledby="benachrichtigung-titel" className="karte space-y-3 p-4">
      <h2 id="benachrichtigung-titel" className="text-xl font-semibold leading-7 tracking-[-0.01em]">
        {label}
      </h2>
      <p className="max-w-prose">{beschreibung}</p>

      {!abbestellbar ? (
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <Lock aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />
            Pflicht – kann nicht abbestellt werden
          </p>
          {pflichtBegruendung && <p className="max-w-prose text-sm text-steel">{pflichtBegruendung}</p>}
        </div>
      ) : (
        <form action={formAction} onSubmit={onSubmit} className="space-y-3">
          <input type="hidden" name="art" value={art} />
          <input type="hidden" name="abgemeldet" value={abgemeldet ? 'nein' : 'ja'} />
          <p className="flex items-center gap-2 font-medium">
            <span aria-hidden="true" className="inline-flex w-4 justify-center">
              {abgemeldet ? '✕' : '✓'}
            </span>
            {abgemeldet ? 'Sie erhalten diese Mails nicht.' : 'Sie erhalten diese Mails.'}
          </p>
          <div
            ref={meldungRef}
            tabIndex={-1}
            aria-live="polite"
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
          >
            {state.status !== 'idle' && state.meldung && (
              <Meldung art={state.status === 'ok' ? 'erfolg' : 'fehler'} live={false}>
                {state.meldung}
              </Meldung>
            )}
          </div>
          <div className="aktionen-halle">
            <AbsendenButton pending={pending} art={abgemeldet ? 'primaer' : 'sekundaer'} className="btn-halle">
              {abgemeldet ? 'Wieder erhalten' : 'Abbestellen'}
            </AbsendenButton>
          </div>
        </form>
      )}
    </section>
  );
}
