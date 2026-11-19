'use client';

import { ROLLE_LABEL, type Id, type OrganisationOption } from '@/domain/types';
import { waehleOrganisation } from '@/server/actions';
import { ActionMeldung, useFormularAction } from './formular';

export function OrganisationWahl({ organisationen, aktuellId }: { organisationen: OrganisationOption[]; aktuellId: Id | null }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(waehleOrganisation);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <ul className="grid gap-2">
        {organisationen.map((o) => {
          const aktuell = o.id === aktuellId;
          return (
            <li key={o.id}>
              <button
                type="submit"
                name="organisationId"
                value={o.id}
                disabled={pending}
                aria-current={aktuell ? 'true' : undefined}
                className={`karte flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:border-steel hover:bg-steel-hell/40 disabled:opacity-60 ${
                  aktuell ? 'border-steel ring-1 ring-steel' : ''
                }`}
              >
                <span>
                  <span className="block font-display font-semibold">{o.name}</span>
                  <span className="block text-sm text-steel">{ROLLE_LABEL[o.rolle]}</span>
                </span>
                {aktuell && (
                  <span className="rounded border border-steel/50 px-1.5 py-0.5 text-xs">
                    <span aria-hidden="true">✓ </span>aktuell
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <ActionMeldung state={state} />
      {pending && <p className="text-sm text-steel">Wechsel läuft …</p>}
    </form>
  );
}
