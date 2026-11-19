'use client';

import { useState } from 'react';
import { terminVorschlag } from '@/domain/maengel';
import { MANGEL_SCHWERE_LABEL, MANGEL_SCHWEREN, PRUEF_ERGEBNIS_LABEL, type MangelFormularKontext, type MangelSchwere } from '@/domain/types';
import { mangelErfassen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';
import { datum } from './format';

interface Props {
  kontext: MangelFormularKontext;
  zurueck: string | null;
}

/** F-14. Prüfer (verantwortliche leer): Prüfart Pflicht, kein Verantwortlicher. Der Server prüft alles verbindlich. */
export function MangelForm({ kontext, zurueck }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(mangelErfassen);
  const [schwere, setSchwere] = useState<MangelSchwere | ''>('');
  const [termin, setTermin] = useState<string>('');
  const istPruefer = kontext.verantwortliche.length === 0;
  const { nachweis, heute } = kontext;
  const nachweisPruefart = nachweis ? kontext.pruefarten.find((p) => p.id === nachweis.geraetPruefartId) : undefined;

  const schwereWaehlen = (s: MangelSchwere) => {
    setSchwere(s);
    setTermin(terminVorschlag(s, heute));
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="geraetId" value={kontext.geraet.id} />
      <input type="hidden" name="nachweisId" value={nachweis?.id ?? ''} />
      <input type="hidden" name="zurueck" value={zurueck ?? ''} />

      {nachweis ? (
        <div>
          <p className="label">Prüfart</p>
          <input type="hidden" name="geraetPruefartId" value={nachweis.geraetPruefartId} />
          <p className="text-sm">
            {nachweisPruefart?.bezeichnung ?? 'Prüfart des Nachweises'}
            <span className="block text-xs text-steel">
              aus Nachweis vom {datum(nachweis.pruefdatum)} ({PRUEF_ERGEBNIS_LABEL[nachweis.ergebnis]})
            </span>
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="mangel-pruefart" className="label">
            Prüfart {istPruefer ? '*' : '(optional)'}
          </label>
          <select
            id="mangel-pruefart"
            name="geraetPruefartId"
            required={istPruefer}
            defaultValue={kontext.vorbelegtePruefartId ?? ''}
            className="feld sm:w-80"
            {...feldProps(state, 'geraetPruefartId')}
          >
            <option value="" disabled={istPruefer}>
              {istPruefer ? 'Bitte wählen' : 'Gerät allgemein (ohne Prüfart)'}
            </option>
            {kontext.pruefarten.map((p) => (
              <option key={p.id} value={p.id}>
                {p.bezeichnung}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="geraetPruefartId" />
        </div>
      )}

      <div>
        <label htmlFor="mangel-beschreibung" className="label">
          Beschreibung *
        </label>
        <textarea
          id="mangel-beschreibung"
          name="beschreibung"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          className="feld"
          {...feldProps(state, 'beschreibung')}
        />
        <FeldFehler state={state} feld="beschreibung" />
      </div>

      <fieldset {...feldProps(state, 'schwere')}>
        <legend className="label">Schwere *</legend>
        <div className="grid gap-2">
          {MANGEL_SCHWEREN.map((s) => (
            <label
              key={s}
              className="karte flex cursor-pointer items-center gap-3 px-3 py-2.5 has-[:checked]:border-steel has-[:checked]:bg-steel-hell/50"
            >
              <input
                type="radio"
                name="schwere"
                value={s}
                required
                checked={schwere === s}
                onChange={() => schwereWaehlen(s)}
                className="size-4 accent-steel"
              />
              <span className="text-sm">{MANGEL_SCHWERE_LABEL[s]}</span>
            </label>
          ))}
        </div>
        <FeldFehler state={state} feld="schwere" />
        {schwere === 'gefaehrlich' && (
          <p role="alert" className="mt-2 rounded border border-brick/50 bg-brick/10 px-3 py-2 text-sm font-medium">
            <span aria-hidden="true">✕ </span>Das Gerät steht danach auf „Vor Nutzung prüfen – nicht verwenden“.
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mangel-termin" className="label">
            Termin zur Behebung *
          </label>
          <input
            id="mangel-termin"
            name="termin"
            type="date"
            required
            min={heute}
            value={termin}
            onChange={(e) => setTermin(e.currentTarget.value)}
            className="feld font-mono"
            {...feldProps(state, 'termin')}
            aria-describedby={['mangel-termin-hinweis', feldProps(state, 'termin')['aria-describedby']].filter(Boolean).join(' ')}
          />
          <p id="mangel-termin-hinweis" className="mt-1 text-xs text-steel">
            Vorschlag nach Schwere: gefährlich heute, erheblich +30 Tage, gering +90 Tage. Frei änderbar, nicht in der
            Vergangenheit.
          </p>
          <FeldFehler state={state} feld="termin" />
        </div>
        {!istPruefer && (
          <div>
            <label htmlFor="mangel-verantwortlich" className="label">
              Verantwortlich *
            </label>
            <select
              id="mangel-verantwortlich"
              name="verantwortlichId"
              required
              defaultValue=""
              className="feld"
              {...feldProps(state, 'verantwortlichId')}
            >
              <option value="" disabled>
                Bitte wählen
              </option>
              {kontext.verantwortliche.map((p) => (
                <option key={p.benutzerId} value={p.benutzerId}>
                  {p.name}
                </option>
              ))}
            </select>
            <FeldFehler state={state} feld="verantwortlichId" />
          </div>
        )}
      </div>

      <p className="rounded border border-steel/30 bg-paper px-3 py-2 text-xs text-steel">
        Beschreibung, Schwere und Bezug sind nach dem Speichern nicht mehr änderbar. Mängel werden nicht gelöscht.
      </p>
      <FeldFehler state={state} feld="geraetId" />
      <FeldFehler state={state} feld="nachweisId" />
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-primaer w-full py-2.5 sm:w-auto" disabled={pending}>
        {pending ? 'Wird gespeichert …' : 'Mangel erfassen'}
      </button>
    </form>
  );
}
