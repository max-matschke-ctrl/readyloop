'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { PDF_MAX_BYTES } from '@/domain/schemas';
import { PRUEF_ERGEBNIS_LABEL, PRUEF_ERGEBNISSE, type IsoDate, type PruefErgebnis } from '@/domain/types';
import { nachweisErfassen } from '@/server/actions';
import { Meldung } from './Meldung';
import { PlaketteBestaetigung } from './PlaketteGlyph';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  FeldGruppe,
  Fehleruebersicht,
  feldProps,
  fehlerId,
  useGeprueftesFormular,
} from './formular';

interface Props {
  geraetPruefartId: string;
  heute: IsoDate;
  pruefumfang: string;
  prueferName: string;
  /** true, wenn die Rolle Mängel erfassen darf (Hinweis auf Weiterleitung, F-12). */
  mitMaengelHinweis?: boolean;
  /** Ziel für „Abbrechen“ (Prüfaufgaben bzw. Geräteakte). */
  abbrechenHref: string;
}

const MB = PDF_MAX_BYTES / (1024 * 1024);

/** Ergebnis-Kacheln (§8.8): Symbol und Text, Farbe nur im Symbolkreis. */
const ERGEBNIS: Record<PruefErgebnis, { symbol: string; kreis: string; titel: string }> = {
  ohne_maengel: { symbol: '✓', kreis: 'bg-moss text-white', titel: 'Bestanden' },
  maengel_weiterbetrieb: { symbol: '!', kreis: 'bg-ochre text-ink', titel: 'Mit Mängeln' },
  nicht_bestanden: { symbol: '✕', kreis: 'bg-brick text-white', titel: 'Nicht bestanden' },
};

function groesseText(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`;
}

export function NachweisForm({ geraetPruefartId, heute, pruefumfang, prueferName, mitMaengelHinweis = false, abbrechenHref }: Props) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(nachweisErfassen);
  const uid = useId();
  const f = (n: string) => `${uid}-${n}`;
  const [datei, setDatei] = useState<{ name: string; groesse: number } | null>(null);
  const [pdfHinweis, setPdfHinweis] = useState<string | null>(null);

  // setCustomValidity: ungültige Datei macht das Feld invalid, damit pruefeFormular (bzw. ohne JS der
  // Browser) das Absenden verhindert. Der Server prüft Typ und Größe unabhängig davon erneut.
  const pdfPruefen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const d = el.files?.[0];
    setDatei(d ? { name: d.name, groesse: d.size } : null);
    const hinweis = !d
      ? null
      : d.type !== 'application/pdf'
        ? 'Die Datei ist kein PDF. Bitte den Prüfbericht als PDF wählen.'
        : d.size > PDF_MAX_BYTES
          ? `PDF ist größer als ${MB} MB. Bitte kleinere Datei wählen.`
          : null;
    el.setCustomValidity(hinweis ?? '');
    setPdfHinweis(hinweis);
  };

  const felder = {
    pruefdatum: { id: f('pruefdatum'), label: 'Prüfdatum' },
    prueferName: { id: f('prueferName'), label: 'Prüfer' },
    ergebnis: { id: f('ergebnis-ohne_maengel'), label: 'Ergebnis' },
    pruefumfang: { id: f('pruefumfang'), label: 'Prüfumfang' },
    fristEmpfehlungMonate: { id: f('fristEmpfehlungMonate'), label: 'Empfohlene Frist' },
    pdf: { id: f('pdf'), label: 'Prüfbericht' },
    unterschriftImPdf: { id: f('unterschrift'), label: 'Unterschrift' },
  };
  const ergebnisFehler = feldProps(state, 'ergebnis');
  const pdfFehler = Boolean(state.feldfehler?.pdf?.length) || pdfHinweis !== null;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="space-y-6">
      <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
      <Fehleruebersicht state={state} felder={felder} />

      <FeldGruppe id={f('pruefdatum')} feld="pruefdatum" label="Prüfdatum" state={state}>
        {(p) => <input {...p} name="pruefdatum" type="date" required defaultValue={heute} max={heute} className="feld min-h-12 max-w-[12rem] font-mono" />}
      </FeldGruppe>

      <fieldset aria-describedby={ergebnisFehler['aria-describedby']}>
        <legend className="label">Ergebnis</legend>
        <div className="grid gap-2">
          {PRUEF_ERGEBNISSE.map((e) => {
            const k = ERGEBNIS[e];
            return (
              <label
                key={e}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-flaeche border bg-white px-3 py-2 hover:bg-steel-50 has-[:checked]:border-2 has-[:checked]:border-steel has-[:checked]:bg-steel-50 has-[:checked]:px-[11px] has-[:checked]:py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-steel ${
                  ergebnisFehler['aria-invalid'] ? 'border-brick' : 'border-steel-400'
                }`}
              >
                <input
                  id={f(`ergebnis-${e}`)}
                  type="radio"
                  name="ergebnis"
                  value={e}
                  required
                  className="size-5 shrink-0 accent-steel focus-visible:outline-none"
                />
                <span aria-hidden="true" className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${k.kreis}`}>
                  {k.symbol}
                </span>
                <span className="min-w-0 leading-5">
                  <span className="block font-semibold text-ink">{k.titel}</span>
                  <span className="block text-sm text-steel">{PRUEF_ERGEBNIS_LABEL[e]}</span>
                </span>
              </label>
            );
          })}
        </div>
        <FeldFehler state={state} feld="ergebnis" />
        {mitMaengelHinweis && (
          <p className="mt-2 text-xs text-steel">Bei Mängeln oder „Nicht bestanden“ geht es nach dem Speichern weiter zur Mängelerfassung.</p>
        )}
      </fieldset>

      <FeldGruppe id={f('prueferName')} feld="prueferName" label="Prüfer" hilfe="Name der Person, die geprüft hat." state={state}>
        {(p) => <input {...p} name="prueferName" required minLength={2} maxLength={120} defaultValue={prueferName} autoComplete="name" className="feld min-h-12" />}
      </FeldGruppe>

      <FeldGruppe id={f('pruefumfang')} feld="pruefumfang" label="Prüfumfang" state={state}>
        {(p) => <textarea {...p} name="pruefumfang" rows={2} required minLength={3} maxLength={500} defaultValue={pruefumfang} className="feld min-h-12" />}
      </FeldGruppe>

      <FeldGruppe
        id={f('fristEmpfehlungMonate')}
        feld="fristEmpfehlungMonate"
        label="Empfohlene Frist"
        optional
        einheit="Monate"
        hilfe="Ihre Empfehlung wirkt erst, wenn Sifa oder Verantwortlicher sie freigibt."
        state={state}
      >
        {(p) => (
          <input {...p} name="fristEmpfehlungMonate" type="number" inputMode="numeric" min={1} max={120} className="feld min-h-12 pr-20 font-mono" />
        )}
      </FeldGruppe>

      <div>
        <label htmlFor={f('pdf')} className="label">
          Prüfbericht
        </label>
        <p id={f('pdf-hilfe')} className="-mt-0.5 mb-1.5 text-xs text-steel">
          PDF mit Unterschrift, höchstens {MB} MB.
        </p>
        <div
          className={`relative flex min-h-24 items-center gap-3 rounded-flaeche border-2 border-dashed px-4 py-3 hover:bg-steel-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-steel ${
            pdfFehler ? 'border-brick bg-brick-50' : datei ? 'border-steel-400 bg-white' : 'border-steel-400 bg-white'
          }`}
        >
          <input
            id={f('pdf')}
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={pdfPruefen}
            aria-invalid={pdfFehler || undefined}
            aria-describedby={[f('pdf-hilfe'), f('pdf-wahl'), pdfHinweis ? f('pdf-hinweis') : null, state.feldfehler?.pdf?.length ? fehlerId('pdf') : null]
              .filter(Boolean)
              .join(' ')}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          {datei ? (
            <>
              <FileText aria-hidden="true" size={24} strokeWidth={1.75} className="shrink-0 text-steel" />
              <span id={f('pdf-wahl')} className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm text-ink">{datei.name}</span>
                <span className="block text-sm text-steel">
                  {groesseText(datei.groesse)} · <span className="text-ink underline decoration-steel-400 underline-offset-2">Andere Datei wählen</span>
                </span>
              </span>
            </>
          ) : (
            <>
              <Upload aria-hidden="true" size={24} strokeWidth={1.75} className="shrink-0 text-steel" />
              <span id={f('pdf-wahl')} className="min-w-0">
                <span className="block font-semibold text-ink">PDF auswählen</span>
                <span className="block text-sm text-steel">oder hierher ziehen</span>
              </span>
            </>
          )}
        </div>
        {pdfHinweis && (
          <p id={f('pdf-hinweis')} className="mt-1 flex items-start gap-1.5 text-sm font-medium text-brick">
            <span aria-hidden="true">✕</span>
            <span>{pdfHinweis}</span>
          </p>
        )}
        <FeldFehler state={state} feld="pdf" />
      </div>

      <div>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-flaeche border border-steel-200 bg-white px-3 py-2 text-sm">
          <input
            id={f('unterschrift')}
            type="checkbox"
            name="unterschriftImPdf"
            value="on"
            required
            className="size-5 shrink-0 accent-steel"
            {...feldProps(state, 'unterschriftImPdf')}
          />
          <span>Das PDF enthält die Unterschrift des Prüfers.</span>
        </label>
        <FeldFehler state={state} feld="unterschriftImPdf" />
      </div>

      <Meldung art="hinweis">Nachweise lassen sich nach dem Speichern nicht mehr löschen oder ändern.</Meldung>

      <FeldFehler state={state} feld="geraetPruefartId" />
      <ActionMeldung state={state} erfolgSymbol={<PlaketteBestaetigung />} />
      <Aktionsleiste fest>
        <AbsendenButton pending={pending} className="sm:min-h-12">
          Nachweis speichern
        </AbsendenButton>
        <Link href={abbrechenHref} className="btn btn-still min-h-12">
          Abbrechen
        </Link>
      </Aktionsleiste>
    </form>
  );
}
