'use client';

import { EINSATZORT_LABEL, type Bereich } from '@/domain/types';
import { geraetVerschieben } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

/** F-16: Ziele = Bereiche im Geltungsbereich ohne den aktuellen. Der Server prüft darfVerschieben. */
export function GeraetVerschiebenForm({ geraetId, ziele }: { geraetId: string; ziele: Bereich[] }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(geraetVerschieben);
  if (ziele.length === 0) return <p className="text-sm text-steel">Kein anderer Bereich verfügbar.</p>;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="geraetId" value={geraetId} />
      <div>
        <label htmlFor={`ziel-${geraetId}`} className="label">
          Neuer Bereich
        </label>
        <select id={`ziel-${geraetId}`} name="bereichId" required defaultValue="" className="feld sm:w-72" {...feldProps(state, 'bereichId')}>
          <option value="" disabled>
            Bitte wählen
          </option>
          {ziele.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({EINSATZORT_LABEL[b.einsatzort]})
            </option>
          ))}
        </select>
        <FeldFehler state={state} feld="bereichId" />
      </div>
      <div>
        <label htmlFor={`verschieben-begruendung-${geraetId}`} className="label">
          Begründung (optional)
        </label>
        <input
          id={`verschieben-begruendung-${geraetId}`}
          name="begruendung"
          type="text"
          maxLength={500}
          className="feld"
          {...feldProps(state, 'begruendung')}
        />
        <FeldFehler state={state} feld="begruendung" />
      </div>
      <p className="text-xs text-steel">
        Fristen, Nachweise, Mängel, Anlässe und Prüfer-Zuweisungen bleiben. Ergibt der neue Einsatzort eine kürzere Frist,
        zeigt die Prüfart einen Hinweis.
      </p>
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-sekundaer" disabled={pending}>
        {pending ? 'Wird verschoben …' : 'Gerät verschieben'}
      </button>
    </form>
  );
}
