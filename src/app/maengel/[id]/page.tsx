import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { MangelBehebenForm } from '@/components/MangelBehebenForm';
import { MangelKenntnisForm } from '@/components/MangelKenntnisForm';
import { MangelSchwereBadge, MangelStatusBadge } from '@/components/MangelStatusBadge';
import { datum, zeitpunkt } from '@/components/format';
import { can } from '@/domain/rechte';
import type { PersonOption } from '@/domain/types';
import { erfordereSitzung, heute, holeMangel, listeMangelVerantwortliche } from '@/server/data';

export const metadata: Metadata = { title: 'Mangel' };

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1 text-sm sm:grid-cols-[11rem_1fr]">
      <dt className="text-steel">{titel}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export default async function MangelSeite({ params }: { params: Promise<{ id: string }> }) {
  const sitzung = await erfordereSitzung('mangel.lesen');
  const { id } = await params;
  const mangel = await holeMangel(id);
  if (!mangel) notFound();

  const darfBearbeiten = can(sitzung.rolle, 'mangel.bearbeiten');
  const verantwortliche: PersonOption[] = darfBearbeiten && mangel.status !== 'behoben' ? await listeMangelVerantwortliche() : [];
  const h = heute();

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="maengel" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <p className="flex flex-wrap gap-4 text-sm">
          <Link href="/maengel" className="link">
            ← Mängel
          </Link>
          <Link href={`/geraete/${mangel.geraetId}`} className="link">
            Zur Geräteakte
          </Link>
        </p>

        <section aria-labelledby="mangel-titel" className="karte space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="mangel-titel" className="text-2xl font-bold">
              Mangel
            </h1>
            <MangelStatusBadge status={mangel.status} />
            <MangelSchwereBadge schwere={mangel.schwere} lang />
          </div>
          <p className="whitespace-pre-line">{mangel.beschreibung}</p>
          <dl>
            <Zeile titel="Gerät">
              <Link href={`/geraete/${mangel.geraetId}`} className="link">
                {mangel.geraetBezeichnung}
              </Link>
              <span className="font-mono text-xs text-steel"> · {mangel.inventarnummer ?? 'ohne Inventarnummer'}</span>
            </Zeile>
            <Zeile titel="Bereich">{mangel.bereichName}</Zeile>
            <Zeile titel="Prüfart">{mangel.pruefartBezeichnung ?? <span className="text-steel">Gerät allgemein</span>}</Zeile>
            <Zeile titel="Aus Nachweis">{mangel.nachweisId ? 'ja' : <span className="text-steel">nein</span>}</Zeile>
            <Zeile titel="Verantwortlich">{mangel.verantwortlichName ?? <span className="text-steel">noch nicht festgelegt</span>}</Zeile>
            <Zeile titel="Termin">
              <span className={`font-mono ${mangel.terminUeberschritten ? 'font-semibold text-brick' : ''}`}>{datum(mangel.termin)}</span>
              {mangel.terminUeberschritten && (
                <span className="ml-2 font-semibold text-brick">
                  <span aria-hidden="true">✕ </span>Termin überschritten
                </span>
              )}
            </Zeile>
          </dl>
        </section>

        <section aria-labelledby="mangel-verlauf" className="space-y-2">
          <h2 id="mangel-verlauf" className="text-lg font-semibold">
            Verlauf
          </h2>
          <ol className="karte divide-y divide-steel/15 text-sm">
            <li className="px-4 py-2">
              <span className="font-medium">Erfasst</span>
              <span className="text-steel">
                {' '}
                · {mangel.erfasstVonName} · {zeitpunkt(mangel.erfasstAm)}
              </span>
            </li>
            {mangel.kenntnisAm && (
              <li className="px-4 py-2">
                <span className="font-medium">Zur Kenntnis genommen</span>
                <span className="text-steel">
                  {' '}
                  · {mangel.kenntnisVonName ?? 'unbekannt'} · {zeitpunkt(mangel.kenntnisAm)}
                </span>
              </li>
            )}
            {mangel.behobenAm && (
              <li className="px-4 py-2">
                <p>
                  <span className="font-medium">Behoben am {datum(mangel.behobenAm)}</span>
                  {mangel.behobenDurch && <span> durch {mangel.behobenDurch}</span>}
                </p>
                {mangel.behebung && <p className="text-xs">Maßnahme: {mangel.behebung}</p>}
                {mangel.behebungErfasstAm && (
                  <p className="text-xs text-steel">
                    eingetragen von {mangel.behebungErfasstVonName ?? 'unbekannt'} · {zeitpunkt(mangel.behebungErfasstAm)}
                  </p>
                )}
              </li>
            )}
          </ol>
        </section>

        {darfBearbeiten && mangel.status === 'offen' && (
          <section aria-labelledby="kenntnis-titel" className="karte space-y-3 p-4">
            <h2 id="kenntnis-titel" className="text-lg font-semibold">
              Zur Kenntnis nehmen
            </h2>
            <MangelKenntnisForm
              mangelId={mangel.id}
              verantwortliche={verantwortliche}
              vorbelegtVerantwortlich={mangel.verantwortlichId}
              termin={mangel.termin}
              heute={h}
            />
          </section>
        )}

        {darfBearbeiten && mangel.status !== 'behoben' && (
          <section aria-labelledby="beheben-titel" className="karte space-y-3 p-4">
            <h2 id="beheben-titel" className="text-lg font-semibold">
              Behebung eintragen
            </h2>
            <MangelBehebenForm mangelId={mangel.id} heute={h} fruehestens={mangel.erfasstAm.slice(0, 10)} />
          </section>
        )}
      </main>
    </>
  );
}
