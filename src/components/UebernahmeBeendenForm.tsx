'use client';

import { uebernahmeBeenden } from '@/server/actions';
import { AbsendenButton, ActionMeldung, useFormularAction } from './formular';

/**
 * „Übernahme beenden“ durch Verantwortliche (F-23 c, §8.16): ohne Rückfrage, umkehrbar durch erneute Übernahme.
 * Bleibt nach dem Beenden stehen (offen = false), damit die Meldung sichtbar bleibt.
 */
export function UebernahmeBeendenForm({ geraetId, offen }: { geraetId: string; offen: boolean }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(uebernahmeBeenden);
  if (!offen && state.status === 'idle') return null;
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="geraetId" value={geraetId} />
      <ActionMeldung state={state} />
      {offen && (
        <AbsendenButton pending={pending} art="sekundaer">
          Übernahme beenden
        </AbsendenButton>
      )}
    </form>
  );
}
