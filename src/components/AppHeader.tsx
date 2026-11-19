import Link from 'next/link';
import { can } from '@/domain/rechte';
import { ROLLE_LABEL, type Sitzung } from '@/domain/types';
import { abmelden } from '@/server/actions';

export type NavSchluessel = 'geraete' | 'pruefer' | 'maengel' | 'verwaltung';

interface Props {
  sitzung: Sitzung;
  aktiv?: NavSchluessel;
}

/** Navigation nach Rechten. Nur Anzeige – die Seiten prüfen die Rechte serverseitig selbst. */
export function AppHeader({ sitzung, aktiv }: Props) {
  const nav: { href: string; label: string; key: NavSchluessel }[] = [];
  if (can(sitzung.rolle, 'geraet.lesen') && sitzung.rolle !== 'pruefer') {
    nav.push({ href: '/geraete', label: 'Geräte', key: 'geraete' });
  }
  if (can(sitzung.rolle, 'pruefaufgaben.lesen')) {
    nav.push({ href: '/pruefer', label: 'Prüfaufgaben', key: 'pruefer' });
  }
  if (can(sitzung.rolle, 'mangel.lesen')) {
    nav.push({ href: '/maengel', label: 'Mängel', key: 'maengel' });
  }
  if (can(sitzung.rolle, 'bereich.verwalten')) {
    nav.push({ href: '/admin/mitglieder', label: 'Verwaltung', key: 'verwaltung' });
  }
  const mehrereOrganisationen = sitzung.organisationen.length > 1;

  return (
    <header className="border-b border-steel/20 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
          Readyloop
        </Link>
        {nav.length > 0 && (
          <nav aria-label="Hauptnavigation">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={aktiv === n.key ? 'page' : undefined}
                    className={
                      aktiv === n.key
                        ? 'font-semibold text-ink underline decoration-2 underline-offset-[6px]'
                        : 'text-steel hover:text-ink'
                    }
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          <div className="text-right leading-tight">
            <p className="font-medium">{sitzung.benutzer.name}</p>
            <p className="text-xs text-steel">
              {ROLLE_LABEL[sitzung.rolle]} · <span className="text-ink">{sitzung.organisation.name}</span>
              {mehrereOrganisationen && (
                <>
                  {' · '}
                  <Link href="/organisation" className="link">
                    Betrieb wechseln
                  </Link>
                </>
              )}
            </p>
          </div>
          <form action={abmelden}>
            <button type="submit" className="btn btn-sekundaer">
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
