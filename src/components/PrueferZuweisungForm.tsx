'use client';

import { useState } from 'react';
import { qualifikationsWarnung } from '@/domain/qualifikation';
import type { PrueferOption, PrueferTyp } from '@/domain/types';
import { prueferZuweisen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';
import { PrueferDeaktiviertHinweis } from './PrueferDeaktiviertHinweis';

interface Props {
  geraetPruefartId: string;
  optionen: PrueferOption[];
  aktuellId: string | null;
  aktuellName: string | null;
  /** Review I2 (Befund 2): zugewiesener Prüfer ist deaktiviert (fehlt in optionen). */
  aktuellDeaktiviert?: boolean;
  /** Vom Katalogeintrag geforderte Typen; null = kein Eintrag → keine Warnung (F-15). */
  gefordert: readonly PrueferTyp[] | null;
}

/** F-15: Warnung vor dem Speichern, blockiert nicht. Der Server prüft Recht und Rolle des Prüfers. */
export function PrueferZuweisungForm({
  geraetPruefartId,
  optionen,
  aktuellId,
  aktuellName,
  aktuellDeaktiviert = false,
  gefordert,
}: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(prueferZuweisen);
  const [wahl, setWahl] = useState(aktuellId ?? '');
  const gewaehlt = optionen.find((o) => o.benutzerId === wahl);
  const warnung = gewaehlt ? qualifikationsWarnung(gewaehlt.prueferTypen, gefordert) : null;
  const aktuellFehlt = aktuellId !== null && !optionen.some((o) => o.benutzerId === aktuellId);
  const feldId = `pruefer-${geraetPruefartId}`;
  const hinweisId = `${feldId}-deaktiviert`;
  const fp = feldProps(state, 'prueferId');

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
      <label htmlFor={feldId} className="label">
        Prüfer zuweisen
      </label>
      {aktuellDeaktiviert && (
        <div id={hinweisId}>
          <PrueferDeaktiviertHinweis name={aktuellName} />
        </div>
      )}
      <div className="flex flex-wrap items-start gap-2">
        <select
          id={feldId}
          name="prueferId"
          value={wahl}
          onChange={(e) => setWahl(e.currentTarget.value)}
          className="feld sm:w-72"
          {...fp}
          aria-describedby={[fp['aria-describedby'], aktuellDeaktiviert ? hinweisId : undefined].filter(Boolean).join(' ') || undefined}
        >
          <option value="">– nicht zugewiesen –</option>
          {aktuellFehlt && (
            <option value={aktuellId} disabled>
              {aktuellName ?? 'Bisheriger Prüfer'} {aktuellDeaktiviert ? '(deaktiviert)' : '(nicht mehr zuweisbar)'}
            </option>
          )}
          {optionen.map((o) => (
            <option key={o.benutzerId} value={o.benutzerId}>
              {o.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-sekundaer" disabled={pending || wahl === (aktuellId ?? '')}>
          {pending ? 'Wird gespeichert …' : wahl === '' && aktuellId ? 'Zuweisung entfernen' : 'Zuweisen'}
        </button>
      </div>
      {warnung && (
        <p role="note" className="rounded border border-ochre/60 bg-ochre/15 px-3 py-2 text-sm">
          <span aria-hidden="true" className="mr-1 font-bold text-ochre-dunkel">
            !
          </span>
          Qualifikation prüfen – {warnung}. Speichern bleibt möglich.
        </p>
      )}
      {optionen.length === 0 && <p className="text-xs text-steel">Keine aktiven Prüfer vorhanden. Prüfer lädt die Administration ein.</p>}
      <FeldFehler state={state} feld="prueferId" />
      <ActionMeldung state={state} />
    </form>
  );
}
