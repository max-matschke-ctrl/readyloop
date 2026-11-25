import { ESKALATIONS_EBENE_LABEL, ESKALATION_MAX_TAGE, type ActionState, type EskalationsEbene } from '@/domain/types';
import { FeldFehler, feldProps } from './formular';

interface TageFeldProps {
  id: string;
  name: string;
  min: number;
  max: number;
  einheit: string;
  defaultValue?: number;
  required?: boolean;
  state: ActionState;
  /** Feldname für Fehler (Standard: name). */
  feld?: string;
  /** Zusätzliche ids für aria-labelledby (vollständiges zugängliches Label). */
  labelledBy?: string;
  /** Breite: 9 rem (§6.10); lange Einheiten brauchen etwas mehr. */
  breit?: boolean;
}

/** Tage-Feld (§6.10 I3): type=number, inputmode numeric, Einheit rechts im Feld. */
export function TageFeld({ id, name, min, max, einheit, defaultValue, required, state, feld = name, labelledBy, breit }: TageFeldProps) {
  return (
    <div className={`relative ${breit ? 'w-40' : 'w-36'}`}>
      <input
        {...feldProps(state, feld)}
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        required={required}
        defaultValue={defaultValue}
        aria-labelledby={labelledBy}
        className={`feld tabular-nums ${breit ? 'pr-32' : 'pr-24'}`}
      />
      <span id={`${id}-einheit`} className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-steel">
        {einheit}
      </span>
    </div>
  );
}

const SCHRITTE: { ebene: EskalationsEbene; name: string; kopie: string }[] = [
  { ebene: 'verantwortlicher', name: 'eskalationVerantwortlicher', kopie: 'Sifa in Kopie, wenn eingestellt' },
  { ebene: 'sifa', name: 'eskalationSifa', kopie: 'Verantwortliche in Kopie' },
  { ebene: 'admin', name: 'eskalationAdmin', kopie: 'Sifa und Verantwortliche in Kopie' },
];

interface Props {
  tage: Record<EskalationsEbene, number>;
  state: ActionState;
}

/**
 * Eskalationskette (§6.24): <ol> mit drei Schritten VER → SIF → ADM. Ab md drei Spalten mit „→“ dazwischen
 * (aria-hidden), darunter senkrecht mit Linie links. Nummer als Text, kein Kreis (rund = Status).
 * Die Kopie-Zeile beschreibt die Regel aus F-32 und ändert sich nicht mit den Eingaben.
 */
export function EskalationsKette({ tage, state }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[1.0625rem] font-semibold leading-6">Eskalation ab Fälligkeit</legend>
      <p id="eskalation-hilfe" className="text-xs text-steel">
        0 = am Fälligkeitstag. Jede Stufe frühestens am Tag der vorherigen.
      </p>
      <ol className="space-y-4 md:grid md:grid-cols-3 md:gap-x-10 md:space-y-0">
        {SCHRITTE.map((s, i) => {
          const id = `eskalation-${s.ebene}`;
          return (
            <li key={s.ebene} className="relative border-l-2 border-steel-200 pl-4 md:border-l-0 md:pl-0">
              <p className="font-semibold md:min-h-12">
                <span aria-hidden="true">{i + 1}.&nbsp;</span>
                <span id={`${id}-titel`}>
                  {ESKALATIONS_EBENE_LABEL[s.ebene]}
                  <span className="sr-only">:</span>
                </span>
              </p>
              <label id={`${id}-label`} htmlFor={id} className="label mt-2">
                ab Tag
              </label>
              <TageFeld
                id={id}
                name={s.name}
                min={0}
                max={ESKALATION_MAX_TAGE}
                einheit="nach Fälligkeit"
                breit
                required
                defaultValue={tage[s.ebene]}
                state={state}
                labelledBy={`${id}-titel ${id}-label ${id}-einheit`}
              />
              <FeldFehler state={state} feld={s.name} />
              <p className="mt-2 text-sm text-steel">{s.kopie}</p>
              {i < SCHRITTE.length - 1 && (
                <span aria-hidden="true" className="absolute top-0 -right-8 hidden w-6 text-center text-2xl leading-6 text-steel-400 md:block">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}
