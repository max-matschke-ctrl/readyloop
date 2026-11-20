import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { PrueferAufgabe } from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { datum, restTageText } from './format';

/** Prüfaufgabe als Karte (§8.7): Plakette 56, nur Gerätename und Hauptaktion sind Ziele, keine Wischgesten. */
function Aufgabe({ a }: { a: PrueferAufgabe }) {
  const { pruefart, status, weiterbetriebUnzulaessig } = a.pruefartAnsicht;
  const rest = restTageText(status.restTage);
  const geraetDetails = [a.geraet.hersteller, a.geraet.typ, a.geraet.seriennummer && `SN ${a.geraet.seriennummer}`].filter(Boolean);
  const titelId = `aufgabe-${pruefart.id}`;
  return (
    <li>
      <article aria-labelledby={titelId} className="karte overflow-hidden">
        {weiterbetriebUnzulaessig && (
          <p className="flex items-start gap-2.5 border-b border-l-4 border-b-steel-200 border-l-brick bg-brick-50 px-4 py-2.5 text-sm font-semibold text-ink">
            <span
              aria-hidden="true"
              className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brick text-xs font-bold leading-none text-white"
            >
              ✕
            </span>
            Weiterbetrieb nicht zulässig: letzte Prüfung nicht bestanden.
          </p>
        )}
        <div className="flex gap-4 p-4">
          <Pruefplakette status={status.status} faelligAm={status.faelligAm} groesse={56} />
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <h3 id={titelId} className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal [overflow-wrap:anywhere]">
              <Link
                href={`/geraete/${a.geraet.id}`}
                className="relative -my-3 inline-block py-3 underline decoration-steel-200 underline-offset-4 hover:decoration-steel"
              >
                {a.geraet.bezeichnung}
              </Link>
            </h3>
            <p className="text-steel">
              <span className="font-mono">{a.geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, Bereich </span>
              {a.bereichName}
            </p>
            {geraetDetails.length > 0 && <p className="text-steel [overflow-wrap:anywhere]">{geraetDetails.join(', ')}</p>}
            <p className="pt-1 font-medium text-ink [overflow-wrap:anywhere]">{pruefart.bezeichnung}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
              <StatusAmpel status={status.status} grund={status.grund} kurz className="text-sm!" />
              <span>
                {status.faelligAm ? (
                  <>
                    fällig <span className="font-mono tabular-nums">{datum(status.faelligAm)}</span>
                    {rest && <span className="block text-steel">{rest}</span>}
                  </>
                ) : (
                  <span className="text-steel">ohne Fälligkeitstermin</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Link href={`/nachweise/neu/${pruefart.id}`} className="btn btn-primaer min-h-14 w-full text-base">
            Nachweis erfassen<span className="sr-only">: {a.geraet.bezeichnung}, {pruefart.bezeichnung}</span>
          </Link>
        </div>
      </article>
    </li>
  );
}

function Karten({ liste }: { liste: PrueferAufgabe[] }) {
  return (
    <ul className="space-y-3">
      {liste.map((a) => (
        <Aufgabe key={a.pruefartAnsicht.pruefart.id} a={a} />
      ))}
    </ul>
  );
}

/** Prüfaufgaben (§8.7): „Fällig oder ohne Termin“ offen, „Später“ als zugeklappte Disclosure mit Anzahl. */
export function PrueferAufgabenListe({ aufgaben }: { aufgaben: PrueferAufgabe[] }) {
  const faellig = aufgaben.filter((a) => a.gruppe === 'faellig');
  const spaeter = aufgaben.filter((a) => a.gruppe === 'spaeter');

  return (
    <div className="space-y-8">
      <section aria-labelledby="gruppe-faellig" className="space-y-3">
        <h2 id="gruppe-faellig" className="text-xl font-semibold leading-7">
          Fällig oder ohne Termin <span className="font-sans text-base font-normal text-steel">({faellig.length})</span>
        </h2>
        {faellig.length === 0 ? (
          <Leerzustand
            art="erledigt"
            ebene="h3"
            titel="Keine fälligen Prüfungen."
            text={spaeter.length > 0 ? 'Die nächsten Termine stehen unter „Später“.' : 'Neue Aufgaben erscheinen hier, sobald ein Betrieb Sie zuweist.'}
          />
        ) : (
          <Karten liste={faellig} />
        )}
      </section>

      {spaeter.length > 0 && (
        <section aria-labelledby="gruppe-spaeter">
          <details className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-flaeche border border-steel-200 bg-white px-4 hover:bg-steel-50 [&::-webkit-details-marker]:hidden">
              <h2 id="gruppe-spaeter" className="text-xl font-semibold leading-7">
                Später <span className="font-sans text-base font-normal text-steel">({spaeter.length})</span>
              </h2>
              <ChevronDown
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-steel transition-transform duration-[var(--dauer-mittel)] group-open:rotate-180"
              />
            </summary>
            <div className="pt-3">
              <Karten liste={spaeter} />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
