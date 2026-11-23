import type { ReactNode } from 'react';
import type { OeffentlicheGeraeteansicht as Ansicht } from '@/domain/types';
import { NutzungsHinweis } from './NutzungsHinweis';
import { PruefartKurzliste } from './PruefartKurzliste';
import { Pruefplakette } from './Pruefplakette';
import { zeitpunkt } from './format';

interface Props {
  ansicht: Ansicht;
  /** Aktionen (TokenAktionen) direkt unter der Kennung (§6.18). */
  aktionen?: ReactNode;
}

/**
 * Öffentliche Geräteansicht (§8.12): Nutzungsband groß zuerst (DOM und Bild), dann Kennung mit Plakette 96
 * („Aktueller Stand“), Aktionen, Prüfungen (immer offen), Fuß mit „Stand“.
 * Kein Bereich, kein Halter, keine Mängelbeschreibung, kein PDF-Link (F-24).
 */
export function OeffentlicheGeraeteansicht({ ansicht, aktionen }: Props) {
  const herstellerTyp = [ansicht.hersteller, ansicht.typ].filter(Boolean).join(' · ');
  return (
    <div className="space-y-6">
      <NutzungsHinweis
        groesse="gross"
        nutzung={ansicht.nutzung}
        gesamtStatus={ansicht.gesamtStatus}
        grund={ansicht.gesamtStatusGrund}
        betriebsstatus={ansicht.betriebsstatus}
        naechsteFaelligkeit={ansicht.naechsteFaelligkeit}
        className="rounded-flaeche"
      />

      <header className="flex items-start gap-4">
        <figure className="flex shrink-0 flex-col items-center gap-1">
          <Pruefplakette status={ansicht.gesamtStatus} faelligAm={ansicht.naechsteFaelligkeit} groesse={96} />
          <figcaption className="text-xs text-steel">Aktueller Stand</figcaption>
        </figure>
        <div className="min-w-0 space-y-1 pt-1">
          <h1 className="text-[1.75rem] font-semibold leading-[2.125rem] tracking-[-0.015em] text-ink hyphens-auto [overflow-wrap:break-word]">
            {ansicht.bezeichnung}
          </h1>
          {ansicht.inventarnummer && (
            <p className="font-mono text-base tabular-nums text-ink">
              <span className="sr-only">Inventarnummer </span>
              {ansicht.inventarnummer}
            </p>
          )}
          {herstellerTyp && <p className="text-base text-ink">{herstellerTyp}</p>}
          <p className="text-sm text-steel">{ansicht.organisationName}</p>
        </div>
      </header>

      {aktionen}

      <section aria-labelledby="pruefungen-titel" className="space-y-3">
        <h2 id="pruefungen-titel" className="text-xl font-semibold leading-7 text-ink">
          Prüfungen
        </h2>
        <div className="karte p-4">
          <PruefartKurzliste pruefarten={ansicht.pruefarten} />
        </div>
      </section>

      <footer className="space-y-0.5 border-t border-steel-200 pt-3 text-xs text-steel">
        <p>
          Stand: <span className="font-mono tabular-nums">{zeitpunkt(ansicht.stand)} Uhr</span>
        </p>
        <p>Diese Seite zeigt den Prüfstatus zum Zeitpunkt des Aufrufs.</p>
      </footer>
    </div>
  );
}
