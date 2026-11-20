'use client';

import { BETRIEBSSTATUS_LABEL, type Betriebsstatus, type WaehlbarerBetriebsstatus } from '@/domain/types';
import { betriebsstatusSetzen } from '@/server/actions';
import { Meldung } from './Meldung';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldFehler, FeldGruppe, useFormularAction } from './formular';

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
    <form action={formAction} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="geraetId" value={geraetId} />
      <input type="hidden" name="betriebsstatus" value={ziel} />
      <p className="text-sm">
        Aktuell: <strong className="font-semibold">{BETRIEBSSTATUS_LABEL[aktuell]}</strong>
      </p>
      {ziel === 'ausser_betrieb' && (
        <Meldung art="hinweis" text="Eine abgelaufene Frist zeigt dann „Vor Nutzung prüfen“ statt „Überfällig“.">
          Außer Betrieb hemmt die Frist nicht.
        </Meldung>
      )}
      {ziel === 'in_betrieb' && warnungAbgelaufen && (
        <Meldung art="fehler" text="Vor der Nutzung prüfen lassen.">
          Mindestens eine Frist ist abgelaufen. Nach dem Speichern ist das Gerät sofort „Überfällig – nicht verwenden“.
        </Meldung>
      )}
      <FeldGruppe id={id} feld="begruendung" label="Begründung" optional state={state}>
        {(p) => <input {...p} name="begruendung" type="text" maxLength={500} className="feld" />}
      </FeldGruppe>
      <FeldFehler state={state} feld="betriebsstatus" />
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending} art="sekundaer">
          {ziel === 'in_betrieb' ? (warnungAbgelaufen ? 'Trotzdem wieder in Betrieb nehmen' : 'Wieder in Betrieb nehmen') : 'Außer Betrieb setzen'}
        </AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}
