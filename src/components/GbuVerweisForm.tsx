'use client';

import type { GbuDokument } from '@/domain/types';
import { gbuDokumentSetzen } from '@/server/actions';
import { Unteraufklapper } from './Unteraufklapper';
import { AbsendenButton, ActionMeldung, Aktionsleiste, FeldGruppe, useFormularAction } from './formular';

/** F-18: Titel + optional https-Link. Titel leeren = Verweis entfernen. Kein Upload. */
export function GbuVerweisForm({ geraetPruefartId, aktuell }: { geraetPruefartId: string; aktuell: GbuDokument | null }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(gbuDokumentSetzen);
  const id = (n: string) => `gbu-${n}-${geraetPruefartId}`;

  return (
    <Unteraufklapper
      titel={aktuell ? 'GBU-Verweis ändern' : 'GBU-Verweis hinterlegen'}
      zusammenfassung={aktuell ? `Aktuell: ${aktuell.titel}` : 'Aktuell: kein Verweis'}
    >
      <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="geraetPruefartId" value={geraetPruefartId} />
        <FeldGruppe id={id('titel')} feld="titel" label="Titel" hilfe="Titel leeren und speichern entfernt den Verweis." state={state}>
          {(p) => (
            <input {...p} name="titel" type="text" maxLength={200} defaultValue={aktuell?.titel} placeholder="z. B. GBU Lager 2025, Abschn. 3" className="feld" />
          )}
        </FeldGruppe>
        <FeldGruppe id={id('url')} feld="url" label="Link" optional hilfe="Nur https-Adressen." state={state}>
          {(p) => (
            <input
              {...p}
              name="url"
              type="url"
              inputMode="url"
              maxLength={500}
              defaultValue={aktuell?.url ?? ''}
              placeholder="https://…"
              className="feld font-mono"
            />
          )}
        </FeldGruppe>
        <ActionMeldung state={state} />
        <Aktionsleiste>
          <AbsendenButton pending={pending} art="sekundaer">
            GBU-Verweis speichern
          </AbsendenButton>
        </Aktionsleiste>
      </form>
    </Unteraufklapper>
  );
}
