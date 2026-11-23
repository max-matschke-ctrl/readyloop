'use client';

import type { PersonOption } from '@/domain/types';
import { geraetZuordnen } from '@/server/actions';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, useFormularAction } from './formular';

interface Props {
  geraetId: string;
  aktuell: PersonOption | null;
  optionen: PersonOption[];
}

/** Zuordnung personenbezogener Geräte (F-22, US-29, §8.16): leere Auswahl löst die Zuordnung. */
export function ZuordnungForm({ geraetId, aktuell, optionen }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(geraetZuordnen);
  const id = `zuordnung-${geraetId}`;
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="geraetId" value={geraetId} />
      <FeldGruppe id={id} feld="benutzerId" label="Mitarbeiter" state={state}>
        {(p) => (
          <select {...p} name="benutzerId" defaultValue={aktuell?.benutzerId ?? ''} className="feld">
            <option value="">– keine Zuordnung –</option>
            {optionen.map((o) => (
              <option key={o.benutzerId} value={o.benutzerId}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Zuordnung speichern</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
