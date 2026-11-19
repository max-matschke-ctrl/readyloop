'use client';

import { useState } from 'react';
import { fristFreigeben } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

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
  const gbu = useFormularAction(fristFreigeben);
  const id = (feld: string) => `${feld}-${geraetPruefartId}`;
  const [monateEingabe, setMonateEingabe] = useState<string>(nachErgebnis?.monate ? String(nachErgebnis.monate) : '');
  const richtung = richtungText(aktuelleMonate, Number(monateEingabe));

  return (
    <div className="space-y-3">
      {vorschlagText && (
        <form action={vorschlag.formAction} onSubmit={vorschlag.onSubmit} className="space-y-2">
          <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
          <input type="hidden" name="modus" value="vorschlag" />
          <button type="submit" className="btn btn-primaer" disabled={vorschlag.pending}>
            {vorschlag.pending ? 'Wird freigegeben …' : 'Vorschlag freigeben'}
          </button>
          <span className="sr-only">: {vorschlagText}</span>
          <ActionMeldung state={vorschlag.state} />
        </form>
      )}

      <details open={gbuOffen} id={id('gbu-form')} className="rounded border border-steel/25 bg-paper/60">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          {nachErgebnis ? 'Frist nach Prüfung festlegen' : gbuTitel}
        </summary>
        <form action={gbu.formAction} onSubmit={gbu.onSubmit} className="space-y-3 px-3 pb-3 pt-1">
          <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
          <input type="hidden" name="modus" value="gbu" />
          <input type="hidden" name="nachweisId" value={nachErgebnis?.nachweisId ?? ''} />
          {nachErgebnis && (
            <p className="text-sm">
              Bezug: {nachErgebnis.nachweisText}
              {nachErgebnis.monate !== null && <> · Empfehlung des Prüfers: {nachErgebnis.monate} Monate</>}
            </p>
          )}
          {hinweisObergrenze && <p className="text-xs text-steel">{hinweisObergrenze}</p>}
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div>
              <label htmlFor={id('monate')} className="label">
                Frist (Monate)
              </label>
              <input
                id={id('monate')}
                name="monate"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                required
                value={monateEingabe}
                onChange={(e) => setMonateEingabe(e.currentTarget.value)}
                className="feld font-mono"
                {...feldProps(gbu.state, 'monate')}
              />
              <FeldFehler state={gbu.state} feld="monate" />
            </div>
            <div>
              <label htmlFor={id('fundstelle')} className="label">
                Fundstelle GBU
              </label>
              <input
                id={id('fundstelle')}
                name="fundstelle"
                type="text"
                minLength={3}
                maxLength={200}
                required
                placeholder="z. B. GBU Lager 2026, Abschn. 4.2"
                className="feld"
                {...feldProps(gbu.state, 'fundstelle')}
              />
              <FeldFehler state={gbu.state} feld="fundstelle" />
            </div>
          </div>
          <div>
            <label htmlFor={id('begruendung')} className="label">
              Begründung
            </label>
            <textarea
              id={id('begruendung')}
              name="begruendung"
              rows={3}
              minLength={10}
              maxLength={1000}
              required
              className="feld"
              {...feldProps(gbu.state, 'begruendung')}
            />
            <FeldFehler state={gbu.state} feld="begruendung" />
          </div>
          {richtung && (
            <p className="text-xs text-steel" aria-live="polite">
              Neue Frist ist {richtung}.
            </p>
          )}
          <FeldFehler state={gbu.state} feld="nachweisId" />
          <FeldFehler state={gbu.state} feld="geraetPruefartId" />
          <ActionMeldung state={gbu.state} />
          <button type="submit" className="btn btn-primaer" disabled={gbu.pending}>
            {gbu.pending ? 'Wird gespeichert …' : 'Frist festlegen und freigeben'}
          </button>
        </form>
      </details>
    </div>
  );
}
