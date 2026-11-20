'use client';

import { ANLASS_ART_LABEL, ANLASS_ARTEN, type IsoDate } from '@/domain/types';
import { anlassAufheben, anlassErfassen } from '@/server/actions';
import { Meldung } from './Meldung';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  FeldGruppe,
  Fehleruebersicht,
  fehlerId,
  useFormularAction,
} from './formular';

interface Props {
  geraetId: string;
  pruefarten: { id: string; bezeichnung: string }[];
  heute: IsoDate;
}

/** F-10: Anlass für 1..n Prüfarten; Datum ≤ heute; Beschreibung Pflicht. */
export function AnlassForm({ geraetId, pruefarten, heute }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(anlassErfassen);
  const id = (n: string) => `anlass-${n}-${geraetId}`;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="geraetId" value={geraetId} />
      <Fehleruebersicht
        state={state}
        felder={{
          art: { id: id('art'), label: 'Anlass' },
          datum: { id: id('datum'), label: 'Datum' },
          beschreibung: { id: id('beschreibung'), label: 'Beschreibung' },
          geraetPruefartIds: { id: id(`pa-${pruefarten[0]?.id ?? ''}`), label: 'Betroffene Prüfarten' },
        }}
      />
      <FeldGruppe id={id('art')} feld="art" label="Anlass" state={state}>
        {(p) => (
          <select {...p} name="art" required defaultValue="" className="feld">
            <option value="" disabled>
              Bitte wählen
            </option>
            {ANLASS_ARTEN.map((a) => (
              <option key={a} value={a}>
                {ANLASS_ART_LABEL[a]}
              </option>
            ))}
          </select>
        )}
      </FeldGruppe>
      <FeldGruppe id={id('datum')} feld="datum" label="Datum" state={state}>
        {(p) => <input {...p} name="datum" type="date" required defaultValue={heute} max={heute} className="feld max-w-48 font-mono" />}
      </FeldGruppe>
      <FeldGruppe id={id('beschreibung')} feld="beschreibung" label="Beschreibung" hilfe="Was ist passiert?" state={state}>
        {(p) => <textarea {...p} name="beschreibung" rows={2} required minLength={5} maxLength={1000} className="feld" />}
      </FeldGruppe>
      <fieldset aria-describedby={state.feldfehler?.geraetPruefartIds?.length ? fehlerId('geraetPruefartIds') : undefined}>
        <legend className="label">Betroffene Prüfarten</legend>
        <ul className="space-y-1">
          {pruefarten.map((p) => (
            <li key={p.id}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <input
                  id={id(`pa-${p.id}`)}
                  type="checkbox"
                  name="geraetPruefartIds"
                  value={p.id}
                  defaultChecked={pruefarten.length === 1}
                  className="size-5 shrink-0 accent-steel"
                />
                {p.bezeichnung}
              </label>
            </li>
          ))}
        </ul>
        <FeldFehler state={state} feld="geraetPruefartIds" />
      </fieldset>
      <Meldung art="warnung">
        Die gewählten Prüfarten stehen danach auf „Vor Nutzung prüfen – nicht verwenden“, bis ein bestandener Nachweis vorliegt.
      </Meldung>
      <ActionMeldung state={state} />
      <Aktionsleiste>
        <AbsendenButton pending={pending}>Anlass erfassen</AbsendenButton>
      </Aktionsleiste>
    </form>
  );
}

/** Q-25: Aufheben mit Begründung ≥ 10 Zeichen; bleibt im Verlauf sichtbar. */
export function AnlassAufhebenForm({ anlassId }: { anlassId: string }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(anlassAufheben);
  const feld = `aufheben-grund-${anlassId}`;
  return (
    <details className="group/a">
      <summary className="link inline-flex min-h-8 w-fit cursor-pointer list-none items-center text-sm [&::-webkit-details-marker]:hidden">
        Anlass aufheben
      </summary>
      <form action={formAction} onSubmit={onSubmit} className="mt-2 space-y-3" noValidate>
        <input type="hidden" name="anlassId" value={anlassId} />
        <FeldGruppe id={feld} feld="grund" label="Begründung" hilfe="Mindestens 10 Zeichen. Bleibt im Verlauf sichtbar." state={state}>
          {(p) => <input {...p} name="grund" type="text" required minLength={10} maxLength={500} className="feld" />}
        </FeldGruppe>
        <ActionMeldung state={state} />
        <Aktionsleiste>
          <AbsendenButton pending={pending} art="gefaehrlich">
            Anlass aufheben
          </AbsendenButton>
        </Aktionsleiste>
      </form>
    </details>
  );
}
