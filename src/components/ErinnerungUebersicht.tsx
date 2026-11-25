import Link from 'next/link';
import type { ErinnerungEinstellung, ErinnerungEinstellungAnsicht } from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { Meldung } from './Meldung';
import { eskalationText, jaNein, staffelText } from './erinnerung-format';
import { tagVon } from './format';

/** Gestreckter Zeilenlink (§6.7): ganze Zeile klickbar, ein Tab-Halt je Zeile, Fokusring um die Zeile. */
const ZEILENLINK =
  'font-semibold text-ink after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-steel focus-visible:after:outline';

/** „Standard“ bzw. „Angepasst am {Datum} von {Name}“ (§6.6: Text, keine Marke; Datum in Mono). */
export function EinstellungStand({ einstellung }: { einstellung: ErinnerungEinstellung }) {
  if (einstellung.standard || !einstellung.geaendertAm) return <>Standard</>;
  return (
    <>
      Angepasst am <span className="font-mono">{tagVon(einstellung.geaendertAm)}</span>
      {einstellung.geaendertVonName && <> von {einstellung.geaendertVonName}</>}
    </>
  );
}

/** Pflichthinweis unter der Tabelle (§8.18, F-30): nichts wird geschätzt. */
function OhneFristHinweis() {
  return (
    <Meldung art="hinweis" text="Sie stehen weiter in der Geräteliste und in der Wochenübersicht der Prüfer.">
      Prüfungen ohne freigegebene Frist oder ohne bekanntes Prüfdatum lösen keine Fristerinnerung aus.
    </Meldung>
  );
}

/**
 * Übersicht der Erinnerungen je Bereich (§8.18): ab 640 px Tabelle ohne Plakettenspalte, Bereichsname als
 * gestreckter Zeilenlink, Warnungen als eigene Zeile darunter; darunter Liste je Bereich.
 */
export function ErinnerungUebersicht({ eintraege }: { eintraege: ErinnerungEinstellungAnsicht[] }) {
  if (eintraege.length === 0) {
    return (
      <Leerzustand
        art="leer"
        titel="Noch keine Bereiche angelegt."
        text="Erinnerungen werden je Bereich eingestellt."
        aktion={
          <Link href="/admin/bereiche" className="btn btn-sekundaer">
            Bereiche verwalten
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="karte hidden overflow-x-clip sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Erinnerungen je Bereich</caption>
          <thead className="text-left">
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Bereich</th>
              <th scope="col">Vorlauf</th>
              <th scope="col">Eskalation (Tage nach Fälligkeit)</th>
              <th scope="col" className="whitespace-nowrap">
                Sifa in Kopie
              </th>
              <th scope="col">Stand</th>
            </tr>
          </thead>
          {eintraege.map(({ bereich, einstellung, warnungen }, i) => (
            <tbody key={bereich.id} className={i > 0 ? '[&>tr:first-child>*]:border-t [&>tr:first-child>*]:border-steel-200' : ''}>
              <tr className="relative align-top hover:bg-steel-50 [&>*]:px-3 [&>*]:py-3">
                <th scope="row" className="text-left font-normal">
                  <Link
                    href={`/admin/erinnerungen/${bereich.id}`}
                    aria-label={`Erinnerungen für ${bereich.name} bearbeiten`}
                    className={ZEILENLINK}
                  >
                    {bereich.name}
                  </Link>
                </th>
                <td className="whitespace-nowrap tabular-nums">{staffelText(einstellung.staffelTage)}</td>
                <td className="tabular-nums">{eskalationText(einstellung.eskalationTage)}</td>
                <td>{jaNein(einstellung.sifaInKopie)}</td>
                <td className="text-steel">
                  <EinstellungStand einstellung={einstellung} />
                </td>
              </tr>
              {warnungen.length > 0 && (
                <tr>
                  <td colSpan={5} className="space-y-2 px-3 pb-3">
                    {warnungen.map((w) => (
                      <Meldung key={w} art="warnung" live={false}>
                        {w}
                      </Meldung>
                    ))}
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </div>

      <ul aria-label="Erinnerungen je Bereich" className="karte divide-y divide-steel-200 sm:hidden">
        {eintraege.map(({ bereich, einstellung, warnungen }) => (
          <li key={bereich.id} className="space-y-2 px-3 py-3">
            <div className="relative">
              <h3 className="text-[1.0625rem] font-semibold leading-6">
                <Link
                  href={`/admin/erinnerungen/${bereich.id}`}
                  aria-label={`Erinnerungen für ${bereich.name} bearbeiten`}
                  className={`[overflow-wrap:anywhere] ${ZEILENLINK}`}
                >
                  {bereich.name}
                </Link>
              </h3>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                <dt className="text-steel">Vorlauf</dt>
                <dd className="tabular-nums">{staffelText(einstellung.staffelTage)}</dd>
                <dt className="text-steel">Eskalation</dt>
                <dd className="tabular-nums">
                  {eskalationText(einstellung.eskalationTage)}
                  <span className="block text-xs text-steel">Tage nach Fälligkeit</span>
                </dd>
                <dt className="text-steel">Sifa in Kopie</dt>
                <dd>{jaNein(einstellung.sifaInKopie)}</dd>
              </dl>
              <p className="mt-1 text-sm text-steel">
                <EinstellungStand einstellung={einstellung} />
              </p>
            </div>
            {warnungen.map((w) => (
              <Meldung key={w} art="warnung" live={false}>
                {w}
              </Meldung>
            ))}
          </li>
        ))}
      </ul>

      <OhneFristHinweis />
    </div>
  );
}
