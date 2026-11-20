'use client';

import type { IsoDate } from '@/domain/types';
import { mangelBeheben } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, Fehleruebersicht, useFormularAction } from './formular';

interface Props {
  mangelId: string;
  heute: IsoDate;
  /** Frühestes Behebungsdatum (Erfassungsdatum). */
  fruehestens: IsoDate;
}

/** F-14: → behoben. Endgültig, kein Rückweg. */
export function MangelBehebenForm({ mangelId, heute, fruehestens }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(mangelBeheben);
  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="mangelId" value={mangelId} />
      <Fehleruebersicht
        state={state}
        felder={{
          behobenAm: { id: 'beheben-am', label: 'Behoben am' },
          behobenDurch: { id: 'beheben-durch', label: 'Behoben durch' },
          behebung: { id: 'beheben-massnahme', label: 'Maßnahme' },
        }}
      />
      <FeldGruppe id="beheben-am" feld="behobenAm" label="Behoben am" state={state}>
        {(p) => <input {...p} name="behobenAm" type="date" required min={fruehestens} max={heute} defaultValue={heute} className="feld max-w-48 font-mono" />}
      </FeldGruppe>
      <FeldGruppe id="beheben-durch" feld="behobenDurch" label="Behoben durch" hilfe="Person oder Firma." state={state}>
        {(p) => <input {...p} name="behobenDurch" type="text" required minLength={2} maxLength={120} className="feld" />}
      </FeldGruppe>
      <FeldGruppe id="beheben-massnahme" feld="behebung" label="Maßnahme" state={state}>
        {(p) => <textarea {...p} name="behebung" rows={2} required minLength={5} maxLength={1000} className="feld" />}
      </FeldGruppe>
      <Meldung art="hinweis">Die Behebung ist endgültig. Ein neuer Befund wird als neuer Mangel erfasst.</Meldung>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Als behoben speichern</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
