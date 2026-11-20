'use client';

import { useState } from 'react';
import { qualifikationsWarnung } from '@/domain/qualifikation';
import type { PrueferOption, PrueferTyp } from '@/domain/types';
import { prueferZuweisen } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';
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
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
      {aktuellDeaktiviert && (
        <div id={hinweisId}>
          <PrueferDeaktiviertHinweis name={aktuellName} />
        </div>
      )}
      <div>
        <label htmlFor={feldId} className="label">
          Prüfer
        </label>
        {optionen.length === 0 && (
          <p id={`${feldId}-hilfe`} className="-mt-0.5 mb-1.5 text-xs text-steel">
            Keine aktiven Prüfer vorhanden. Prüfer lädt die Administration ein.
          </p>
        )}
        <div className="flex flex-wrap items-start gap-3">
          <select
            id={feldId}
            name="prueferId"
            value={wahl}
            onChange={(e) => setWahl(e.currentTarget.value)}
            className="feld min-w-0 flex-1 sm:max-w-72"
            {...fp}
            aria-describedby={
              [fp['aria-describedby'], aktuellDeaktiviert ? hinweisId : undefined, optionen.length === 0 ? `${feldId}-hilfe` : undefined]
                .filter(Boolean)
                .join(' ') || undefined
            }
          >
            <option value="">Nicht zugewiesen</option>
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
          <AbsendenButton pending={pending} disabled={wahl === (aktuellId ?? '')}>
            {wahl === '' && aktuellId ? 'Zuweisung entfernen' : 'Prüfer zuweisen'}
          </AbsendenButton>
        </div>
        <FeldFehler state={state} feld="prueferId" />
      </div>
      {warnung && (
        <Meldung art="warnung" text="Speichern bleibt möglich.">
          Qualifikation prüfen: {warnung}.
        </Meldung>
      )}
      <ActionMeldung state={state} />
    </form>
  );
}
