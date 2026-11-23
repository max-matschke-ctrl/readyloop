import type { ReactNode } from 'react';
import {
  DATUMSHERKUNFT_LABEL,
  FRIST_QUELLE_LABEL,
  PRUEF_ERGEBNIS_LABEL,
  STUFE_LABEL,
  type OeffentlichePruefart,
} from '@/domain/types';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { StufeBadge } from './StufeBadge';
import { datum, monate } from './format';

interface Props {
  pruefarten: OeffentlichePruefart[];
  /** Überschriftenebene je Prüfung: h3 unter „Prüfungen“ (QR-Seite), h4 in Gerätekarten. */
  ebene?: 'h3' | 'h4';
}

function Zeile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sm:grid sm:grid-cols-[9rem_1fr] sm:gap-x-3">
      <dt className="text-sm text-steel">{label}</dt>
      <dd className="text-base text-ink">{children}</dd>
    </div>
  );
}

/**
 * Prüfungen kurz (§6.20): je Prüfung ein Block mit Plakette 40, Statusmarke (auch „In Ordnung“) und dl.
 * Frist immer mit Monaten, Quelle und Stufe mit Text; ohne Frist „Frist über GBU festlegen“ (Leitsatz 3).
 * Einziger Personenname: Prüfer im letzten Nachweis (F-24).
 */
export function PruefartKurzliste({ pruefarten, ebene = 'h3' }: Props) {
  const Titel = ebene;
  if (pruefarten.length === 0) {
    return <p className="text-base text-ink">Für dieses Gerät sind keine Prüfungen angelegt.</p>;
  }
  return (
    <ul className="divide-y divide-steel-200">
      {pruefarten.map((p, i) => (
        <li key={`${p.bezeichnung}-${i}`} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <Pruefplakette status={p.status.status} faelligAm={p.status.faelligAm} groesse={40} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <Titel className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal text-ink [overflow-wrap:anywhere]">
                {p.bezeichnung}
              </Titel>
              <StatusAmpel status={p.status.status} grund={p.status.grund} className="py-1 text-sm!" />
            </div>
            <dl className="space-y-1.5">
              {p.frist ? (
                <>
                  <Zeile label="Fällig am">
                    {p.status.faelligAm ? <span className="font-mono tabular-nums">{datum(p.status.faelligAm)}</span> : 'unbekannt'}
                  </Zeile>
                  <Zeile label="Prüffrist">
                    <span className="block">
                      {monate(p.frist.monate)}, Quelle: {FRIST_QUELLE_LABEL[p.frist.quelle]}
                    </span>
                    <span className="mt-0.5 flex items-start gap-1.5 text-sm">
                      <StufeBadge stufe={p.frist.stufe} />
                      <span>
                        Stufe {p.frist.stufe}: {STUFE_LABEL[p.frist.stufe]}
                      </span>
                    </span>
                  </Zeile>
                  <Zeile label="Grundlage">
                    <span className="font-mono [overflow-wrap:anywhere]">{p.frist.fundstelle}</span>
                  </Zeile>
                </>
              ) : (
                <div>
                  <dt className="sr-only">Prüffrist</dt>
                  <dd>
                    <span className="block font-semibold text-ink">Frist über GBU festlegen</span>
                    <span className="block text-base text-ink">Noch keine Prüffrist festgelegt.</span>
                  </dd>
                </div>
              )}
              <Zeile label="Letzte Prüfung">
                {p.letztePruefung ? (
                  <>
                    <span className="font-mono tabular-nums">{datum(p.letztePruefung)}</span>{' '}
                    <span className="text-sm">({DATUMSHERKUNFT_LABEL[p.letztePruefungHerkunft]})</span>
                  </>
                ) : (
                  'unbekannt'
                )}
              </Zeile>
              <Zeile label="Letzter Nachweis">
                {p.letzterNachweis ? (
                  <>
                    <span className="font-mono tabular-nums">{datum(p.letzterNachweis.pruefdatum)}</span>
                    <span className="block">{PRUEF_ERGEBNIS_LABEL[p.letzterNachweis.ergebnis]}</span>
                    <span className="block">Prüfer: {p.letzterNachweis.prueferName}</span>
                  </>
                ) : (
                  'noch keiner in Readyloop'
                )}
              </Zeile>
            </dl>
          </div>
        </li>
      ))}
    </ul>
  );
}
