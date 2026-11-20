import { UEBERNAHME_ENDE_LABEL, type Uebernahme } from '@/domain/types';
import { tagVon } from './format';

/**
 * Übernahmen der letzten 90 Tage (F-27, US-32, §8.16): nur Admin, Tabelle §6.7 ohne Plakette,
 * ohne Sortierung, Filter und Zählung. Daten in Mono.
 */
export function UebernahmeVerlauf({ verlauf }: { verlauf: Uebernahme[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal text-ink">Übernahmen der letzten 90 Tage</h3>
      <div className="overflow-x-auto rounded-flaeche border border-steel-200 bg-white">
        {/* Zwei Spalten, damit die Tabelle in die rechte Spalte der Akte (20 rem) passt. */}
        <table className="w-full text-left text-sm">
          <thead className="bg-steel-50">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Person, Ende</th>
              <th scope="col" className="px-3 py-2 font-medium">Von – bis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-200">
            {verlauf.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-3 py-2.5">
                  <span className="block font-medium text-ink">{u.benutzerName}</span>
                  <span className="block text-steel">{u.endeArt ? UEBERNAHME_ENDE_LABEL[u.endeArt] : '–'}</span>
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap">
                  <span className="block">{tagVon(u.von)}</span>
                  <span className="block">
                    <span className="sr-only">bis </span>
                    {u.bis ? tagVon(u.bis) : '–'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-steel">Ältere Einträge werden automatisch ohne Namen gespeichert.</p>
    </div>
  );
}
