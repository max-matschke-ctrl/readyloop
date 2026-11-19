'use client';

import { startTransition, useActionState, type FormEvent } from 'react';
import { INITIAL_ACTION_STATE, type ActionState } from '@/domain/types';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * useActionState mit eigenem Submit: verhindert, dass React 19 das Formular nach einem
 * Fehler zurücksetzt (Eingaben und gewählte PDF bleiben erhalten). `action` bleibt als Fallback ohne JS.
 */
export function useFormularAction(action: Action) {
  const [state, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  };
  return { state, formAction, pending, onSubmit };
}

export function fehlerId(feld: string): string {
  return `fehler-${feld.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

/** Feldfehler unter dem Feld; mit aria-describedby={fehlerId(feld)} am Eingabefeld verknüpfen. */
export function FeldFehler({ state, feld }: { state: ActionState; feld: string }) {
  const fehler = state.feldfehler?.[feld];
  if (!fehler?.length) return null;
  return (
    <p id={fehlerId(feld)} className="mt-1 text-sm text-brick">
      {fehler.join(' ')}
    </p>
  );
}

export function feldProps(state: ActionState, feld: string) {
  const hatFehler = Boolean(state.feldfehler?.[feld]?.length);
  return {
    'aria-invalid': hatFehler || undefined,
    'aria-describedby': hatFehler ? fehlerId(feld) : undefined,
  } as const;
}

/** Meldung der Action (Erfolg oder Fehler) als Live-Region. */
export function ActionMeldung({ state }: { state: ActionState }) {
  return (
    <div aria-live="polite">
      {state.status !== 'idle' && state.meldung && (
        <p
          className={`rounded border px-3 py-2 text-sm ${
            state.status === 'ok' ? 'border-moss/50 bg-moss/10 text-ink' : 'border-brick/50 bg-brick/10 text-ink'
          }`}
        >
          <span aria-hidden="true" className="mr-1 font-bold">
            {state.status === 'ok' ? '✓' : '✕'}
          </span>
          {state.meldung}
        </p>
      )}
    </div>
  );
}
