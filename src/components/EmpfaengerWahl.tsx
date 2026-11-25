import type { ActionState, Id, PersonOption } from '@/domain/types';
import { FeldFehler, fehlerId } from './formular';

interface Props {
  /** Feldpräfix: sifa → sifaAuswahl/sifaEmpfaenger, admin → adminAuswahl/adminEmpfaenger. */
  gruppe: 'sifa' | 'admin';
  titel: string;
  optionen: PersonOption[];
  /** null = alle aktiven. */
  ausgewaehlt: Id[] | null;
  /** Satz, wenn es keine Optionen gibt (§6.25). */
  keineText: string;
  state: ActionState;
}

/**
 * Empfängerwahl (§6.25): Radiogruppe „Alle aktiven ({n})“ / „Auswahl“, darunter eingerückt die Checkboxliste.
 * Ohne JavaScript ist die Liste immer sichtbar; mit :has() ist sie ausgeblendet, solange „Alle aktiven“ gewählt ist
 * (die Häkchen bleiben erhalten). Ohne Optionen: Satz und verstecktes Feld mit „alle“.
 */
export function EmpfaengerWahl({ gruppe, titel, optionen, ausgewaehlt, keineText, state }: Props) {
  const auswahlFeld = `${gruppe}Auswahl`;
  const empfaengerFeld = `${gruppe}Empfaenger`;

  if (optionen.length === 0) {
    return (
      <div>
        <p className="font-semibold">{titel}</p>
        <p className="text-sm text-steel">{keineText}</p>
        <input type="hidden" name={auswahlFeld} value="alle" />
      </div>
    );
  }

  const gewaehlt = new Set(ausgewaehlt ?? []);
  const hatFehler = Boolean(state.feldfehler?.[empfaengerFeld]?.length);
  const radio =
    'size-5 shrink-0 accent-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel';

  return (
    <fieldset
      className="group/wahl"
      aria-describedby={hatFehler ? fehlerId(empfaengerFeld) : undefined}
      aria-invalid={hatFehler || undefined}
    >
      <legend className="font-semibold">{titel}</legend>
      <div className="mt-1 space-y-0.5">
        <label className="flex min-h-10 cursor-pointer items-center gap-3">
          <input id={`${gruppe}-alle`} type="radio" name={auswahlFeld} value="alle" defaultChecked={ausgewaehlt === null} className={radio} />
          Alle aktiven ({optionen.length})
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-3">
          <input id={`${gruppe}-auswahl`} type="radio" name={auswahlFeld} value="auswahl" defaultChecked={ausgewaehlt !== null} className={radio} />
          Auswahl
        </label>
        <ul
          aria-label={`${titel}: Auswahl`}
          className="ml-6 border-l-2 border-steel-200 pl-3 group-has-[input[value=alle]:checked]/wahl:hidden"
        >
          {optionen.map((o) => (
            <li key={o.benutzerId}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name={empfaengerFeld}
                  value={o.benutzerId}
                  defaultChecked={gewaehlt.has(o.benutzerId)}
                  className={radio}
                />
                <span className="[overflow-wrap:anywhere]">{o.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <FeldFehler state={state} feld={empfaengerFeld} />
    </fieldset>
  );
}
