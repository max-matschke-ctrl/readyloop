import type { MailModus } from '@/domain/types';
import { Meldung } from './Meldung';

/**
 * Feste Texte I3 (§6.11) zum Mailmodus. `aus` → Warnung auf allen Erinnerungsseiten.
 * `vorschau` → Hinweis nur dort, wo `mitVorschau` gesetzt ist (Versandprotokoll, Mail-Vorschau).
 */
export function MailModusMeldung({ modus, mitVorschau = false }: { modus: MailModus; mitVorschau?: boolean }) {
  if (modus === 'aus') {
    return (
      <Meldung art="warnung" text="Readyloop versendet derzeit keine Erinnerungen.">
        Mailversand ist nicht eingerichtet.
      </Meldung>
    );
  }
  if (modus === 'vorschau' && mitVorschau) {
    return (
      <Meldung art="hinweis" text="Mails liegen nur im Speicher des Servers und gehen beim Neustart verloren.">
        Nur Vorschau – nichts wird versendet.
      </Meldung>
    );
  }
  return null;
}
