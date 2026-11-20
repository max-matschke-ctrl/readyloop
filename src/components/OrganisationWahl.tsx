'use client';

import { ChevronRight } from 'lucide-react';
import { ROLLE_LABEL, type Id, type OrganisationOption } from '@/domain/types';
import { waehleOrganisation } from '@/server/actions';
import { PlaketteGlyph } from './PlaketteGlyph';
import { ActionMeldung, useFormularAction } from './formular';

/** Betriebe als große Zeilen (§8.3, min. 56 px), je Zeile ein Button; per Tab und Enter bedienbar. */
export function OrganisationWahl({ organisationen, aktuellId }: { organisationen: OrganisationOption[]; aktuellId: Id | null }) {
  const { state, formAction, pending, onSubmit } = useFormularAction(waehleOrganisation);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3" aria-busy={pending || undefined}>
      <ul className="karte divide-y divide-steel-200 overflow-hidden">
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
                className={`flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-steel-50 focus-visible:-outline-offset-2 disabled:cursor-progress ${
                  aktuell ? 'bg-steel-50 shadow-[inset_4px_0_0_var(--color-steel)]' : 'bg-white'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-sans text-[1.0625rem] font-semibold leading-6 text-ink [overflow-wrap:anywhere]">{o.name}</span>
                  <span className="block text-sm text-steel">
                    {ROLLE_LABEL[o.rolle]}
                    {aktuell && ' · aktuell gewählt'}
                  </span>
                </span>
                {pending ? (
                  <PlaketteGlyph groesse={20} className="animate-spin [animation-duration:1.2s]" />
                ) : (
                  <ChevronRight aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0 text-steel" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <ActionMeldung state={state} />
    </form>
  );
}
