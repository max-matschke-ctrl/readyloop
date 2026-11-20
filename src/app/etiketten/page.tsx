import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { DruckenButton } from '@/components/DruckenButton';
import { EtikettenAuswahl } from '@/components/EtikettenAuswahl';
import { EtikettenBogen, JE_BOGEN, anzahlBoegen } from '@/components/EtikettenBogen';
import type { EtikettPlakette } from '@/components/Etikett';
import { Leerzustand } from '@/components/Leerzustand';
import { Meldung } from '@/components/Meldung';
import { Seitenkopf, type PfadEintrag } from '@/components/Seitenkopf';
import { ETIKETTEN_MAX, GERAETE_KATEGORIEN, type GeraeteKategorie } from '@/domain/types';
import { erfordereSitzung, holeEtiketten, listeBereiche } from '@/server/data';
import './druck.css';

export const metadata: Metadata = { title: 'Etiketten drucken' };
export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

/** Ersatzweg ohne Freigabe §9.7. Nach FE-15a hier auf 'druck' umstellen. */
const PLAKETTE: EtikettPlakette = 'statusfarbe';

function liste(wert: string | string[] | undefined): string[] {
  return (Array.isArray(wert) ? wert : wert ? [wert] : []).filter((v) => v.length > 0).slice(0, ETIKETTEN_MAX);
}

function einzeln(wert: string | string[] | undefined): string | null {
  const v = Array.isArray(wert) ? wert[0] : wert;
  return v ? v : null;
}

function istKategorie(wert: string | null): wert is GeraeteKategorie {
  return wert !== null && (GERAETE_KATEGORIEN as readonly string[]).includes(wert);
}

/**
 * Etiketten drucken (F-25, US-31, §8.17): Bedienteil, Anzahl, Druckhinweise, maßstäbliche Vorschau.
 * Gedruckt werden nur die Bögen (druck.css). Rechte und Geltungsbereich prüft der Server (holeEtiketten).
 */
export default async function EtikettenSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('etikett.verwalten');
  const sp = await searchParams;
  const geraetIds = liste(sp.geraet);
  const bereichId = einzeln(sp.bereich);
  const kategorieRoh = einzeln(sp.kategorie);
  const kategorie: GeraeteKategorie = istKategorie(kategorieRoh) ? kategorieRoh : 'wechselnd';
  const startRoh = Number(einzeln(sp.start) ?? '1');
  const start = Number.isInteger(startRoh) && startRoh >= 1 && startRoh <= JE_BOGEN ? startRoh : 1;

  const [etiketten, bereiche] = await Promise.all([
    holeEtiketten(geraetIds.length > 0 ? { geraetIds } : { bereichId: bereichId ?? undefined, kategorie }),
    geraetIds.length > 0 ? Promise.resolve([]) : listeBereiche(),
  ]);

  const einzelGeraet = geraetIds.length === 1 ? etiketten[0] : undefined;
  const pfad: PfadEintrag[] = einzelGeraet
    ? [
        { label: 'Geräte', href: '/geraete' },
        { label: einzelGeraet.bezeichnung, href: `/geraete/${einzelGeraet.geraetId}` },
        { label: 'Etikett drucken' },
      ]
    : [];
  const boegen = anzahlBoegen(etiketten.length, start);
  const anzahlText = `${etiketten.length === 1 ? '1 Etikett' : `${etiketten.length} Etiketten`} · ${boegen === 1 ? '1 Bogen' : `${boegen} Bögen`} A4 (24 je Bogen)`;

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="etiketten" />
      <main className="mx-auto max-w-[72rem] space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="nicht-drucken space-y-6">
          <Seitenkopf
            pfad={pfad}
            titel="Etiketten drucken"
            kontext={
              geraetIds.length > 0
                ? 'Etikett für ein Gerät. Restliche Felder des Bogens bleiben leer.'
                : 'Aufkleber mit QR-Code und Prüfplakette für Geräte Ihrer Bereiche.'
            }
          />
          <EtikettenAuswahl bereiche={bereiche} bereichId={bereichId} kategorie={kategorie} start={start} geraetIds={geraetIds} />

          {etiketten.length === 0 ? (
            <Leerzustand
              art="filter"
              titel="Keine Geräte für diese Auswahl."
              text="Es werden nur Geräte Ihrer Bereiche gedruckt."
              aktion={
                <Link href="/etiketten" className="btn btn-sekundaer">
                  Auswahl zurücksetzen
                </Link>
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink" aria-live="polite">
                  {anzahlText}
                </p>
                <DruckenButton />
              </div>
              {etiketten.length >= ETIKETTEN_MAX && (
                <Meldung art="warnung" live={false}>
                  Höchstens {ETIKETTEN_MAX} Etiketten je Druck. Bitte nach Bereich auswählen.
                </Meldung>
              )}
              <Meldung
                art="hinweis"
                text={
                  <ol className="mt-1 list-decimal space-y-1 pl-5">
                    <li>Bogen A4 mit 3 × 8 Etiketten à 70 × 37 mm einlegen.</li>
                    <li>Im Druckdialog: Skalierung 100 % („Tatsächliche Größe“), Ränder „Keine“, Kopf- und Fußzeilen aus.</li>
                    <li>Zuerst auf Normalpapier drucken und gegen den Bogen ans Licht halten.</li>
                  </ol>
                }
              >
                So drucken Sie richtig
              </Meldung>
            </>
          )}
        </div>

        {etiketten.length > 0 && (
          <section aria-labelledby="vorschau-titel" className="space-y-3">
            <h2 id="vorschau-titel" className="nicht-drucken text-xl font-semibold leading-7">
              Vorschau
            </h2>
            <div className="vorschau overflow-x-auto rounded-flaeche border border-steel-200 bg-steel-50 p-4">
              <EtikettenBogen etiketten={etiketten} start={start} plakette={PLAKETTE} />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
