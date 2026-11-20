'use client';

import { EINSATZORT_LABEL, type Bereich } from '@/domain/types';
import { geraetVerschieben } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, useGeprueftesFormular } from './formular';

/** F-16: Ziele = Bereiche im Geltungsbereich ohne den aktuellen. Der Server prüft darfVerschieben. */
export function GeraetVerschiebenForm({ geraetId, ziele }: { geraetId: string; ziele: Bereich[] }) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(geraetVerschieben);
  if (ziele.length === 0) return <p className="text-sm text-steel">Kein anderer Bereich verfügbar.</p>;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="space-y-4">
      <input type="hidden" name="geraetId" value={geraetId} />
      <FeldGruppe id={`ziel-${geraetId}`} feld="bereichId" label="Neuer Bereich" state={state}>
        {(p) => (
          <select {...p} name="bereichId" required defaultValue="" className="feld">
            <option value="" disabled>
              Bitte wählen
            </option>
            {ziele.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({EINSATZORT_LABEL[b.einsatzort]})
              </option>
            ))}
          </select>
        )}
      </FeldGruppe>
      <FeldGruppe id={`verschieben-begruendung-${geraetId}`} feld="begruendung" label="Begründung" optional state={state}>
        {(p) => <input {...p} name="begruendung" type="text" maxLength={500} className="feld" />}
      </FeldGruppe>
      <Meldung art="hinweis" text="Ergibt der neue Einsatzort eine kürzere Frist, zeigt die Prüfart einen Hinweis.">
        Fristen, Nachweise, Mängel, Anlässe und Prüfer-Zuweisungen bleiben erhalten.
      </Meldung>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending} art="sekundaer">
          Gerät verschieben
        </AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
