import Link from 'next/link';

export type ErinnerungenTab = 'einstellungen' | 'protokoll' | 'vorschau';

interface Props {
  aktiv: ErinnerungenTab;
  /** ADM (erinnerung.einstellen), serverseitig ermittelt. */
  zeigeEinstellungen: boolean;
  /** ADM (mail.vorschau) und mailModus() === 'vorschau', serverseitig ermittelt. */
  zeigeVorschau: boolean;
}

/**
 * Untertabs „Erinnerungen“ (§6.26, E-8): gleiche Optik wie VerwaltungNav, unter dem h1.
 * Ist nur ein Tab sichtbar (SIF), entfällt die Tab-Zeile ganz. Nur Anzeige; die Seiten prüfen Rechte selbst.
 */
export function ErinnerungenNav({ aktiv, zeigeEinstellungen, zeigeVorschau }: Props) {
  const eintraege: { key: ErinnerungenTab; href: string; label: string }[] = [];
  if (zeigeEinstellungen) eintraege.push({ key: 'einstellungen', href: '/admin/erinnerungen', label: 'Einstellungen je Bereich' });
  eintraege.push({ key: 'protokoll', href: '/erinnerungen/protokoll', label: 'Versandprotokoll' });
  if (zeigeVorschau) eintraege.push({ key: 'vorschau', href: '/admin/mails', label: 'Mail-Vorschau' });
  if (eintraege.length < 2) return null;

  return (
    <nav aria-label="Erinnerungen" className="overflow-x-auto">
      <ul className="flex gap-x-5 whitespace-nowrap border-b border-steel-200 text-sm">
        {eintraege.map((e) => (
          <li key={e.key}>
            <Link
              href={e.href}
              aria-current={aktiv === e.key ? 'page' : undefined}
              className={`-mb-px flex min-h-11 items-center border-b-[3px] ${
                aktiv === e.key ? 'border-steel font-semibold text-ink' : 'border-transparent text-steel hover:text-ink'
              }`}
            >
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
