import Link from 'next/link';

/**
 * Untertabs der Verwaltung (§8.10): Unterstrich-Tabs wie die Hauptnavigation, steel auf paper.
 * Nur Anzeige; die Seiten prüfen Rechte selbst.
 */
export function VerwaltungNav({ aktiv }: { aktiv: 'mitglieder' | 'bereiche' }) {
  const eintraege = [
    { key: 'mitglieder', href: '/admin/mitglieder', label: 'Mitglieder' },
    { key: 'bereiche', href: '/admin/bereiche', label: 'Bereiche' },
  ] as const;
  return (
    <nav aria-label="Verwaltung" className="overflow-x-auto">
      <ul className="flex gap-x-5 border-b border-steel-200 text-sm">
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
