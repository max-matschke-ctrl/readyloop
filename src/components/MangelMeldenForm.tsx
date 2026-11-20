'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MANGEL_SCHWEREN, MANGEL_SCHWERE_LABEL, type MangelSchwere } from '@/domain/types';
import { mangelMelden } from '@/server/actions';
import { AbsendenButton, ActionMeldung, Fehleruebersicht, FeldFehler, FeldGruppe, feldProps, useGeprueftesFormular } from './formular';
import { Meldung } from './Meldung';

/** Erklärsätze und Symbole je Schwere (§8.15); die Labels kommen aus MANGEL_SCHWERE_LABEL. */
const SCHWERE: Record<MangelSchwere, { erklaerung: string; symbol: string; kreis: string }> = {
  gefaehrlich: { erklaerung: 'Gerät darf nicht mehr benutzt werden.', symbol: '⚠', kreis: 'border-brick bg-brick-50 text-brick-800' },
  erheblich: { erklaerung: 'Muss bald repariert werden.', symbol: '!', kreis: 'border-ochre-600 bg-ochre-50 text-ochre-dunkel' },
  gering: { erklaerung: 'Kleinigkeit, Gerät funktioniert.', symbol: 'i', kreis: 'border-steel bg-steel-50 text-steel' },
};

interface Props {
  geraetId: string;
  /** Sicherer relativer Rücksprung (Seite prüft ihn vorher). */
  zurueck: string;
  zurueckLabel: string;
}

/**
 * Mangel melden (F-26, US-30, §8.15): Schwere als Radio-Kacheln 64 px ohne Vorauswahl, Zusatzhinweis bei
 * „Gefährlich“ per CSS :has (ohne JavaScript), Beschreibung 4 Zeilen, Hauptaktion 56 px (mobil feste Leiste).
 * Nach dem Speichern ersetzt die Erfolgsmeldung das Formular und bekommt den Fokus.
 */
export function MangelMeldenForm({ geraetId, zurueck, zurueckLabel }: Props) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(mangelMelden);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const erfolgRef = useRef<HTMLDivElement>(null);
  const erfolg = state.status === 'ok';

  useEffect(() => {
    if (erfolg) erfolgRef.current?.focus();
  }, [erfolg]);

  if (erfolg) {
    return (
      <div ref={erfolgRef} tabIndex={-1} className="space-y-4 focus-visible:outline-offset-4">
        <Meldung
          art="erfolg"
          className="text-base!"
          text={gewaehlt === 'gefaehrlich' ? 'Das Gerät steht jetzt auf „Nicht verwenden“.' : undefined}
        >
          {state.meldung}
        </Meldung>
        <div className="aktionen-halle">
          <Link href={zurueck} className="btn btn-primaer btn-haupt">
            {zurueckLabel}
          </Link>
        </div>
      </div>
    );
  }

  const absenden = (e: FormEvent<HTMLFormElement>) => {
    setGewaehlt(String(new FormData(e.currentTarget).get('schwere') ?? ''));
    onSubmit(e);
  };
  const schwereFehler = feldProps(state, 'schwere');

  return (
    <form action={formAction} onSubmit={absenden} noValidate={noValidate} className="space-y-6">
      <input type="hidden" name="geraetId" value={geraetId} />
      <Fehleruebersicht
        state={state}
        felder={{ schwere: { id: 'schwere-gefaehrlich', label: 'Schwere' }, beschreibung: { id: 'mangel-beschreibung', label: 'Beschreibung' } }}
      />

      <fieldset aria-describedby={schwereFehler['aria-describedby']} className="group/schwere space-y-3">
        <legend className="mb-3 font-sans text-[1.0625rem] font-semibold leading-6 text-ink">Wie schwer ist der Mangel?</legend>
        <div className="grid gap-3">
          {MANGEL_SCHWEREN.map((s) => {
            const k = SCHWERE[s];
            return (
              <label
                key={s}
                className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-flaeche border bg-white px-4 py-2 hover:bg-steel-50 has-[:checked]:border-2 has-[:checked]:border-steel has-[:checked]:bg-steel-50 has-[:checked]:px-[15px] has-[:checked]:py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-steel ${
                  schwereFehler['aria-invalid'] ? 'border-brick' : 'border-steel-400'
                }`}
              >
                <input
                  id={`schwere-${s}`}
                  type="radio"
                  name="schwere"
                  value={s}
                  required
                  className="size-5 shrink-0 accent-steel focus-visible:outline-none"
                />
                <span
                  aria-hidden="true"
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold ${k.kreis}`}
                >
                  {k.symbol}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-ink">{MANGEL_SCHWERE_LABEL[s]}</span>
                  <span className="block text-sm text-ink">{k.erklaerung}</span>
                </span>
              </label>
            );
          })}
        </div>
        <FeldFehler state={state} feld="schwere" />
        <div className="hidden group-has-[#schwere-gefaehrlich:checked]/schwere:block">
          <Meldung art="warnung" live={false} className="text-base!">
            Nach dem Melden steht das Gerät für alle auf „Nicht verwenden“.
          </Meldung>
        </div>
      </fieldset>

      <FeldGruppe
        id="mangel-beschreibung"
        feld="beschreibung"
        label={<span className="text-base">Was ist kaputt?</span>}
        hilfe={<span className="text-sm">Zum Beispiel: Holm eingerissen, Kabel beschädigt.</span>}
        state={state}
      >
        {(p) => <textarea {...p} name="beschreibung" rows={4} required minLength={5} maxLength={1000} className="feld min-h-32 py-2" />}
      </FeldGruppe>

      <ActionMeldung state={state} />

      <div aria-hidden="true" className="h-20 sm:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-steel-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <AbsendenButton pending={pending} className="btn-haupt flex-1 sm:flex-none sm:min-w-48">
          Mangel melden
        </AbsendenButton>
        <Link href={zurueck} className="btn btn-still min-h-12 text-base">
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
