import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MangelMeldenForm } from '@/components/MangelMeldenForm';
import { Meldung } from '@/components/Meldung';
import { NutzungsHinweis } from '@/components/NutzungsHinweis';
import { Pruefplakette } from '@/components/Pruefplakette';
import { Seitenkopf, type PfadEintrag } from '@/components/Seitenkopf';
import { erfordereSitzung, holeMangelMeldung } from '@/server/data';
import { sichererRuecksprung } from '@/server/pfade';

export const metadata: Metadata = { title: 'Mangel melden' };
export const dynamic = 'force-dynamic';

type Params = Promise<{ geraetId: string }>;
type SuchParams = Promise<Record<string, string | string[] | undefined>>;

/** Rücksprung: nur relativ (sonst /meine-geraete). Pfad und Beschriftung je Herkunft (§8.15). */
function herkunft(zurueck: string): { pfad: PfadEintrag; label: string } {
  if (zurueck.startsWith('/g/')) return { pfad: { label: 'Gerät', href: zurueck }, label: 'Zurück zum Gerät' };
  if (zurueck.startsWith('/meine-geraete/suchen')) return { pfad: { label: 'Gerät suchen', href: zurueck }, label: 'Zurück zur Suche' };
  return { pfad: { label: 'Meine Geräte', href: '/meine-geraete' }, label: 'Zurück zu meinen Geräten' };
}

/** Mangel melden durch Mitarbeiter (F-26, US-30, §8.15). Kein Termin- und kein Prüfart-Feld. */
export default async function MangelMeldenSeite({ params, searchParams }: { params: Params; searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung();
  const { geraetId } = await params;
  const geraet = await holeMangelMeldung(geraetId);
  if (!geraet) notFound();
  const sp = await searchParams;
  const zurueck = sichererRuecksprung(typeof sp.zurueck === 'string' ? sp.zurueck : null, '/meine-geraete');
  const h = herkunft(zurueck);

  return (
    <>
      <AppHeader sitzung={sitzung} />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6">
        <Seitenkopf pfad={[h.pfad, { label: 'Mangel melden' }]} titel="Mangel melden" />

        <section aria-label="Gerät" className="karte overflow-hidden">
          {geraet.nutzung !== 'verwendbar' && (
            <NutzungsHinweis
              groesse="kompakt"
              nutzung={geraet.nutzung}
              gesamtStatus={geraet.gesamtStatus}
              grund={geraet.gesamtStatusGrund}
              betriebsstatus={geraet.betriebsstatus}
              naechsteFaelligkeit={geraet.naechsteFaelligkeit}
            />
          )}
          <div className="flex items-center gap-3 p-4">
            <Pruefplakette status={geraet.gesamtStatus} faelligAm={geraet.naechsteFaelligkeit} groesse={56} />
            <div className="min-w-0 space-y-1">
              <p className="text-[1.0625rem] font-semibold leading-6 text-ink [overflow-wrap:anywhere]">{geraet.bezeichnung}</p>
              {geraet.inventarnummer && <p className="font-mono text-base tabular-nums text-ink">{geraet.inventarnummer}</p>}
              {geraet.nutzung === 'verwendbar' && (
                <NutzungsHinweis
                  groesse="kompakt"
                  nutzung={geraet.nutzung}
                  gesamtStatus={geraet.gesamtStatus}
                  grund={geraet.gesamtStatusGrund}
                  betriebsstatus={geraet.betriebsstatus}
                  naechsteFaelligkeit={geraet.naechsteFaelligkeit}
                />
              )}
            </div>
          </div>
        </section>

        <Meldung art="warnung" live={false} className="text-base!">
          Bei Gefahr: Gerät nicht verwenden und den Verantwortlichen sofort ansprechen.
        </Meldung>

        <MangelMeldenForm geraetId={geraet.geraetId} zurueck={zurueck} zurueckLabel={h.label} />
      </main>
    </>
  );
}
