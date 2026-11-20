import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MangelBehebenForm } from '@/components/MangelBehebenForm';
import { MangelKenntnisForm } from '@/components/MangelKenntnisForm';
import { MangelSchwereBadge, MangelStatusBadge } from '@/components/MangelStatusBadge';
import { Pruefplakette } from '@/components/Pruefplakette';
import { Seitenkopf } from '@/components/Seitenkopf';
import { Unteraufklapper } from '@/components/Unteraufklapper';
import { datum, zeitpunkt } from '@/components/format';
import { can } from '@/domain/rechte';
import type { PersonOption } from '@/domain/types';
import { erfordereSitzung, heute, holeGeraetDetail, holeMangel, listeMangelVerantwortliche } from '@/server/data';

export const metadata: Metadata = { title: 'Mangel' };

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 py-1.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-steel">{titel}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

const LINIE =
  'relative before:absolute before:inset-y-0 before:left-[6px] before:w-px before:bg-steel-200 before:content-[""] sm:before:left-[calc(9.5rem+0.5rem)]';

/** Verlaufseintrag (§6.14): Datum links in Mono, Punkt, rechts Ereignis und Person. */
function Ereignis({ wann, punkt, titel, children }: { wann: string; punkt: string; titel: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className="relative grid gap-x-4 gap-y-0.5 py-2.5 pl-6 text-sm sm:grid-cols-[9.5rem_1fr] sm:pl-0">
      <span className="font-mono text-sm tabular-nums text-steel sm:pt-px sm:text-right">{wann}</span>
      <span
        aria-hidden="true"
        className="absolute left-[2.5px] top-[1.0625rem] size-2 rounded-full ring-2 ring-white sm:left-[calc(9.5rem+0.5rem-3.5px)]"
        style={{ background: punkt }}
      />
      <div className="min-w-0 sm:pl-4">
        <p>{titel}</p>
        {children}
      </div>
    </li>
  );
}

/** Mangelakte (§8.9): Kopf mit Mangelstatus, Geräteverweis mit Plakette, Verlauf, Aktionen als Disclosures. */
export default async function MangelSeite({ params }: { params: Promise<{ id: string }> }) {
  const sitzung = await erfordereSitzung('mangel.lesen');
  const { id } = await params;
  const mangel = await holeMangel(id);
  if (!mangel) notFound();

  const darfBearbeiten = can(sitzung.rolle, 'mangel.bearbeiten');
  const [verantwortliche, geraet] = await Promise.all([
    darfBearbeiten && mangel.status !== 'behoben' ? listeMangelVerantwortliche() : Promise.resolve([] as PersonOption[]),
    holeGeraetDetail(mangel.geraetId),
  ]);
  const h = heute();
  const kurzTitel = mangel.beschreibung.length > 60 ? `${mangel.beschreibung.slice(0, 60)} …` : mangel.beschreibung;
  const mitAktionen = darfBearbeiten && mangel.status !== 'behoben';

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="maengel" />
      <main className="mx-auto max-w-[80rem] space-y-8 px-4 py-6 md:px-6 xl:px-8">
        <Seitenkopf pfad={[{ label: 'Mängel', href: '/maengel' }, { label: kurzTitel }]} titel="Mangel" />

        <div className={mitAktionen ? 'grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]' : ''}>
          <div className="min-w-0 space-y-8">
            <section aria-label="Mangel" className="karte overflow-hidden">
              <div className="space-y-3 border-b border-steel-200 px-4 py-4">
                <p className="flex flex-wrap items-center gap-2">
                  <MangelStatusBadge status={mangel.status} />
                  <MangelSchwereBadge schwere={mangel.schwere} lang />
                </p>
                <p className="max-w-prose whitespace-pre-line text-base">{mangel.beschreibung}</p>
                {mangel.terminUeberschritten && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-brick">
                    <span aria-hidden="true">✕</span>Frist zur Behebung überschritten.
                  </p>
                )}
              </div>
              <Link
                href={`/geraete/${mangel.geraetId}`}
                className="flex items-center gap-3 border-b border-steel-200 px-4 py-3 hover:bg-steel-50 focus-visible:-outline-offset-2"
              >
                {geraet && <Pruefplakette status={geraet.gesamtStatus} faelligAm={geraet.naechsteFaelligkeit} groesse={40} />}
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-ink underline decoration-steel-400 underline-offset-2">{mangel.geraetBezeichnung}</span>
                  <span className="block text-steel">
                    <span className="font-mono">{mangel.inventarnummer ?? 'ohne Inventarnummer'}</span> · {mangel.bereichName}
                  </span>
                </span>
              </Link>
              <dl className="px-4 py-2">
                <Zeile titel="Prüfart">{mangel.pruefartBezeichnung ?? <span className="text-steel">Gerät allgemein</span>}</Zeile>
                <Zeile titel="Aus Nachweis">{mangel.nachweisId ? 'ja' : <span className="text-steel">nein</span>}</Zeile>
                <Zeile titel="Verantwortlich">{mangel.verantwortlichName ?? <span className="text-steel">noch nicht festgelegt</span>}</Zeile>
                <Zeile titel="Frist bis">
                  <span className={`font-mono tabular-nums ${mangel.terminUeberschritten ? 'font-semibold' : ''}`}>{datum(mangel.termin)}</span>
                </Zeile>
              </dl>
            </section>

            <section aria-labelledby="mangel-verlauf" className="space-y-3">
              <h2 id="mangel-verlauf" className="text-xl font-semibold leading-7">
                Verlauf
              </h2>
              <div className="karte px-4 py-2">
                <ol className={LINIE} reversed>
                  {mangel.behobenAm && (
                    <Ereignis
                      wann={datum(mangel.behobenAm)}
                      punkt="var(--color-moss)"
                      titel={
                        <>
                          <span className="font-medium">Behoben</span>
                          {mangel.behobenDurch && <span className="text-steel"> · durch {mangel.behobenDurch}</span>}
                        </>
                      }
                    >
                      {mangel.behebung && <p className="text-sm">Maßnahme: {mangel.behebung}</p>}
                      {mangel.behebungErfasstAm && (
                        <p className="text-xs text-steel">
                          Eingetragen von {mangel.behebungErfasstVonName ?? 'unbekannt'} am {zeitpunkt(mangel.behebungErfasstAm)}
                        </p>
                      )}
                    </Ereignis>
                  )}
                  {mangel.kenntnisAm && (
                    <Ereignis
                      wann={zeitpunkt(mangel.kenntnisAm)}
                      punkt="var(--color-ochre-600)"
                      titel={
                        <>
                          <span className="font-medium">Zur Kenntnis genommen</span>
                          <span className="text-steel"> · {mangel.kenntnisVonName ?? 'unbekannt'}</span>
                        </>
                      }
                    />
                  )}
                  <Ereignis
                    wann={zeitpunkt(mangel.erfasstAm)}
                    punkt="var(--color-brick)"
                    titel={
                      <>
                        <span className="font-medium">Erfasst</span>
                        <span className="text-steel"> · {mangel.erfasstVonName}</span>
                      </>
                    }
                  />
                </ol>
              </div>
            </section>
          </div>

          {mitAktionen && (
            <aside aria-label="Aktionen zum Mangel" className="space-y-3 xl:sticky xl:top-4 xl:self-start">
              {mangel.status === 'offen' && (
                <Unteraufklapper titel="Zur Kenntnis nehmen" zusammenfassung="Verantwortlichen und Frist festlegen" offen>
                  <MangelKenntnisForm
                    mangelId={mangel.id}
                    verantwortliche={verantwortliche}
                    vorbelegtVerantwortlich={mangel.verantwortlichId}
                    termin={mangel.termin}
                    heute={h}
                  />
                </Unteraufklapper>
              )}
              <Unteraufklapper titel="Behebung eintragen" zusammenfassung="Datum, Person oder Firma, Maßnahme" offen={mangel.status === 'in_bearbeitung'}>
                <MangelBehebenForm mangelId={mangel.id} heute={h} fruehestens={mangel.erfasstAm.slice(0, 10)} />
              </Unteraufklapper>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
