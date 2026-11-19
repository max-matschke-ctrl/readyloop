'use client';

import type { GbuDokument } from '@/domain/types';
import { gbuDokumentSetzen } from '@/server/actions';
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';

/** F-18: Titel + optional https-Link. Titel leeren = Verweis entfernen. Kein Upload. */
export function GbuVerweisForm({ geraetPruefartId, aktuell }: { geraetPruefartId: string; aktuell: GbuDokument | null }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(gbuDokumentSetzen);
  const id = (n: string) => `gbu-${n}-${geraetPruefartId}`;

  return (
    <details className="rounded border border-steel/25 bg-paper/60">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        {aktuell ? 'GBU-Verweis ändern' : 'GBU-Verweis hinterlegen'}
      </summary>
      <form action={formAction} onSubmit={onSubmit} className="space-y-3 px-3 pb-3 pt-1" noValidate>
        <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={id('titel')} className="label">
              Titel
            </label>
            <input
              id={id('titel')}
              name="titel"
              type="text"
              maxLength={200}
              defaultValue={aktuell?.titel}
              placeholder="z. B. GBU Lager 2025, Abschn. 3"
              className="feld"
              {...feldProps(state, 'titel')}
            />
            <FeldFehler state={state} feld="titel" />
          </div>
          <div>
            <label htmlFor={id('url')} className="label">
              Link (optional, nur https)
            </label>
            <input
              id={id('url')}
              name="url"
              type="url"
              inputMode="url"
              maxLength={500}
              defaultValue={aktuell?.url ?? ''}
              placeholder="https://…"
              className="feld font-mono"
              {...feldProps(state, 'url')}
            />
            <FeldFehler state={state} feld="url" />
          </div>
        </div>
        <p className="text-xs text-steel">Titel leeren und speichern entfernt den Verweis.</p>
        <ActionMeldung state={state} />
        <button type="submit" className="btn btn-sekundaer" disabled={pending}>
          {pending ? 'Wird gespeichert …' : 'GBU-Verweis speichern'}
        </button>
      </form>
    </details>
  );
}
