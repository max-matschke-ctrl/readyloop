import Link from 'next/link';
import { MAIL_ART_LABEL, type VorschauMail } from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { uhrzeit } from './erinnerung-format';

export type VorschauAnsicht = 'html' | 'text';

export function vorschauHref(id: string, ansicht: VorschauAnsicht): string {
  const sp = new URLSearchParams({ mail: id });
  if (ansicht === 'text') sp.set('ansicht', 'text');
  return `/admin/mails?${sp.toString()}`;
}

interface Props {
  mails: VorschauMail[];
  gewaehltId: string | null;
  ansicht: VorschauAnsicht;
}

/**
 * Liste der Vorschau-Mails (§8.23): je Mail ein Link ?mail={id}, neueste oben. Betreff höchstens zwei Zeilen,
 * darunter An (Mono) und Art, dann die Uhrzeit. Ausgewählt: steel-50, Linie links, aria-current.
 */
export function MailVorschauListe({ mails, gewaehltId, ansicht }: Props) {
  if (mails.length === 0) {
    return (
      <Leerzustand
        art="leer"
        titel="Noch keine Mails in der Vorschau."
        text="Führen Sie einen Erinnerungslauf aus. Die Mails erscheinen dann hier."
      />
    );
  }
  return (
    <nav aria-label="Mails in der Vorschau">
      <ul className="karte divide-y divide-steel-200 overflow-hidden">
        {mails.map((m) => {
          const aktiv = m.id === gewaehltId;
          return (
            <li key={m.id}>
              <Link
                href={vorschauHref(m.id, ansicht)}
                aria-current={aktiv ? 'true' : undefined}
                className={`block min-h-14 border-l-[3px] px-3 py-2 text-ink hover:bg-steel-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel ${
                  aktiv ? 'border-steel bg-steel-50' : 'border-transparent'
                }`}
              >
                <span className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">{m.betreff}</span>
                <span className="mt-0.5 block text-xs text-steel [overflow-wrap:anywhere]">
                  <span className="font-mono">{m.an}</span> · {MAIL_ART_LABEL[m.art]}
                </span>
                <span className="block text-xs text-steel">{uhrzeit(m.erstelltAm)} Uhr</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
