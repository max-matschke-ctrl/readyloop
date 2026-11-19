'use client';

import { useId, useState } from 'react';
import { PDF_MAX_BYTES } from '@/domain/schemas';
import { PRUEF_ERGEBNIS_LABEL, PRUEF_ERGEBNISSE, type IsoDate } from '@/domain/types';
import { nachweisErfassen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

interface Props {
  geraetPruefartId: string;
  heute: IsoDate;
  pruefumfang: string;
  prueferName: string;
  /** true, wenn die Rolle Mängel erfassen darf (Hinweis auf Weiterleitung, F-12). */
  mitMaengelHinweis?: boolean;
}

const MB = PDF_MAX_BYTES / (1024 * 1024);

export function NachweisForm({ geraetPruefartId, heute, pruefumfang, prueferName, mitMaengelHinweis = false }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(nachweisErfassen);
  const uid = useId();
  const f = (n: string) => `${uid}-${n}`;
  const [pdfHinweis, setPdfHinweis] = useState<string | null>(null);

  const pdfPruefen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return setPdfHinweis(null);
    if (datei.type !== 'application/pdf') return setPdfHinweis('Die Datei ist kein PDF.');
    if (datei.size > PDF_MAX_BYTES) return setPdfHinweis(`Die Datei ist größer als ${MB} MB.`);
    setPdfHinweis(null);
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={f('pruefdatum')} className="label">
            Prüfdatum *
          </label>
          <input
            id={f('pruefdatum')}
            name="pruefdatum"
            type="date"
            required
            defaultValue={heute}
            max={heute}
            className="feld font-mono"
            {...feldProps(state, 'pruefdatum')}
          />
          <FeldFehler state={state} feld="pruefdatum" />
        </div>
        <div>
          <label htmlFor={f('prueferName')} className="label">
            Prüfer (Name) *
          </label>
          <input
            id={f('prueferName')}
            name="prueferName"
            required
            minLength={2}
            maxLength={120}
            defaultValue={prueferName}
            autoComplete="name"
            className="feld"
            {...feldProps(state, 'prueferName')}
          />
          <FeldFehler state={state} feld="prueferName" />
        </div>
      </div>

      <fieldset {...feldProps(state, 'ergebnis')}>
        <legend className="label">Ergebnis *</legend>
        <div className="grid gap-2">
          {PRUEF_ERGEBNISSE.map((e) => (
            <label key={e} className="karte flex cursor-pointer items-center gap-3 px-3 py-2.5 has-[:checked]:border-steel has-[:checked]:bg-steel-hell/50">
              <input type="radio" name="ergebnis" value={e} required className="size-4 accent-steel" />
              <span className="text-sm">{PRUEF_ERGEBNIS_LABEL[e]}</span>
            </label>
          ))}
        </div>
        <FeldFehler state={state} feld="ergebnis" />
        {mitMaengelHinweis && (
          <p className="mt-2 text-xs text-steel">
            Bei Mängeln oder „nicht bestanden“ geht es nach dem Speichern weiter zur Mängelerfassung.
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor={f('pruefumfang')} className="label">
          Prüfumfang *
        </label>
        <textarea
          id={f('pruefumfang')}
          name="pruefumfang"
          rows={2}
          required
          minLength={3}
          maxLength={500}
          defaultValue={pruefumfang}
          className="feld"
          {...feldProps(state, 'pruefumfang')}
        />
        <FeldFehler state={state} feld="pruefumfang" />
      </div>

      <div>
        <label htmlFor={f('fristEmpfehlungMonate')} className="label">
          Empfohlene Frist (Monate, optional)
        </label>
        <input
          id={f('fristEmpfehlungMonate')}
          name="fristEmpfehlungMonate"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          className="feld font-mono sm:w-32"
          {...feldProps(state, 'fristEmpfehlungMonate')}
          aria-describedby={[f('empfehlung-hinweis'), feldProps(state, 'fristEmpfehlungMonate')['aria-describedby']]
            .filter(Boolean)
            .join(' ')}
        />
        <p id={f('empfehlung-hinweis')} className="mt-1 text-xs text-steel">
          Empfehlung, wirkt erst nach Freigabe durch Sifa oder Verantwortlichen.
        </p>
        <FeldFehler state={state} feld="fristEmpfehlungMonate" />
      </div>

      <div>
        <label htmlFor={f('pdf')} className="label">
          Prüfbericht (PDF, max. {MB} MB) *
        </label>
        <input
          id={f('pdf')}
          name="pdf"
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={pdfPruefen}
          className="feld file:mr-3 file:rounded file:border-0 file:bg-steel-hell file:px-3 file:py-1 file:text-sm"
          {...feldProps(state, 'pdf')}
        />
        {pdfHinweis && <p className="mt-1 text-sm text-brick">{pdfHinweis}</p>}
        <FeldFehler state={state} feld="pdf" />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="unterschriftImPdf" value="on" required className="mt-0.5 size-4 accent-steel" {...feldProps(state, 'unterschriftImPdf')} />
          <span>PDF enthält Unterschrift des Prüfers *</span>
        </label>
        <FeldFehler state={state} feld="unterschriftImPdf" />
      </div>

      <p className="rounded border border-steel/30 bg-paper px-3 py-2 text-xs text-steel">
        Nachweise können nach dem Speichern nicht gelöscht oder geändert werden.
      </p>

      <FeldFehler state={state} feld="geraetPruefartId" />
      <ActionMeldung state={state} />
      <button type="submit" disabled={pending} className="btn btn-primaer w-full py-2.5 sm:w-auto">
        {pending ? 'Wird gespeichert …' : 'Nachweis speichern'}
      </button>
    </form>
  );
}
