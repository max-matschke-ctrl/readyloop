import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Leerzustand } from '@/components/Leerzustand';
import { MaMeldungsBereich } from '@/components/MaAktionen';
import { MeinGeraetKarte, geraetAnker } from '@/components/MeinGeraetKarte';
import { Meldung } from '@/components/Meldung';
import { Seitenkopf } from '@/components/Seitenkopf';
import type { MeinGeraet } from '@/domain/types';
import { erfordereSitzung, listeMeineGeraete } from '@/server/data';

export const metadata: Metadata = { title: 'Meine Geräte' };
export const dynamic = 'force-dynamic';

const ZURUECK = '/meine-geraete';

function Abschnitt({ id, titel, geraete }: { id: string; titel: string; geraete: MeinGeraet[] }) {
  if (geraete.length === 0) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-semibold leading-7 text-ink">
        {titel} ({geraete.length})
      </h2>
      <ul className="space-y-3">
        {geraete.map((g) => (
          <MeinGeraetKarte key={g.geraetId} geraet={g} variante="meine" zurueck={ZURUECK} />
        ))}
      </ul>
    </section>
  );
}

/** Sammelmeldung (§8.13): bis zu 3 Gerätenamen als Anker, ab 4 nur die Zahl. */
function NichtVerwendenMeldung({ geraete }: { geraete: MeinGeraet[] }) {
  const n = geraete.length;
  if (n === 0) return null;
  const satz = n === 1 ? '1 Gerät nicht verwenden.' : `${n} Geräte nicht verwenden.`;
  return (
    <Meldung
      art="fehler"
      live={false}
      className="text-base!"
      text={
        n <= 3 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {geraete.map((g) => (
              <li key={g.geraetId}>
                <a href={`#${geraetAnker(g.geraetId)}`} className="inline-flex min-h-12 items-center text-brick-800 underline decoration-brick underline-offset-2">
                  {g.bezeichnung}
                </a>
              </li>
            ))}
          </ul>
        ) : undefined
      }
    >
      {satz}
    </Meldung>
  );
}

/**
 * Meine Geräte (US-17, §8.13): „Von mir übernommen“ vor „Mir zugeordnet“, Sortierung vom Server.
 * Gleich am Handy und am Büro-PC (P-09): Karten, ab lg Zeilenkarten.
 */
export default async function MeineGeraeteSeite() {
  const sitzung = await erfordereSitzung('meine_geraete.lesen');
  const geraete = await listeMeineGeraete();
  const uebernommen = geraete.filter((g) => g.bezug === 'uebernommen');
  const zugeordnet = geraete.filter((g) => g.bezug === 'zugeordnet');
  const nichtVerwenden = [...uebernommen, ...zugeordnet].filter((g) => g.nutzung === 'nicht_verwenden');

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="meine_geraete" />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6 lg:max-w-[64rem]">
        <Seitenkopf
          pfad={[]}
          titel="Meine Geräte"
          kontext={`bei ${sitzung.organisation.name}`}
          aktion={
            <Link href="/meine-geraete/suchen" className="btn btn-sekundaer btn-halle">
              Gerät suchen
            </Link>
          }
        />
        <MaMeldungsBereich>
          <div className="space-y-8">
            <NichtVerwendenMeldung geraete={nichtVerwenden} />
            {geraete.length === 0 ? (
              <div className="space-y-3">
                <Leerzustand
                  art="leer"
                  titel="Ihnen sind keine Geräte zugeordnet."
                  text={<p className="text-base text-ink">Geräte, die Sie übernehmen oder die Ihnen zugeordnet werden, erscheinen hier.</p>}
                  aktion={
                    <Link href="/meine-geraete/suchen" className="btn btn-primaer btn-haupt">
                      Gerät suchen
                    </Link>
                  }
                />
                <p className="text-sm text-steel">Am Handy: QR-Code am Gerät mit der Kamera scannen.</p>
              </div>
            ) : (
              <>
                <Abschnitt id="abschnitt-uebernommen" titel="Von mir übernommen" geraete={uebernommen} />
                <Abschnitt id="abschnitt-zugeordnet" titel="Mir zugeordnet" geraete={zugeordnet} />
              </>
            )}
          </div>
        </MaMeldungsBereich>
      </main>
    </>
  );
}
