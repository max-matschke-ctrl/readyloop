'use client';

import { Mail } from 'lucide-react';
import { erinnerungslaufStarten } from '@/server/actions';
import { AbsendenButton, ActionMeldung, FeldGruppe, useGeprueftesFormular } from './formular';

interface Props {
  heute: string;
  /** Nur im Demo-Modus: Datum des Laufs wählbar. */
  datumWaehlbar: boolean;
}

/** Erinnerungslauf auslösen (§8.23, F-37): Datum nur im Demo-Modus, Meldung der Action wörtlich. Ohne JavaScript nutzbar. */
export function ErinnerungslaufForm({ heute, datumWaehlbar }: Props) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(erinnerungslaufStarten);
  return (
    <section aria-labelledby="lauf-titel" className="karte max-w-[40rem] space-y-3 p-4">
      <h2 id="lauf-titel" className="text-[1.0625rem] font-semibold leading-6">
        Erinnerungslauf
      </h2>
      <form action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="space-y-3">
        {datumWaehlbar && (
          <FeldGruppe id="lauf-heute" feld="heute" label="Datum des Laufs" state={state}>
            {(p) => <input {...p} name="heute" type="date" required defaultValue={heute} className="feld w-44" />}
          </FeldGruppe>
        )}
        <ActionMeldung state={state} />
        <div className="space-y-1">
          <AbsendenButton pending={pending}>
            {!pending && <Mail aria-hidden="true" size={16} strokeWidth={1.75} />}
            Erinnerungslauf jetzt ausführen
          </AbsendenButton>
          <p className="text-xs text-steel">Erzeugt die Mails dieses Tages. Bereits erinnerte Prüfungen werden übersprungen.</p>
        </div>
      </form>
    </section>
  );
}
