import Link from 'next/link';
import { MAIL_ART_LABEL, type VorschauMail } from '@/domain/types';
import { vorschauHref, type VorschauAnsicht } from './MailVorschauListe';

/**
 * Vorschau einer Mail (§8.23): Kopfzeilen als dl, Umschalter HTML/Text als Links (ohne JavaScript).
 * HTML im <iframe sandbox=""> ohne allow-scripts und allow-same-origin; Text in <pre> bei 76ch, ohne Umbruch.
 */
export function MailVorschauRahmen({ mail, ansicht }: { mail: VorschauMail; ansicht: VorschauAnsicht }) {
  const tabs: { key: VorschauAnsicht; label: string }[] = [
    { key: 'html', label: 'HTML' },
    { key: 'text', label: 'Text' },
  ];
  return (
    <section aria-labelledby="vorschau-titel" className="min-w-0 space-y-4">
      <h2 id="vorschau-titel" className="sr-only">
        Vorschau der gewählten Mail
      </h2>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-sm text-steel">An</dt>
        <dd className="font-mono [overflow-wrap:anywhere]">{mail.an}</dd>
        <dt className="text-sm text-steel">Betreff</dt>
        <dd className="[overflow-wrap:anywhere]">{mail.betreff}</dd>
        <dt className="text-sm text-steel">Art</dt>
        <dd>{MAIL_ART_LABEL[mail.art]}</dd>
        <dt className="text-sm text-steel">List-Unsubscribe</dt>
        <dd className="[overflow-wrap:anywhere]">
          {mail.listUnsubscribe ? <span className="font-mono text-sm">{mail.listUnsubscribe}</span> : 'keine (Pflichtmail)'}
        </dd>
      </dl>

      <nav aria-label="Ansicht der Mail">
        <ul className="flex gap-x-5 border-b border-steel-200 text-sm">
          {tabs.map((t) => (
            <li key={t.key}>
              <Link
                href={vorschauHref(mail.id, t.key)}
                aria-current={ansicht === t.key ? 'page' : undefined}
                className={`-mb-px flex min-h-11 items-center border-b-[3px] ${
                  ansicht === t.key ? 'border-steel font-semibold text-ink' : 'border-transparent text-steel hover:text-ink'
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {ansicht === 'html' ? (
        <iframe
          sandbox=""
          srcDoc={mail.html}
          title={`Vorschau: ${mail.betreff}`}
          className="block h-[75vh] w-full max-w-[40rem] rounded-flaeche border border-steel-200 bg-white"
        />
      ) : (
        <pre className="max-w-full overflow-x-auto rounded-flaeche border border-steel-200 bg-white p-4 font-mono text-[0.8125rem] leading-[1.125rem] whitespace-pre text-ink">
          <code className="block w-[76ch]">{mail.text}</code>
        </pre>
      )}
    </section>
  );
}
