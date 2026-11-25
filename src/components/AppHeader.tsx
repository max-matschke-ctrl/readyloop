import Link from 'next/link';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { can } from '@/domain/rechte';
import { ROLLE_LABEL, type Sitzung } from '@/domain/types';
import { abmelden } from '@/server/actions';
import { PlaketteGlyph } from './PlaketteGlyph';

export type NavSchluessel =
  | 'geraete'
  | 'pruefer'
  | 'maengel'
  | 'verwaltung'
  | 'meine_geraete'
  | 'suchen'
  | 'etiketten'
  | 'erinnerungen'
  | 'mitarbeiter';

interface Props {
  sitzung: Sitzung;
  aktiv?: NavSchluessel;
}

/**
 * Kopfleiste (§6.1): 56 px steel, Wortmarke (Glyph + „Readyloop“), Textnavigation, Menü als <details>.
 * Unter 640 px liegt die Navigation in einer zweiten, horizontal scrollbaren Zeile.
 * Navigation nach Rechten ist nur Anzeige – die Seiten prüfen die Rechte serverseitig selbst.
 * I3M: Mitarbeiter „Meine Geräte“, „Gerät suchen“; „Etiketten“ bei etikett.verwalten; „Mitarbeiter“ bei
 * mitarbeiter.einladen ohne mitglied.verwalten (Admin lädt über die Verwaltung ein). Ziele mobil 48 px (§6.1).
 * I3 (E-8): ein Punkt „Erinnerungen“ bei erinnerung.protokoll; Ziel ADM /admin/erinnerungen, SIF /erinnerungen/protokoll.
 * Aktiv auf allen Unterseiten (Seiten übergeben aktiv="erinnerungen"). Menü: „Benachrichtigungen“ für alle Rollen.
 */
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
  if (can(sitzung.rolle, 'meine_geraete.lesen')) {
    nav.push({ href: '/meine-geraete', label: 'Meine Geräte', key: 'meine_geraete' });
  }
  if (can(sitzung.rolle, 'geraet.suchen')) {
    nav.push({ href: '/meine-geraete/suchen', label: 'Gerät suchen', key: 'suchen' });
  }
  if (can(sitzung.rolle, 'etikett.verwalten')) {
    nav.push({ href: '/etiketten', label: 'Etiketten', key: 'etiketten' });
  }
  if (can(sitzung.rolle, 'erinnerung.protokoll')) {
    nav.push({
      href: can(sitzung.rolle, 'erinnerung.einstellen') ? '/admin/erinnerungen' : '/erinnerungen/protokoll',
      label: 'Erinnerungen',
      key: 'erinnerungen',
    });
  }
  if (can(sitzung.rolle, 'mitarbeiter.einladen') && !can(sitzung.rolle, 'mitglied.verwalten')) {
    nav.push({ href: '/mitarbeiter', label: 'Mitarbeiter', key: 'mitarbeiter' });
  }
  if (can(sitzung.rolle, 'bereich.verwalten')) {
    nav.push({ href: '/admin/mitglieder', label: 'Verwaltung', key: 'verwaltung' });
  }
  const mehrereOrganisationen = sitzung.organisationen.length > 1;

  return (
    <header className="bg-steel text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 md:px-6 xl:px-8">
        <Link
          href="/"
          className="order-1 flex h-14 items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em]"
        >
          <PlaketteGlyph ton="weiss" groesse={24} />
          Readyloop
        </Link>

        {nav.length > 0 && (
          <nav
            aria-label="Hauptnavigation"
            className="order-3 -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-white/20 px-4 sm:order-2 sm:mx-0 sm:w-auto sm:border-t-0 sm:px-0"
          >
            <ul className="flex gap-x-5 whitespace-nowrap text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={aktiv === n.key ? 'page' : undefined}
                    className={`flex h-12 items-center border-b-[3px] pt-[3px] sm:h-14 ${
                      aktiv === n.key
                        ? 'border-white font-semibold text-white'
                        : 'border-transparent text-white/80 hover:text-white'
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="order-2 ml-auto flex h-14 items-center gap-4 text-sm sm:order-3">
          <span className="hidden max-w-56 truncate text-white/80 md:inline">{sitzung.organisation.name}</span>
          <details className="group relative">
            <summary className="flex min-h-12 min-w-12 cursor-pointer list-none items-center gap-1.5 rounded-feld px-2 hover:bg-steel-800 [&::-webkit-details-marker]:hidden">
              <span className="hidden max-w-40 truncate sm:inline">{sitzung.benutzer.name}</span>
              <span className="sm:hidden">Menü</span>
              <ChevronDown
                aria-hidden="true"
                size={16}
                strokeWidth={1.75}
                className="transition-transform duration-[var(--dauer-kurz)] group-open:rotate-180"
              />
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-64 rounded-flaeche border border-steel-200 bg-white p-1 text-ink shadow-pop [&_:focus-visible]:outline-steel">
              <div className="px-3 py-2">
                <p className="font-medium [overflow-wrap:anywhere]">{sitzung.benutzer.name}</p>
                <p className="text-steel">{ROLLE_LABEL[sitzung.rolle]}</p>
                <p className="text-steel [overflow-wrap:anywhere]">{sitzung.organisation.name}</p>
              </div>
              <hr className="my-1 border-steel-200" />
              {mehrereOrganisationen && (
                <Link href="/organisation" className="flex min-h-12 items-center rounded-feld px-3 hover:bg-steel-50">
                  Betrieb wechseln
                </Link>
              )}
              {can(sitzung.rolle, 'benachrichtigung.eigene') && (
                <Link
                  href="/einstellungen/benachrichtigungen"
                  className="flex min-h-12 items-center gap-2 rounded-feld px-3 hover:bg-steel-50"
                >
                  <Bell aria-hidden="true" size={16} strokeWidth={1.75} />
                  Benachrichtigungen
                </Link>
              )}
              <form action={abmelden}>
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center gap-2 rounded-feld px-3 text-left hover:bg-steel-50"
                >
                  <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />
                  Abmelden
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
