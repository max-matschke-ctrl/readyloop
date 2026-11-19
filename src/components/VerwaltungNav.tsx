import Link from 'next/link';

/** Unternavigation der Verwaltung (nur Anzeige; Seiten prüfen Rechte selbst). */
export function VerwaltungNav({ aktiv }: { aktiv: 'mitglieder' | 'bereiche' }) {
  const eintraege = [
    { key: 'mitglieder', href: '/admin/mitglieder', label: 'Mitglieder' },
    { key: 'bereiche', href: '/admin/bereiche', label: 'Bereiche' },
  ] as const;
  return (
    <nav aria-label="Verwaltung">
      <ul className="flex gap-1 border-b border-steel/20 text-sm">
        {eintraege.map((e) => (
          <li key={e.key}>
            <Link
              href={e.href}
              aria-current={aktiv === e.key ? 'page' : undefined}
              className={`-mb-px inline-block border-b-2 px-3 py-2 ${
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
