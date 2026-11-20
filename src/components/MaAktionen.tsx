'use client';

import Link from 'next/link';
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  INITIAL_ACTION_STATE,
  UEBERNAHME_HINWEIS_LABEL,
  type ActionState,
  type GeraetKurzansicht,
} from '@/domain/types';
import { geraetUebernehmen, geraetZurueckgeben } from '@/server/actions';
import { Meldung } from './Meldung';
import { PlaketteGlyph } from './PlaketteGlyph';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

// ---------------------------------------------------------------------------
// Meldungsbereich: Meldungen, deren Karte nach der Aktion verschwindet (/meine-geraete, §8.13)
// ---------------------------------------------------------------------------

type Melden = (state: ActionState, bezeichnung: string) => void;
const MeldungsKontext = createContext<Melden | null>(null);

/**
 * Hält Meldungen nach Aktionen oben auf der Seite, wenn die Karte danach verschwindet
 * (z. B. „Gerät zurückgegeben: Elektro-Hubwagen.“). Fokus auf die Meldung (§6.18).
 */
export function MaMeldungsBereich({ children }: { children: ReactNode }) {
  const [meldung, setMeldung] = useState<{ state: ActionState; bezeichnung: string; n: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const melden = useCallback<Melden>((state, bezeichnung) => setMeldung((alt) => ({ state, bezeichnung, n: (alt?.n ?? 0) + 1 })), []);

  useEffect(() => {
    if (meldung) ref.current?.focus();
  }, [meldung]);

  return (
    <MeldungsKontext.Provider value={melden}>
      <div ref={ref} tabIndex={-1} role="status" className="empty:hidden focus-visible:outline-offset-4">
        {meldung && (
          <Meldung art={meldung.state.status === 'ok' ? 'erfolg' : 'fehler'} live={false} className="text-base!">
            {meldung.state.status === 'ok' && meldung.state.meldung
              ? `${meldung.state.meldung.replace(/\.$/, '')}: ${meldung.bezeichnung}.`
              : meldung.state.meldung}
          </Meldung>
        )}
      </div>
      {children}
    </MeldungsKontext.Provider>
  );
}

function AktionsButton({ pending, haupt, children }: { pending: boolean; haupt: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={`btn ${haupt ? 'btn-primaer btn-haupt' : 'btn-sekundaer btn-halle'}`}
    >
      {pending && <PlaketteGlyph groesse={20} ton={haupt ? 'weiss' : 'steel'} className="animate-spin [animation-duration:1.2s]" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Aktionen je Zustand (§6.19)
// ---------------------------------------------------------------------------

interface Props {
  kurz: GeraetKurzansicht;
  /** Rücksprung für „Mangel melden“ (relativ, z. B. /g/{token} oder /meine-geraete). */
  zurueck: string;
}

/**
 * Aktionen Mitarbeiter (§6.19, §8.12): genau eine Hauptaktion (56 px), weitere 48 px, Hinweise vor den Buttons.
 * Übernehmen und Zurückgeben sind ein Tipp ohne Rückfrage (E-6). Meldung am Ort mit Fokus (§6.18).
 * Die Rechte prüft der Server; die Anzeige folgt nur der Kurzansicht.
 */
export function MaAktionen({ kurz, zurueck }: Props) {
  // Ohne JavaScript: beide Hooks immer aufrufen, damit das Ergebnis nach dem Neuladen am selben Ort ankommt,
  // auch wenn der Button gewechselt hat (Übernehmen ↔ Zurückgeben).
  const [uebernahmeState, uebernehmenAction] = useActionState(geraetUebernehmen, INITIAL_ACTION_STATE);
  const [rueckgabeState, zurueckgebenAction] = useActionState(geraetZurueckgeben, INITIAL_ACTION_STATE);
  // Mit JavaScript: direkter Aufruf, kein Neuladen.
  const [jsState, setJsState] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const melden = useContext(MeldungsKontext);
  const meldungRef = useRef<HTMLDivElement>(null);

  const anzeige = jsState ?? (uebernahmeState.status !== 'idle' ? uebernahmeState : rueckgabeState);

  useEffect(() => {
    if (jsState) meldungRef.current?.focus();
  }, [jsState]);

  const absenden = (action: Action) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const ergebnis = await action(INITIAL_ACTION_STATE, fd);
      startTransition(() => {
        // /meine-geraete: Die Karte verschwindet nach „Zurückgeben“, die Meldung steht oben (§8.13).
        if (melden && ergebnis.status === 'ok') melden(ergebnis, kurz.bezeichnung);
        else setJsState(ergebnis);
      });
    });
  };

  const vonMir = kurz.uebernahme === 'von_mir';
  const uebernehmbar = (kurz.uebernahme === 'frei' || kurz.uebernahme === 'von_anderen') && kurz.uebernahmeHinweis === null;
  // Hinweis nur, wenn das Gerät nicht ohnehin „meins“ ist (zugeordnet bzw. von mir übernommen).
  const hinweis = !vonMir && !uebernehmbar && !kurz.zugeordnetMir ? kurz.uebernahmeHinweis : null;
  const mangelHref = `/mangel-melden/${kurz.geraetId}?zurueck=${encodeURIComponent(zurueck)}`;
  const mangelIstHaupt = !vonMir && !uebernehmbar;

  return (
    <div className="space-y-3">
      <div ref={meldungRef} tabIndex={-1} role="status" className="empty:hidden focus-visible:outline-offset-4">
        {anzeige.status !== 'idle' && anzeige.meldung && (
          <Meldung art={anzeige.status === 'ok' ? 'erfolg' : 'fehler'} live={false} className="text-base!">
            {anzeige.meldung}
          </Meldung>
        )}
      </div>

      {uebernehmbar && kurz.uebernahme === 'von_anderen' && (
        <Meldung art="hinweis" className="text-base!">
          Wird von einer anderen Person genutzt.
          <span className="font-normal"> Wenn Sie übernehmen, endet deren Übernahme.</span>
        </Meldung>
      )}
      {uebernehmbar && kurz.nutzung === 'unklar' && (
        <Meldung art="warnung" live={false} className="text-base!">
          Prüfstatus unklar.
          <span className="font-normal"> Vor der Nutzung Verantwortlichen fragen.</span>
        </Meldung>
      )}
      {hinweis && (
        <Meldung art={hinweis === 'nicht_verwenden' ? 'fehler' : 'hinweis'} live={false} className="text-base!">
          {UEBERNAHME_HINWEIS_LABEL[hinweis]}
        </Meldung>
      )}

      <div className="aktionen-halle">
        {vonMir && (
          <form action={zurueckgebenAction} onSubmit={absenden(geraetZurueckgeben)} className="contents">
            <input type="hidden" name="geraetId" value={kurz.geraetId} />
            <AktionsButton pending={pending} haupt>
              Zurückgeben
            </AktionsButton>
          </form>
        )}
        {uebernehmbar && (
          <form action={uebernehmenAction} onSubmit={absenden(geraetUebernehmen)} className="contents">
            <input type="hidden" name="geraetId" value={kurz.geraetId} />
            <AktionsButton pending={pending} haupt>
              Gerät übernehmen
            </AktionsButton>
          </form>
        )}
        <Link href={mangelHref} className={`btn ${mangelIstHaupt ? 'btn-primaer btn-haupt' : 'btn-sekundaer btn-halle'}`}>
          Mangel melden
        </Link>
      </div>
    </div>
  );
}
