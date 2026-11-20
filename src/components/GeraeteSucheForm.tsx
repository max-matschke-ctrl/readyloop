import { Search } from 'lucide-react';

/**
 * Gerätesuche (§6.22): GET-Formular (?q=), funktioniert ohne JavaScript. Feld 48 px mit sichtbarem Label,
 * Button „Suchen“ ab sm rechts daneben, mobil darunter in voller Breite. autofocus nur ohne Suchbegriff.
 */
export function GeraeteSucheForm({ q }: { q: string }) {
  return (
    <form role="search" action="/meine-geraete/suchen" method="get" className="space-y-2">
      <label htmlFor="suche-q" className="block text-base font-medium text-ink">
        Gerät, Inventarnummer oder Hersteller
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="suche-q"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          defaultValue={q}
          maxLength={80}
          autoFocus={q === ''}
          aria-describedby="suche-hinweis"
          className="feld min-h-12 flex-1"
        />
        <button type="submit" className="btn btn-primaer btn-halle">
          <Search aria-hidden="true" size={20} strokeWidth={1.75} />
          Suchen
        </button>
      </div>
      <p id="suche-hinweis" className="text-sm text-steel">
        Am Handy schneller: QR-Code am Gerät mit der Kamera scannen.
      </p>
    </form>
  );
}
