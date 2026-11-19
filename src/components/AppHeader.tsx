import Link from 'next/link';
import { can } from '@/domain/rechte';
import { ROLLE_LABEL, type Sitzung } from '@/domain/types';
import { abmelden } from '@/server/actions';

interface Props {
  sitzung: Sitzung;
  aktiv?: 'geraete' | 'pruefer';
}

export function AppHeader({ sitzung, aktiv }: Props) {
  const nav: { href: string; label: string; key: 'geraete' | 'pruefer' }[] = [];
  if (can(sitzung.rolle, 'geraet.lesen') && sitzung.rolle !== 'pruefer') {
    nav.push({ href: '/geraete', label: 'Geräte', key: 'geraete' });
  }
  if (can(sitzung.rolle, 'pruefaufgaben.lesen')) {
    nav.push({ href: '/pruefer', label: 'Prüfaufgaben', key: 'pruefer' });
  }

  return (
    <header className="border-b border-steel/20 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
          Readyloop
        </Link>
        {nav.length > 0 && (
          <nav aria-label="Hauptnavigation">
            <ul className="flex gap-4 text-sm">
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
          <p className="text-right leading-tight">
            <span className="block font-medium">{sitzung.benutzer.name}</span>
            <span className="block text-xs text-steel">
              {ROLLE_LABEL[sitzung.rolle]} · {sitzung.organisation.name}
            </span>
          </p>
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
