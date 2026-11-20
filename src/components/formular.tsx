'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { INITIAL_ACTION_STATE, type ActionState } from '@/domain/types';
import { Meldung } from './Meldung';
import { PlaketteGlyph } from './PlaketteGlyph';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;
type Feldfehler = NonNullable<ActionState['feldfehler']>;

/**
 * useActionState mit eigenem Submit: verhindert, dass React 19 das Formular nach einem
 * Fehler zurücksetzt (Eingaben und gewählte PDF bleiben erhalten). `action` bleibt als Fallback ohne JS.
 */
export function useFormularAction(action: Action) {
  const [state, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  };
  return { state, formAction, pending, onSubmit };
}

type Pruefbar = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Feldschlüssel eines Elements: name (wie der Server) oder, bei Feldern ohne name, die id. */
function feldSchluessel(el: Pruefbar): string {
  return el.name || el.id;
}

function labelText(el: Pruefbar): string {
  const roh = el.labels?.[0]?.textContent ?? el.getAttribute('aria-label') ?? '';
  return roh.replace(/\(optional\)/g, '').replace(/\s+/g, ' ').trim();
}

/** Deutsche Meldung zur nativen Constraint-Validierung (statt Browser-Blase, §6.10). */
function meldungFuer(el: Pruefbar): string {
  const v = el.validity;
  const label = labelText(el);
  if (v.valueMissing) {
    if (el instanceof HTMLSelectElement) return `Bitte ${label} wählen.`;
    if (el instanceof HTMLInputElement && el.type === 'file') return 'Bitte eine Datei wählen.';
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) return 'Bitte eine Auswahl treffen.';
    return `Bitte ${label} angeben.`;
  }
  if (v.tooShort && 'minLength' in el) return `Mindestens ${el.minLength} Zeichen eingeben.`;
  if (v.tooLong && 'maxLength' in el) return `Höchstens ${el.maxLength} Zeichen eingeben.`;
  if (v.badInput) return 'Bitte eine Zahl eingeben.';
  if ((v.rangeUnderflow || v.rangeOverflow) && el instanceof HTMLInputElement) {
    if (el.type === 'date') return v.rangeOverflow ? 'Das Datum darf nicht in der Zukunft liegen.' : 'Das Datum ist zu früh.';
    return `Bitte einen Wert von ${el.min} bis ${el.max} eingeben.`;
  }
  if (v.typeMismatch && el instanceof HTMLInputElement && el.type === 'email') return 'Bitte eine gültige E-Mail-Adresse angeben.';
  return el.validationMessage || 'Eingabe prüfen.';
}

/** Prüft alle Felder mit nativen Regeln (required, min, max …). Null, wenn alles gültig ist. */
function pruefeFormular(form: HTMLFormElement): { fehler: Feldfehler; erstes: Pruefbar } | null {
  const fehler: Feldfehler = {};
  let erstes: Pruefbar | null = null;
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) continue;
    if (el.disabled || el.type === 'hidden' || el.validity.valid) continue;
    const key = feldSchluessel(el);
    if (!key || fehler[key]) continue;
    fehler[key] = [meldungFuer(el)];
    erstes ??= el;
  }
  return erstes ? { fehler, erstes } : null;
}

/**
 * Wie useFormularAction (unverändert darunter), zusätzlich mit Prüfung im Browser:
 * Pflichtfelder und Grenzen werden vor dem Absenden geprüft und als Feldfehler mit deutschen Texten
 * gezeigt (Fehlerübersicht ab 2 Fehlern). `noValidate` erst nach der Hydrierung, damit ohne JavaScript
 * die Browserprüfung greift. Der Server prüft unabhängig davon alles erneut.
 */
export function useGeprueftesFormular(action: Action) {
  const basis = useFormularAction(action);
  const [clientFehler, setClientFehler] = useState<Feldfehler | null>(null);
  const [hydriert, setHydriert] = useState(false);
  useEffect(() => setHydriert(true), []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const ergebnis = pruefeFormular(e.currentTarget);
    if (ergebnis) {
      e.preventDefault();
      setClientFehler(ergebnis.fehler);
      // Ein Fehler: direkt ins Feld. Ab zwei übernimmt die Fehlerübersicht den Fokus.
      if (Object.keys(ergebnis.fehler).length === 1) ergebnis.erstes.focus();
      return;
    }
    setClientFehler(null);
    basis.onSubmit(e);
  };

  const state = useMemo<ActionState>(
    () =>
      clientFehler
        ? { status: 'fehler', meldung: 'Bitte die markierten Felder prüfen.', feldfehler: clientFehler }
        : basis.state,
    [clientFehler, basis.state],
  );
  return { ...basis, state, onSubmit, noValidate: hydriert };
}

export function fehlerId(feld: string): string {
  return `fehler-${feld.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function hilfeId(id: string): string {
  return `${id}-hilfe`;
}

/** Feldfehler unter dem Feld (§6.10: Text brick mit ✕); per aria-describedby={fehlerId(feld)} verknüpft. */
export function FeldFehler({ state, feld }: { state: ActionState; feld: string }) {
  const fehler = state.feldfehler?.[feld];
  if (!fehler?.length) return null;
  return (
    <p id={fehlerId(feld)} className="mt-1 flex items-start gap-1.5 text-sm font-medium text-brick">
      <span aria-hidden="true">✕</span>
      <span>{fehler.join(' ')}</span>
    </p>
  );
}

export function feldProps(state: ActionState, feld: string, hilfe?: string) {
  const hatFehler = Boolean(state.feldfehler?.[feld]?.length);
  const beschreibung = [hilfe, hatFehler ? fehlerId(feld) : undefined].filter(Boolean).join(' ');
  return {
    'aria-invalid': hatFehler || undefined,
    'aria-describedby': beschreibung || undefined,
  } as const;
}

export interface FeldAttribute {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface FeldGruppeProps {
  id: string;
  label: ReactNode;
  /** Feldname wie im Server-State (Standard: id). */
  feld?: string;
  state: ActionState;
  optional?: boolean;
  hilfe?: ReactNode;
  /** Einheit rechts im Feld, z. B. „Monate“ (§6.10). */
  einheit?: string;
  className?: string;
  children: (p: FeldAttribute) => ReactNode;
}

/**
 * Feldgruppe (§6.10): Label (klein 500, „(optional)“ statt Sternchen), Hilfetext (fein, steel),
 * Feld, Fehler. Hilfe und Fehler sind per aria-describedby mit dem Feld verknüpft.
 */
export function FeldGruppe({ id, label, feld = id, state, optional, hilfe, einheit, className = '', children }: FeldGruppeProps) {
  const attribute: FeldAttribute = { id, ...feldProps(state, feld, hilfe ? hilfeId(id) : undefined) };
  const eingabe = children(attribute);
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="font-normal text-steel"> (optional)</span>}
      </label>
      {hilfe && (
        <p id={hilfeId(id)} className="-mt-0.5 mb-1.5 text-xs text-steel">
          {hilfe}
        </p>
      )}
      {einheit ? (
        <div className="relative">
          {eingabe}
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-steel">
            {einheit}
          </span>
        </div>
      ) : (
        eingabe
      )}
      <FeldFehler state={state} feld={feld} />
    </div>
  );
}

export function anzahlFeldfehler(state: ActionState): number {
  return Object.values(state.feldfehler ?? {}).filter((v) => v?.length).length;
}

interface FehleruebersichtProps {
  state: ActionState;
  /** Feldname → id des Eingabefelds und Label. Unbekannte Felder springen zur Fehlermeldung. */
  felder?: Record<string, { id?: string; label: string }>;
}

/**
 * Fehlerübersicht (§6.10): ab 2 Feldfehlern oben im Formular, Fokus beim Erscheinen,
 * Links springen in das jeweilige Feld.
 */
export function Fehleruebersicht({ state, felder = {} }: FehleruebersichtProps) {
  const ref = useRef<HTMLDivElement>(null);
  const eintraege = Object.entries(state.feldfehler ?? {}).filter(([, v]) => v?.length) as [string, string[]][];
  const sichtbar = eintraege.length >= 2;

  useEffect(() => {
    if (sichtbar) ref.current?.focus();
  }, [state, sichtbar]);

  if (!sichtbar) return null;

  const springen = (e: MouseEvent<HTMLAnchorElement>, feld: string) => {
    const id = felder[feld]?.id;
    const ziel =
      (id ? document.getElementById(id) : null) ??
      document.querySelector<HTMLElement>(`[aria-describedby~="${fehlerId(feld)}"]`) ??
      document.getElementById(fehlerId(feld));
    if (!ziel) return;
    e.preventDefault();
    ziel.scrollIntoView({ block: 'center' });
    ziel.focus({ preventScroll: true });
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="fehleruebersicht-titel"
      className="rounded-flaeche border-2 border-brick bg-brick-50 p-4 text-ink"
    >
      <h2 id="fehleruebersicht-titel" className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
        <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full bg-brick text-xs font-bold text-white">
          ✕
        </span>
        Bitte korrigieren
      </h2>
      <ul className="mt-2 space-y-1 pl-7 text-sm">
        {eintraege.map(([feld, meldungen]) => {
          const info = felder[feld];
          return (
            <li key={feld}>
              <a
                href={`#${info?.id ?? fehlerId(feld)}`}
                onClick={(e) => springen(e, feld)}
                className="text-brick-800 underline decoration-brick underline-offset-2 hover:decoration-2"
              >
                {info?.label && !meldungen.some((m) => m.includes(info.label)) ? `${info.label}: ` : ''}
                {meldungen.join(' ')}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface AbsendenProps {
  pending: boolean;
  children: ReactNode;
  art?: 'primaer' | 'sekundaer' | 'gefaehrlich';
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}

/** Absende-Button (§6.3): Text bleibt bei laufender Aktion, davor eine drehende Glyph-Plakette, aria-busy. */
export function AbsendenButton({ pending, children, art = 'primaer', className = '', disabled, name, value }: AbsendenProps) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={`btn btn-${art} ${className}`}
    >
      {pending && (
        <PlaketteGlyph groesse={20} ton={art === 'sekundaer' ? 'steel' : 'weiss'} className="animate-spin [animation-duration:1.2s]" />
      )}
      {children}
    </button>
  );
}

/**
 * Aktionsleiste (§6.10): unten links, Primär zuerst, „Abbrechen“ als stiller Link daneben.
 * `fest`: unter 640 px als feste Leiste am unteren Rand (weiß, shadow-pop), Primär in voller Breite;
 * ein Platzhalter verhindert, dass sie das letzte Feld verdeckt.
 */
export function Aktionsleiste({ fest = false, children }: { fest?: boolean; children: ReactNode }) {
  if (!fest) return <div className="flex flex-wrap items-center gap-3">{children}</div>;
  return (
    <>
      <div aria-hidden="true" className="h-16 sm:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-steel-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none [&>.btn-primaer]:min-h-12 [&>.btn-primaer]:flex-1 sm:[&>.btn-primaer]:min-h-10 sm:[&>.btn-primaer]:flex-none">
        {children}
      </div>
    </>
  );
}

/** Meldung der Action (§6.11) als Live-Region. Ab 2 Feldfehlern spricht die Fehlerübersicht. */
export function ActionMeldung({ state, erfolgSymbol }: { state: ActionState; erfolgSymbol?: ReactNode }) {
  const zeigen = state.status !== 'idle' && state.meldung && !(state.status === 'fehler' && anzahlFeldfehler(state) >= 2);
  return (
    <div aria-live="polite">
      {zeigen && (
        <Meldung art={state.status === 'ok' ? 'erfolg' : 'fehler'} symbol={state.status === 'ok' ? erfolgSymbol : undefined} live={false}>
          {state.meldung}
        </Meldung>
      )}
    </div>
  );
}
