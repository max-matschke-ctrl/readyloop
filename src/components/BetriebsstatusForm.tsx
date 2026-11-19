'use client';

import { BETRIEBSSTATUS_LABEL, type Betriebsstatus, type WaehlbarerBetriebsstatus } from '@/domain/types';
import { betriebsstatusSetzen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

interface Props {
  geraetId: string;
  aktuell: Betriebsstatus;
  /** true, wenn eine Prüfart wegen „außer Betrieb, Frist abgelaufen“ vor Nutzung zu prüfen ist (F-11). */
  warnungAbgelaufen: boolean;
}

/** F-11: Umschalten in_betrieb ↔ ausser_betrieb; „ausgemustert“ ist in I2 nicht wählbar. */
export function BetriebsstatusForm({ geraetId, aktuell, warnungAbgelaufen }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(betriebsstatusSetzen);
  if (aktuell === 'ausgemustert') return null;
  const ziel: WaehlbarerBetriebsstatus = aktuell === 'in_betrieb' ? 'ausser_betrieb' : 'in_betrieb';
  const id = `betriebsstatus-begruendung-${geraetId}`;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="geraetId" value={geraetId} />
      <input type="hidden" name="betriebsstatus" value={ziel} />
      <p className="text-sm">
        Aktuell: <strong>{BETRIEBSSTATUS_LABEL[aktuell]}</strong>
      </p>
      {ziel === 'ausser_betrieb' && (
        <p className="text-xs text-steel">
          Außer Betrieb hemmt die Frist nicht. Eine abgelaufene Frist zeigt dann „Vor Nutzung prüfen“ statt „Überfällig“.
        </p>
      )}
      {ziel === 'in_betrieb' && warnungAbgelaufen && (
        <p role="alert" className="rounded border border-brick/50 bg-brick/10 px-3 py-2 text-sm font-medium">
          <span aria-hidden="true" className="mr-1 font-bold text-brick">
            ✕
          </span>
          Mindestens eine Frist ist abgelaufen. Nach dem Speichern ist das Gerät sofort „Überfällig – nicht verwenden“. Vor
          der Nutzung prüfen lassen.
        </p>
      )}
      <div>
        <label htmlFor={id} className="label">
          Begründung (optional)
        </label>
        <input id={id} name="begruendung" type="text" maxLength={500} className="feld" {...feldProps(state, 'begruendung')} />
        <FeldFehler state={state} feld="begruendung" />
      </div>
      <FeldFehler state={state} feld="betriebsstatus" />
      <ActionMeldung state={state} />
      <button type="submit" className="btn btn-sekundaer" disabled={pending}>
        {pending
          ? 'Wird gespeichert …'
          : ziel === 'in_betrieb'
            ? warnungAbgelaufen
              ? 'Trotzdem wieder in Betrieb nehmen'
              : 'Wieder in Betrieb nehmen'
            : 'Außer Betrieb setzen'}
      </button>
    </form>
  );
}
