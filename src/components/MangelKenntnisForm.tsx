'use client';

import type { IsoDate, PersonOption } from '@/domain/types';
import { mangelKenntnisNehmen } from '@/server/actions';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, Fehleruebersicht, useFormularAction } from './formular';

interface Props {
  mangelId: string;
  verantwortliche: PersonOption[];
  vorbelegtVerantwortlich: string | null;
  termin: IsoDate;
  heute: IsoDate;
}

/** F-14: offen → in_bearbeitung; Verantwortlicher und Termin festlegen. Name und Zeitpunkt stempelt der Server. */
export function MangelKenntnisForm({ mangelId, verantwortliche, vorbelegtVerantwortlich, termin, heute }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(mangelKenntnisNehmen);
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="mangelId" value={mangelId} />
      <Fehleruebersicht
        state={state}
        felder={{ verantwortlichId: { id: 'kenntnis-verantwortlich', label: 'Verantwortlich' }, termin: { id: 'kenntnis-termin', label: 'Frist' } }}
      />
      <FeldGruppe id="kenntnis-verantwortlich" feld="verantwortlichId" label="Verantwortlich" state={state}>
        {(p) => (
          <select {...p} name="verantwortlichId" required defaultValue={vorbelegtVerantwortlich ?? ''} className="feld">
            <option value="" disabled>
              Bitte wählen
            </option>
            {verantwortliche.map((pe) => (
              <option key={pe.benutzerId} value={pe.benutzerId}>
                {pe.name}
              </option>
            ))}
          </select>
        )}
      </FeldGruppe>
      <FeldGruppe id="kenntnis-termin" feld="termin" label="Frist zur Behebung" state={state}>
        {(p) => <input {...p} name="termin" type="date" required min={heute} defaultValue={termin < heute ? heute : termin} className="feld max-w-48 font-mono" />}
      </FeldGruppe>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Zur Kenntnis nehmen</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
