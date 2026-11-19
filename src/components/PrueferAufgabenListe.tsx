import Link from 'next/link';
import type { PrueferAufgabe } from '@/domain/types';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { datum, restTageText } from './format';

function Aufgabe({ a }: { a: PrueferAufgabe }) {
  const { pruefart, status } = a.pruefartAnsicht;
  const rest = restTageText(status.restTage);
  const geraetDetails = [a.geraet.hersteller, a.geraet.typ, a.geraet.seriennummer && `SN ${a.geraet.seriennummer}`].filter(Boolean);
  return (
    <li className="karte flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Pruefplakette status={status.status} faelligAm={status.faelligAm} groesse={40} />
        <div className="min-w-0">
          <p className="font-semibold">
            <Link href={`/geraete/${a.geraet.id}`} className="hover:underline">
              {a.geraet.bezeichnung}
            </Link>
          </p>
          <p className="font-mono text-xs text-steel">
            {a.geraet.inventarnummer ?? 'ohne Inventarnummer'} · {a.bereichName}
          </p>
          {geraetDetails.length > 0 && <p className="text-xs text-steel">{geraetDetails.join(' · ')}</p>}
          <p className="mt-1 text-sm">{pruefart.bezeichnung}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <StatusAmpel status={status.status} grund={status.grund} kurz />
            <span>
              fällig am <span className="font-mono">{datum(status.faelligAm)}</span>
              {rest && <span className="text-steel"> ({rest})</span>}
            </span>
          </div>
          {a.pruefartAnsicht.weiterbetriebUnzulaessig && (
            <p className="mt-1 text-sm font-semibold text-brick">
              <span aria-hidden="true">✕ </span>Weiterbetrieb nicht zulässig
            </p>
          )}
        </div>
      </div>
      <Link href={`/nachweise/neu/${pruefart.id}`} className="btn btn-primaer w-full py-2.5 sm:w-auto">
        Nachweis erfassen<span className="sr-only">: {a.geraet.bezeichnung}, {pruefart.bezeichnung}</span>
      </Link>
    </li>
  );
}

export function PrueferAufgabenListe({ aufgaben }: { aufgaben: PrueferAufgabe[] }) {
  const gruppen = [
    { key: 'faellig' as const, titel: 'Fällig oder ohne Termin', leer: 'Keine fälligen Prüfungen.' },
    { key: 'spaeter' as const, titel: 'Später', leer: 'Keine weiteren Prüfungen.' },
  ];
  return (
    <div className="space-y-6">
      {gruppen.map((g) => {
        const liste = aufgaben.filter((a) => a.gruppe === g.key);
        return (
          <section key={g.key} aria-labelledby={`gruppe-${g.key}`} className="space-y-2">
            <h2 id={`gruppe-${g.key}`} className="text-lg font-semibold">
              {g.titel} <span className="font-mono text-sm font-normal text-steel">({liste.length})</span>
            </h2>
            {liste.length === 0 ? (
              <p className="text-sm text-steel">{g.leer}</p>
            ) : (
              <ul className="space-y-2">
                {liste.map((a) => (
                  <Aufgabe key={a.pruefartAnsicht.pruefart.id} a={a} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
