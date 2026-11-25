import { ChevronDown } from 'lucide-react';
import {
  MAIL_ART_LABEL,
  MAIL_FEHLER_LABEL,
  POSTEN_ROLLE_LABEL,
  ROLLE_LABEL,
  type ProtokollEintrag,
  type ProtokollPosten,
} from '@/domain/types';
import { VersandStatusBadge } from './VersandStatusBadge';
import { uhrzeit } from './erinnerung-format';
import { datum } from './format';

/** Empfänger (§8.22): Name und Rolle; MA-Hinweis ohne Namen (F-41); null bei anderen Arten → „–“. */
function Empfaenger({ e }: { e: ProtokollEintrag }) {
  if (e.empfaenger) {
    return (
      <>
        <span className="block font-medium [overflow-wrap:anywhere]">{e.empfaenger.name}</span>
        <span className="block text-steel">{ROLLE_LABEL[e.empfaenger.rolle]}</span>
      </>
    );
  }
  if (e.art === 'ma_hinweis') {
    return (
      <>
        <span className="block font-medium">Mitarbeiter/in</span>
        <span className="block text-xs text-steel">Name nur bei Zustellproblemen sichtbar</span>
      </>
    );
  }
  return <span aria-label="nicht mehr zuzuordnen">–</span>;
}

/** Status mit Fehlertext und Versuchen (§6.23). */
function Status({ e }: { e: ProtokollEintrag }) {
  return (
    <>
      <VersandStatusBadge status={e.status} />
      {e.status === 'fehler' && e.fehlerCode && <span className="mt-1 block text-steel">{MAIL_FEHLER_LABEL[e.fehlerCode]}</span>}
      {e.versuche > 1 && <span className="mt-0.5 block text-steel">{e.versuche} Versuche</span>}
    </>
  );
}

function Datum({ e }: { e: ProtokollEintrag }) {
  return (
    <>
      <span className="block font-mono tabular-nums">{datum(e.laufDatum)}</span>
      <span className="block text-xs text-steel">Stand {uhrzeit(e.statusAm)} Uhr</span>
    </>
  );
}

function PostenAnzahl({ e }: { e: ProtokollEintrag }) {
  return e.art === 'ma_hinweis' ? <span aria-label="keine Angabe">–</span> : <>{e.postenAnzahl}</>;
}

/** Postenliste (§8.22, E-10): ab md kleine Tabelle, darunter Liste. Fläche steel-50, eingerückt. */
function Posten({ posten }: { posten: ProtokollPosten[] }) {
  return (
    <div className="mt-1 ml-4 rounded-flaeche bg-steel-50 p-3">
      <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
        <caption className="sr-only">Posten dieser Mail</caption>
        <thead className="text-left">
          <tr className="[&>th]:px-2 [&>th]:pb-1 [&>th]:font-medium">
            <th scope="col">Gerät</th>
            <th scope="col">Bereich</th>
            <th scope="col">Prüfung</th>
            <th scope="col">Erinnerung</th>
            <th scope="col">Fällig am</th>
            <th scope="col">Rolle</th>
          </tr>
        </thead>
        <tbody>
          {posten.map((p, i) => (
            <tr key={`${p.geraetId}-${p.stufe}-${i}`} className="align-top [&>*]:border-t [&>*]:border-steel-200 [&>*]:px-2 [&>*]:py-1.5">
              <td>
                <span className="block">{p.geraetBezeichnung}</span>
                <span className="block font-mono text-xs text-steel">{p.inventarnummer ?? 'ohne Inventarnummer'}</span>
              </td>
              <td>{p.bereichName}</td>
              <td>{p.pruefartBezeichnung ?? '–'}</td>
              <td>{p.stufeLabel}</td>
              <td className="whitespace-nowrap font-mono tabular-nums">{datum(p.faelligAm)}</td>
              <td>{POSTEN_ROLLE_LABEL[p.rolle]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul aria-label="Posten dieser Mail" className="divide-y divide-steel-200 text-sm md:hidden">
        {posten.map((p, i) => (
          <li key={`${p.geraetId}-${p.stufe}-${i}`} className="py-2 first:pt-0 last:pb-0">
            <p className="font-medium [overflow-wrap:anywhere]">{p.geraetBezeichnung}</p>
            <p className="font-mono text-xs text-steel">{p.inventarnummer ?? 'ohne Inventarnummer'}</p>
            <p>
              {p.bereichName}
              {p.pruefartBezeichnung && <> · {p.pruefartBezeichnung}</>}
            </p>
            <p>
              {p.stufeLabel}, fällig am <span className="font-mono">{datum(p.faelligAm)}</span>
            </p>
            <p className="text-steel">{POSTEN_ROLLE_LABEL[p.rolle]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostenDisclosure({ e }: { e: ProtokollEintrag }) {
  return (
    <details className="group/p">
      <summary className="btn btn-still min-h-10 w-fit cursor-pointer list-none gap-1 px-0 [&::-webkit-details-marker]:hidden">
        Posten anzeigen ({e.posten.length})
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.75}
          className="transition-transform duration-[var(--dauer-mittel)] group-open/p:rotate-180"
        />
      </summary>
      <Posten posten={e.posten} />
    </details>
  );
}

/**
 * Versandprotokoll (§8.22, F-41): ab lg Tabelle mit einem <tbody> je Mail und einer zweiten Zeile über alle
 * Spalten für die Posten (E-10), darunter Karten. Keine Sortierung, keine Spalte nach Person außer dem Empfänger.
 */
export function ProtokollTabelle({ eintraege }: { eintraege: ProtokollEintrag[] }) {
  return (
    <>
      <div className="karte hidden overflow-x-clip lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Versandte Mails, neueste zuerst</caption>
          <thead className="text-left">
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-12 [&>th]:bg-steel-50 [&>th]:px-3 [&>th]:font-medium [&>th]:shadow-[inset_0_-1px_0_var(--color-steel-200)]">
              <th scope="col">Datum</th>
              <th scope="col">Art</th>
              <th scope="col">Empfänger</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">
                Posten
              </th>
            </tr>
          </thead>
          {eintraege.map((e, i) => (
            <tbody key={e.versandId} className={i > 0 ? '[&>tr:first-child>*]:border-t [&>tr:first-child>*]:border-steel-200' : ''}>
              <tr className={`align-top [&>*]:px-3 [&>*]:pt-3 ${e.posten.length > 0 ? '' : '[&>*]:pb-3'}`}>
                <td className="w-32">
                  <Datum e={e} />
                </td>
                <td>{MAIL_ART_LABEL[e.art]}</td>
                <td>
                  <Empfaenger e={e} />
                </td>
                <td>
                  <Status e={e} />
                </td>
                <td className="text-right font-mono tabular-nums">
                  <PostenAnzahl e={e} />
                </td>
              </tr>
              {e.posten.length > 0 && (
                <tr>
                  <td colSpan={5} className="px-3 pb-2">
                    <PostenDisclosure e={e} />
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </div>

      <ul aria-label="Versandte Mails, neueste zuerst" className="space-y-3 lg:hidden">
        {eintraege.map((e) => (
          <li key={e.versandId} className="karte space-y-2 p-3 text-sm">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-mono tabular-nums">{datum(e.laufDatum)}</span>
              <span className="font-medium">{MAIL_ART_LABEL[e.art]}</span>
            </p>
            <div>
              <Empfaenger e={e} />
            </div>
            <div>
              <Status e={e} />
            </div>
            <p className="text-xs text-steel">
              Stand {uhrzeit(e.statusAm)} Uhr
              {e.art !== 'ma_hinweis' && <> · {e.postenAnzahl === 1 ? '1 Posten' : `${e.postenAnzahl} Posten`}</>}
            </p>
            {e.posten.length > 0 && <PostenDisclosure e={e} />}
          </li>
        ))}
      </ul>
    </>
  );
}
