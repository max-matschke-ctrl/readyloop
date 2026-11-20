'use client';

import Link from 'next/link';
import { useState } from 'react';
import { terminVorschlag } from '@/domain/maengel';
import { MANGEL_SCHWERE_LABEL, MANGEL_SCHWEREN, PRUEF_ERGEBNIS_LABEL, type MangelFormularKontext, type MangelSchwere } from '@/domain/types';
import { mangelErfassen } from '@/server/actions';
import { Meldung } from './Meldung';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  FeldGruppe,
  Fehleruebersicht,
  feldProps,
  useFormularAction,
} from './formular';
import { datum } from './format';

interface Props {
  kontext: MangelFormularKontext;
  zurueck: string | null;
  /** Ziel für „Abbrechen“ bzw. „Später erfassen“. */
  abbrechenHref: string;
}

const SCHWERE_KACHEL: Record<MangelSchwere, { symbol: string; kreis: string; titel: string }> = {
  gefaehrlich: { symbol: '✕', kreis: 'bg-brick text-white', titel: 'Gefährlich' },
  erheblich: { symbol: '!', kreis: 'bg-ochre text-ink', titel: 'Erheblich' },
  gering: { symbol: '–', kreis: 'bg-steel text-white', titel: 'Gering' },
};

/** F-14. Prüfer (verantwortliche leer): Prüfart Pflicht, kein Verantwortlicher. Der Server prüft alles verbindlich. */
export function MangelForm({ kontext, zurueck, abbrechenHref }: Props) {
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

  const schwereFehler = feldProps(state, 'schwere');

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="geraetId" value={kontext.geraet.id} />
      <input type="hidden" name="nachweisId" value={nachweis?.id ?? ''} />
      <input type="hidden" name="zurueck" value={zurueck ?? ''} />
      <Fehleruebersicht
        state={state}
        felder={{
          geraetPruefartId: { id: 'mangel-pruefart', label: 'Prüfart' },
          beschreibung: { id: 'mangel-beschreibung', label: 'Beschreibung' },
          schwere: { id: 'mangel-schwere-gefaehrlich', label: 'Schwere' },
          termin: { id: 'mangel-termin', label: 'Frist zur Behebung' },
          verantwortlichId: { id: 'mangel-verantwortlich', label: 'Verantwortlich' },
        }}
      />

      {nachweis ? (
        <div>
          <p className="label">Prüfart</p>
          <input type="hidden" name="geraetPruefartId" value={nachweis.geraetPruefartId} />
          <p>
            {nachweisPruefart?.bezeichnung ?? 'Prüfart des Nachweises'}
            <span className="block text-sm text-steel">
              aus Nachweis vom <span className="font-mono">{datum(nachweis.pruefdatum)}</span> ({PRUEF_ERGEBNIS_LABEL[nachweis.ergebnis]})
            </span>
          </p>
        </div>
      ) : (
        <FeldGruppe id="mangel-pruefart" feld="geraetPruefartId" label="Prüfart" optional={!istPruefer} state={state}>
          {(p) => (
            <select {...p} name="geraetPruefartId" required={istPruefer} defaultValue={kontext.vorbelegtePruefartId ?? ''} className="feld min-h-12 sm:min-h-10">
              <option value="" disabled={istPruefer}>
                {istPruefer ? 'Bitte wählen' : 'Gerät allgemein (ohne Prüfart)'}
              </option>
              {kontext.pruefarten.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.bezeichnung}
                </option>
              ))}
            </select>
          )}
        </FeldGruppe>
      )}

      <FeldGruppe id="mangel-beschreibung" feld="beschreibung" label="Beschreibung" hilfe="Ein Befund je Mangel: was, wo, wie stark." state={state}>
        {(p) => <textarea {...p} name="beschreibung" rows={3} required minLength={5} maxLength={1000} className="feld" />}
      </FeldGruppe>

      <fieldset aria-describedby={schwereFehler['aria-describedby']}>
        <legend className="label">Schwere</legend>
        <div className="grid gap-2">
          {MANGEL_SCHWEREN.map((s) => {
            const k = SCHWERE_KACHEL[s];
            return (
              <label
                key={s}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-flaeche border bg-white px-3 py-2 hover:bg-steel-50 has-[:checked]:border-2 has-[:checked]:border-steel has-[:checked]:bg-steel-50 has-[:checked]:px-[11px] has-[:checked]:py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-steel ${
                  schwereFehler['aria-invalid'] ? 'border-brick' : 'border-steel-400'
                }`}
              >
                <input
                  id={`mangel-schwere-${s}`}
                  type="radio"
                  name="schwere"
                  value={s}
                  required
                  checked={schwere === s}
                  onChange={() => schwereWaehlen(s)}
                  className="size-5 shrink-0 accent-steel focus-visible:outline-none"
                />
                <span aria-hidden="true" className={`inline-flex size-6 shrink-0 items-center justify-center rounded-feld font-display text-sm font-bold ${k.kreis}`}>
                  {k.symbol}
                </span>
                <span className="min-w-0 leading-5">
                  <span className="block font-semibold text-ink">{k.titel}</span>
                  <span className="block text-sm text-steel">{MANGEL_SCHWERE_LABEL[s].split('–')[1]?.trim() ?? MANGEL_SCHWERE_LABEL[s]}</span>
                </span>
              </label>
            );
          })}
        </div>
        <FeldFehler state={state} feld="schwere" />
        {schwere === 'gefaehrlich' && (
          <Meldung art="fehler" className="mt-3">
            Das Gerät steht danach auf „Vor Nutzung prüfen – nicht verwenden“.
          </Meldung>
        )}
      </fieldset>

      <FeldGruppe
        id="mangel-termin"
        feld="termin"
        label="Frist zur Behebung"
        hilfe="Vorschlag nach Schwere: gefährlich heute, erheblich in 30 Tagen, gering in 90 Tagen. Frei änderbar, nicht in der Vergangenheit."
        state={state}
      >
        {(p) => (
          <input
            {...p}
            name="termin"
            type="date"
            required
            min={heute}
            value={termin}
            onChange={(e) => setTermin(e.currentTarget.value)}
            className="feld min-h-12 max-w-48 font-mono sm:min-h-10"
          />
        )}
      </FeldGruppe>

      {!istPruefer && (
        <FeldGruppe id="mangel-verantwortlich" feld="verantwortlichId" label="Verantwortlich" state={state}>
          {(p) => (
            <select {...p} name="verantwortlichId" required defaultValue="" className="feld">
              <option value="" disabled>
                Bitte wählen
              </option>
              {kontext.verantwortliche.map((pe) => (
                <option key={pe.benutzerId} value={pe.benutzerId}>
                  {pe.name}
                </option>
              ))}
            </select>
          )}
        </FeldGruppe>
      )}

      <Meldung art="hinweis">Beschreibung, Schwere und Bezug lassen sich nach dem Speichern nicht mehr ändern. Mängel werden nicht gelöscht.</Meldung>
      <FeldFehler state={state} feld="geraetId" />
      <FeldFehler state={state} feld="nachweisId" />
      <ActionMeldung state={state} />
      <Aktionsleiste fest>
        <AbsendenButton pending={pending} className="sm:min-h-10">
          Mangel erfassen
        </AbsendenButton>
        <Link href={abbrechenHref} className="btn btn-still min-h-12 sm:min-h-10">
          {nachweis ? 'Später erfassen' : 'Abbrechen'}
        </Link>
      </Aktionsleiste>
    </form>
  );
}
