import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PfadEintrag {
  label: string;
  /** Ohne href: aktuelle Seite (letzter Eintrag). */
  href?: string;
}

interface Props {
  /** Pfad (Breadcrumb), ersetzt „← Zurück“-Links. Leer auf Seiten der obersten Ebene. */
  pfad: PfadEintrag[];
  titel: string;
  /** Eine Zeile Kontext unter dem Titel. */
  kontext?: ReactNode;
  /** Hauptaktion: rechtsbündig, mobil darunter in voller Breite. */
  aktion?: ReactNode;
}

/** Seitenkopf (§6.2): Pfad → h1 → Kontext → Hauptaktion. */
export function Seitenkopf({ pfad, titel, kontext, aktion }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        {pfad.length > 0 && (
          <nav aria-label="Pfad" className="mb-1">
            <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-steel">
              {pfad.map((p, i) => (
                <li key={`${p.label}-${i}`} className="flex min-w-0 items-center gap-x-1.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-steel-400">
                      /
                    </span>
                  )}
                  {p.href ? (
                    <Link href={p.href} className="link">
                      {p.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="truncate">
                      {p.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[1.75rem] font-semibold leading-[2.125rem] tracking-[-0.015em] text-ink hyphens-auto [overflow-wrap:break-word]">
          {titel}
        </h1>
        {kontext && <div className="mt-1 text-sm text-steel">{kontext}</div>}
      </div>
      {aktion && <div className="flex shrink-0 flex-col gap-2 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">{aktion}</div>}
    </div>
  );
}
