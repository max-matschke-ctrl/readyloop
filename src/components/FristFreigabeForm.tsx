'use client';

import { useState } from 'react';
import { fristFreigeben } from '@/server/actions';
import { Meldung } from './Meldung';
import { Unteraufklapper } from './Unteraufklapper';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldFehler,
  FeldGruppe,
  Fehleruebersicht,
  useFormularAction,
  useGeprueftesFormular,
} from './formular';

interface Props {
  geraetPruefartId: string;
  /** Text des freigebbaren Vorschlags (katalog/hersteller); null = kein Vorschlag-Button. */
  vorschlagText: string | null;
  /** „Frist über GBU festlegen“ bzw. „Abweichende Frist festlegen“. */
  gbuTitel: string;
  gbuOffen: boolean;
  /** Obergrenze als Hinweis (Herstellerfrist/Höchstfrist); der Server prüft verbindlich. */
  hinweisObergrenze: string | null;
  /** F-13: Frist nach Prüfergebnis – Nachweisbezug und vorbelegte Monate (Empfehlung des Prüfers). */
  nachErgebnis?: { nachweisId: string; nachweisText: string; monate: number | null } | null;
  /** Aktuelle Frist in Monaten (für den Richtungshinweis). */
  aktuelleMonate?: number | null;
}

function richtungText(alt: number | null | undefined, neu: number): string | null {
  if (alt === null || alt === undefined || !Number.isFinite(neu) || neu < 1) return null;
  if (neu < alt) return `kürzer als die aktuelle Frist (${alt} Monate)`;
  if (neu > alt) return `länger als die aktuelle Frist (${alt} Monate)`;
  return `gleich der aktuellen Frist (${alt} Monate)`;
}

export function FristFreigabeForm({
  geraetPruefartId,
  vorschlagText,
  gbuTitel,
  gbuOffen,
  hinweisObergrenze,
  nachErgebnis = null,
  aktuelleMonate = null,
}: Props) {
  const vorschlag = useFormularAction(fristFreigeben);
  const gbu = useGeprueftesFormular(fristFreigeben);
  const id = (feld: string) => `${feld}-${geraetPruefartId}`;
  const [monateEingabe, setMonateEingabe] = useState<string>(nachErgebnis?.monate ? String(nachErgebnis.monate) : '');
  const richtung = richtungText(aktuelleMonate, Number(monateEingabe));

  return (
    <div className="space-y-3">
      {vorschlagText && (
        <form action={vorschlag.formAction} onSubmit={vorschlag.onSubmit} className="space-y-2">
          <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
          <input type="hidden" name="modus" value="vorschlag" />
          <AbsendenButton pending={vorschlag.pending}>
            Vorschlag freigeben<span className="sr-only">: {vorschlagText}</span>
          </AbsendenButton>
          <ActionMeldung state={vorschlag.state} />
        </form>
      )}

      <Unteraufklapper
        id={id('gbu-form')}
        offen={gbuOffen}
        titel={nachErgebnis ? 'Frist nach Prüfung festlegen' : gbuTitel}
        zusammenfassung={aktuelleMonate !== null ? `Aktuell: ${aktuelleMonate} Monate` : 'Mit Fundstelle und Begründung aus der GBU'}
      >
        <form action={gbu.formAction} onSubmit={gbu.onSubmit} noValidate={gbu.noValidate} className="space-y-4">
          <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
          <input type="hidden" name="modus" value="gbu" />
          <input type="hidden" name="nachweisId" value={nachErgebnis?.nachweisId ?? ''} />
          <Fehleruebersicht
            state={gbu.state}
            felder={{
              monate: { id: id('monate'), label: 'Frist' },
              fundstelle: { id: id('fundstelle'), label: 'Fundstelle in der GBU' },
              begruendung: { id: id('begruendung'), label: 'Begründung' },
            }}
          />
          {nachErgebnis && (
            <p className="text-sm">
              Bezug: {nachErgebnis.nachweisText}
              {nachErgebnis.monate !== null && <>. Empfehlung des Prüfers: {nachErgebnis.monate} Monate</>}
            </p>
          )}
          {hinweisObergrenze && (
            <Meldung art="hinweis">{hinweisObergrenze}</Meldung>
          )}
          <FeldGruppe id={id('monate')} feld="monate" label="Frist" einheit="Monate" state={gbu.state}>
            {(p) => (
              <input
                {...p}
                name="monate"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                required
                value={monateEingabe}
                onChange={(e) => setMonateEingabe(e.currentTarget.value)}
                className="feld pr-20 font-mono"
              />
            )}
          </FeldGruppe>
          {richtung && (
            <p className="-mt-2 text-xs text-steel" aria-live="polite">
              Neue Frist ist {richtung}.
            </p>
          )}
          <FeldGruppe id={id('fundstelle')} feld="fundstelle" label="Fundstelle in der GBU" state={gbu.state}>
            {(p) => (
              <input
                {...p}
                name="fundstelle"
                type="text"
                minLength={3}
                maxLength={200}
                required
                placeholder="z. B. GBU Lager 2026, Abschn. 4.2"
                className="feld"
              />
            )}
          </FeldGruppe>
          <FeldGruppe
            id={id('begruendung')}
            feld="begruendung"
            label="Begründung"
            hilfe="Warum gilt diese Frist? Mindestens 10 Zeichen."
            state={gbu.state}
          >
            {(p) => <textarea {...p} name="begruendung" rows={3} minLength={10} maxLength={1000} required className="feld" />}
          </FeldGruppe>
          <FeldFehler state={gbu.state} feld="nachweisId" />
          <FeldFehler state={gbu.state} feld="geraetPruefartId" />
          <ActionMeldung state={gbu.state} />
          <Aktionsleiste>
            <AbsendenButton pending={gbu.pending}>Frist festlegen und freigeben</AbsendenButton>
          </Aktionsleiste>
        </form>
      </Unteraufklapper>
    </div>
  );
}
