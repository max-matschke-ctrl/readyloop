import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnlassForm } from '@/components/AnlassForm';
import { AnlassListe } from '@/components/AnlassListe';
import { AppHeader } from '@/components/AppHeader';
import { BetriebsstatusBadge } from '@/components/BetriebsstatusBadge';
import { BetriebsstatusForm } from '@/components/BetriebsstatusForm';
import { GeraetVerschiebenForm } from '@/components/GeraetVerschiebenForm';
import { MaengelTabelle } from '@/components/MaengelTabelle';
import { NachweisListe } from '@/components/NachweisListe';
import { Pruefplakette } from '@/components/Pruefplakette';
import { PruefartKarte } from '@/components/PruefartKarte';
import { StatusAmpel } from '@/components/StatusAmpel';
import { VerlaufListe } from '@/components/VerlaufListe';
import { datum } from '@/components/format';
import { can } from '@/domain/rechte';
import { BETRIEBSSTATUS_LABEL, EINSATZORT_LABEL, KATEGORIE_LABEL, type Bereich, type Id, type PrueferOption } from '@/domain/types';
import { erfordereSitzung, heute, holeGeraetDetail, listeBereiche, listePrueferOptionen } from '@/server/data';

export const metadata: Metadata = { title: 'Geräteakte' };

function Feld({ titel, wert, mono = false }: { titel: string; wert: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-steel">{titel}</dt>
      <dd className={`text-sm ${mono ? 'font-mono' : ''}`}>{wert ?? '–'}</dd>
    </div>
  );
}

export default async function GeraetDetailSeite({ params }: { params: Promise<{ id: string }> }) {
  const sitzung = await erfordereSitzung('geraet.lesen');
  const { id } = await params;
  const detail = await holeGeraetDetail(id);
  if (!detail) notFound();

  const { geraet, bereich } = detail;
  const darfFreigeben = can(sitzung.rolle, 'frist.freigeben');
  const darfNachweis = can(sitzung.rolle, 'nachweis.erfassen');
  const darfVerlauf = can(sitzung.rolle, 'verlauf.lesen');
  const istPruefer = sitzung.rolle === 'pruefer';
  const darfBearbeiten = can(sitzung.rolle, 'geraet.bearbeiten');
  const darfZuweisen = can(sitzung.rolle, 'pruefer.zuweisen');
  const darfAnlass = can(sitzung.rolle, 'anlass.erfassen');
  const darfMangelLesen = can(sitzung.rolle, 'mangel.lesen');
  const darfMangelErfassen = can(sitzung.rolle, 'mangel.erfassen');
  const offeneMaengel = detail.maengel.filter((m) => m.status !== 'behoben').length;

  const [prueferOptionen, bereiche]: [PrueferOption[], Bereich[]] = await Promise.all([
    darfZuweisen ? listePrueferOptionen() : Promise.resolve([]),
    darfBearbeiten ? listeBereiche() : Promise.resolve([]),
  ]);
  const ziele = bereiche.filter((b) => b.id !== bereich.id);
  const warnungAbgelaufen = detail.pruefarten.some((p) => p.status.grund === 'ausser_betrieb');

  const pruefartNamen = new Map<Id, string>(detail.pruefarten.map((p) => [p.pruefart.id, p.pruefart.bezeichnung]));

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istPruefer ? 'pruefer' : 'geraete'} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <p className="text-sm">
          <Link href={istPruefer ? '/pruefer' : '/geraete'} className="link">
            ← {istPruefer ? 'Prüfaufgaben' : 'Geräteliste'}
          </Link>
        </p>

        <section aria-labelledby="geraet-titel" className="karte flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <Pruefplakette status={detail.gesamtStatus} faelligAm={detail.naechsteFaelligkeit} groesse={64} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 id="geraet-titel" className="text-2xl font-bold">
                {geraet.bezeichnung}
              </h1>
              <StatusAmpel status={detail.gesamtStatus} grund={detail.gesamtStatusGrund} />
              <BetriebsstatusBadge status={geraet.betriebsstatus} />
            </div>
            <p className="text-sm text-steel">
              Nächste Prüfung: <span className="font-mono text-ink">{datum(detail.naechsteFaelligkeit)}</span>
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              <Feld titel="Inventarnummer" wert={geraet.inventarnummer} mono />
              <Feld titel="Bereich" wert={bereich.name} />
              <Feld
                titel="Einsatzort"
                wert={
                  <>
                    {EINSATZORT_LABEL[detail.einsatzort]}
                    {geraet.einsatzort && <span className="block text-xs text-steel">abweichend vom Bereich</span>}
                  </>
                }
              />
              <Feld titel="Kategorie" wert={KATEGORIE_LABEL[geraet.kategorie]} />
              <Feld titel="Hersteller" wert={geraet.hersteller} />
              <Feld titel="Typ" wert={geraet.typ} />
              <Feld titel="Seriennummer" wert={geraet.seriennummer} mono />
              <Feld titel="Baujahr" wert={geraet.baujahr} mono />
              <Feld titel="Betriebsstatus" wert={BETRIEBSSTATUS_LABEL[geraet.betriebsstatus]} />
            </dl>
          </div>
        </section>

        <section aria-labelledby="pruefarten-titel" className="space-y-3">
          <h2 id="pruefarten-titel" className="text-lg font-semibold">
            Prüfarten
          </h2>
          {detail.pruefarten.length === 0 ? (
            <p className="text-sm text-steel">Keine Prüfarten sichtbar.</p>
          ) : (
            detail.pruefarten.map((p) => (
              <PruefartKarte
                key={p.pruefart.id}
                ansicht={p}
                darfFreigeben={darfFreigeben}
                darfNachweisErfassen={darfNachweis}
                darfZuweisen={darfZuweisen}
                prueferOptionen={prueferOptionen}
                darfMangelErfassen={darfMangelErfassen}
              />
            ))
          )}
        </section>

        {darfMangelLesen && (
          <section aria-labelledby="maengel-titel" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="maengel-titel" className="text-lg font-semibold">
                Mängel{' '}
                <span className="font-mono text-sm font-normal text-steel">
                  ({offeneMaengel} offen{detail.maengel.length > offeneMaengel ? `, ${detail.maengel.length - offeneMaengel} behoben` : ''})
                </span>
              </h2>
              {darfMangelErfassen && (
                <Link
                  href={`/maengel/neu?geraet=${geraet.id}&zurueck=${encodeURIComponent(`/geraete/${geraet.id}`)}`}
                  className="btn btn-sekundaer"
                >
                  Mangel erfassen
                </Link>
              )}
            </div>
            {detail.maengel.length > 0 ? (
              <MaengelTabelle maengel={detail.maengel} mitGeraet={false} />
            ) : (
              <p className="text-sm text-steel">Keine Mängel erfasst.</p>
            )}
          </section>
        )}

        {darfBearbeiten && (
          <section aria-labelledby="betrieb-titel" className="space-y-3">
            <h2 id="betrieb-titel" className="text-lg font-semibold">
              Betrieb und Standort
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="karte space-y-2 p-4">
                <h3 className="font-semibold">Betriebsstatus</h3>
                <BetriebsstatusForm geraetId={geraet.id} aktuell={geraet.betriebsstatus} warnungAbgelaufen={warnungAbgelaufen} />
              </div>
              <div className="karte space-y-2 p-4">
                <h3 className="font-semibold">Gerät verschieben</h3>
                <p className="text-sm">
                  Aktueller Bereich: <strong>{bereich.name}</strong>
                </p>
                <GeraetVerschiebenForm geraetId={geraet.id} ziele={ziele} />
              </div>
            </div>
          </section>
        )}

        {(darfAnlass || detail.anlaesse.length > 0) && !istPruefer && (
          <section aria-labelledby="anlaesse-titel" className="space-y-3">
            <h2 id="anlaesse-titel" className="text-lg font-semibold">
              Anlassprüfungen
            </h2>
            <AnlassListe anlaesse={detail.anlaesse} darfAufheben={darfAnlass} />
            {darfAnlass && detail.pruefarten.length > 0 && (
              <details className="karte">
                <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Anlass erfassen</summary>
                <div className="px-4 pb-4 pt-1">
                  <AnlassForm
                    geraetId={geraet.id}
                    pruefarten={detail.pruefarten.map((p) => ({ id: p.pruefart.id, bezeichnung: p.pruefart.bezeichnung }))}
                    heute={heute()}
                  />
                </div>
              </details>
            )}
          </section>
        )}

        {can(sitzung.rolle, 'nachweis.lesen') && (
          <section aria-labelledby="nachweise-titel" className="space-y-3">
            <h2 id="nachweise-titel" className="text-lg font-semibold">
              Nachweise
            </h2>
            <NachweisListe nachweise={detail.nachweise} />
          </section>
        )}

        {darfVerlauf && (
          <section aria-labelledby="verlauf-titel" className="space-y-3">
            <h2 id="verlauf-titel" className="text-lg font-semibold">
              Verlauf
            </h2>
            <VerlaufListe verlauf={detail.verlauf} pruefartNamen={pruefartNamen} />
          </section>
        )}
      </main>
    </>
  );
}
