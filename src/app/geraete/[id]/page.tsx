import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AnlassForm } from '@/components/AnlassForm';
import { AnlassListe } from '@/components/AnlassListe';
import { AppHeader } from '@/components/AppHeader';
import { BetriebsstatusBadge } from '@/components/BetriebsstatusBadge';
import { BetriebsstatusForm } from '@/components/BetriebsstatusForm';
import { GeraetVerschiebenForm } from '@/components/GeraetVerschiebenForm';
import { Leerzustand } from '@/components/Leerzustand';
import { MaengelTabelle } from '@/components/MaengelTabelle';
import { NachweisListe } from '@/components/NachweisListe';
import { NutzungAbschnitt } from '@/components/NutzungAbschnitt';
import { Pruefplakette } from '@/components/Pruefplakette';
import { PruefartKarte } from '@/components/PruefartKarte';
import { Seitenkopf } from '@/components/Seitenkopf';
import { StatusAmpel } from '@/components/StatusAmpel';
import { VerlaufListe } from '@/components/VerlaufListe';
import { datum } from '@/components/format';
import { can } from '@/domain/rechte';
import { BETRIEBSSTATUS_LABEL, EINSATZORT_LABEL, KATEGORIE_LABEL, type Bereich, type Id, type PersonOption, type PrueferOption } from '@/domain/types';
import { erfordereSitzung, heute, holeGeraetDetail, listeBereiche, listeMitarbeiterOptionen, listePrueferOptionen } from '@/server/data';

export const metadata: Metadata = { title: 'Geräteakte' };

/** Stammdaten-Zeile (§6.13): dt klein steel, dd Text; Leerwert „–“ mit Label „keine Angabe“. */
function Feld({ titel, wert, mono = false }: { titel: string; wert: React.ReactNode; mono?: boolean }) {
  const leer = wert === null || wert === undefined || wert === '';
  return (
    <div className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 py-1.5">
      <dt className="text-sm text-steel">{titel}</dt>
      <dd className={`min-w-0 [overflow-wrap:anywhere] ${mono && !leer ? 'font-mono' : ''}`}>
        {leer ? <span aria-label="keine Angabe">–</span> : wert}
      </dd>
    </div>
  );
}

const H2 = 'text-xl font-semibold leading-7 tracking-[-0.01em]';
/** Abstand für Anker: Abschnittsleiste klebt oben und darf die Überschrift nicht verdecken. */
const ABSCHNITT = 'scroll-mt-16 space-y-3';

function Zahl({ n, text }: { n: number; text: string }) {
  return (
    <span className="ml-1.5 tabular-nums text-steel">
      {n}
      <span className="sr-only"> {text}</span>
    </span>
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

  const ladeMitarbeiter = detail.nutzung?.darfZuordnen === true && geraet.kategorie === 'personenbezogen';
  const [prueferOptionen, bereiche, mitarbeiterOptionen]: [PrueferOption[], Bereich[], PersonOption[]] = await Promise.all([
    darfZuweisen ? listePrueferOptionen() : Promise.resolve([]),
    darfBearbeiten ? listeBereiche() : Promise.resolve([]),
    ladeMitarbeiter ? listeMitarbeiterOptionen() : Promise.resolve([]),
  ]);
  const ziele = bereiche.filter((b) => b.id !== bereich.id);
  const warnungAbgelaufen = detail.pruefarten.some((p) => p.status.grund === 'ausser_betrieb');

  const pruefartNamen = new Map<Id, string>(detail.pruefarten.map((p) => [p.pruefart.id, p.pruefart.bezeichnung]));

  const darfNachweiseLesen = can(sitzung.rolle, 'nachweis.lesen');
  const zeigeAnlaesse = (darfAnlass || detail.anlaesse.length > 0) && !istPruefer;
  const offeneAnlaesse = detail.anlaesse.filter((a) => a.offen).length;

  const abschnitte: { id: string; label: string; zahl?: { n: number; text: string } }[] = [
    { id: 'pruefarten', label: 'Prüfarten', zahl: { n: detail.pruefarten.length, text: 'Prüfarten' } },
    { id: 'stammdaten', label: 'Stammdaten' },
    ...(darfBearbeiten ? [{ id: 'betrieb', label: 'Betrieb und Standort' }] : []),
    ...(detail.nutzung ? [{ id: 'nutzung', label: 'Nutzung' }] : []),
    ...(zeigeAnlaesse ? [{ id: 'anlaesse', label: 'Anlassprüfungen', ...(offeneAnlaesse > 0 ? { zahl: { n: offeneAnlaesse, text: 'offen' } } : {}) }] : []),
    ...(darfMangelLesen ? [{ id: 'maengel', label: 'Mängel', zahl: { n: offeneMaengel, text: 'offen' } }] : []),
    ...(darfNachweiseLesen ? [{ id: 'nachweise', label: 'Nachweise', zahl: { n: detail.nachweise.length, text: 'Nachweise' } }] : []),
    ...(darfVerlauf ? [{ id: 'verlauf', label: 'Verlauf' }] : []),
  ];

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv={istPruefer ? 'pruefer' : 'geraete'} />
      <main className="mx-auto max-w-[80rem] px-4 pb-12 pt-6 md:px-6 xl:px-8">
        {/* Aktenkopf (§8.5): Plakette 96 links, darunter Fälligkeit als Text. */}
        <div className="karte flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
            <Pruefplakette status={detail.gesamtStatus} faelligAm={detail.naechsteFaelligkeit} groesse={96} />
            <p className="text-sm text-steel sm:text-center">
              <span className="sm:block">Nächste Prüfung</span>{' '}
              <span className="font-mono tabular-nums text-ink">{datum(detail.naechsteFaelligkeit)}</span>
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <Seitenkopf
              pfad={[
                istPruefer ? { label: 'Prüfaufgaben', href: '/pruefer' } : { label: 'Geräte', href: '/geraete' },
                { label: geraet.bezeichnung },
              ]}
              titel={geraet.bezeichnung}
              kontext={
                <>
                  <span className="font-mono text-ink">{geraet.inventarnummer ?? 'ohne Inventarnummer'}</span>
                  {' · '}
                  {bereich.name}
                </>
              }
              aktion={
                <div className="flex flex-wrap items-center gap-2">
                  <StatusAmpel status={detail.gesamtStatus} grund={detail.gesamtStatusGrund} />
                  <BetriebsstatusBadge status={geraet.betriebsstatus} immer />
                </div>
              }
            />
          </div>
        </div>

        {/* Abschnittsleiste mit Ankern (klebt oben). */}
        <nav
          aria-label="Abschnitte der Geräteakte"
          className="sticky top-0 z-30 -mx-4 mt-4 overflow-x-auto border-b border-steel-200 bg-paper px-4 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8"
        >
          <ul className="flex gap-x-5 whitespace-nowrap text-sm">
            {abschnitte.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="flex min-h-11 items-center text-ink hover:underline">
                  {a.label}
                  {a.zahl && <Zahl n={a.zahl.n} text={a.zahl.text} />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Ab xl zweispaltig: Inhalt 1fr, rechte Spalte 20 rem. DOM-Reihenfolge: Prüfarten, Stammdaten, Betrieb und Standort, Anlassprüfungen,, Mängel, Nachweise, Verlauf. */}
        <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr] xl:items-start">
          <section id="pruefarten" aria-labelledby="pruefarten-titel" className={`${ABSCHNITT} xl:col-start-1 xl:row-start-1`}>
            <h2 id="pruefarten-titel" className={H2}>
              Prüfarten
            </h2>
            {detail.pruefarten.length === 0 ? (
              <Leerzustand art="leer" ebene="h3" titel="Keine Prüfarten sichtbar." />
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

          <aside
            aria-label="Stammdaten, Betrieb und Anlässe"
            className="space-y-8 xl:col-start-2 xl:row-span-2 xl:row-start-1"
          >
            <section id="stammdaten" aria-labelledby="stammdaten-titel" className={ABSCHNITT}>
              <h2 id="stammdaten-titel" className={H2}>
                Stammdaten
              </h2>
              <dl className="karte divide-y divide-steel-200 px-4 py-1 text-sm">
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
            </section>

            {darfBearbeiten && (
              <section id="betrieb" aria-labelledby="betrieb-titel" className={ABSCHNITT}>
                <h2 id="betrieb-titel" className={H2}>
                  Betrieb und Standort
                </h2>
                <div className="karte divide-y divide-steel-200">
                  <details className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
                      <span>
                        <span className="block font-semibold">Betriebsstatus</span>
                        <span className="text-steel">{BETRIEBSSTATUS_LABEL[geraet.betriebsstatus]}</span>
                      </span>
                      <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 pt-1">
                      <BetriebsstatusForm
                        geraetId={geraet.id}
                        aktuell={geraet.betriebsstatus}
                        warnungAbgelaufen={warnungAbgelaufen}
                      />
                    </div>
                  </details>
                  <details className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
                      <span>
                        <span className="block font-semibold">Gerät verschieben</span>
                        <span className="text-steel">Aktueller Bereich: {bereich.name}</span>
                      </span>
                      <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 pt-1">
                      <GeraetVerschiebenForm geraetId={geraet.id} ziele={ziele} />
                    </div>
                  </details>
                </div>
              </section>
            )}

            {detail.nutzung && (
              <NutzungAbschnitt
                geraet={geraet}
                nutzung={detail.nutzung}
                mitarbeiterOptionen={mitarbeiterOptionen}
                darfEinladen={can(sitzung.rolle, 'mitarbeiter.einladen')}
                titelKlasse={H2}
              />
            )}

            {zeigeAnlaesse && (
              <section id="anlaesse" aria-labelledby="anlaesse-titel" className={ABSCHNITT}>
                <h2 id="anlaesse-titel" className={H2}>
                  Anlassprüfungen
                  {offeneAnlaesse > 0 && <Zahl n={offeneAnlaesse} text="offen" />}
                </h2>
                <AnlassListe anlaesse={detail.anlaesse} darfAufheben={darfAnlass} />
                {darfAnlass && detail.pruefarten.length > 0 && (
                  <details className="karte group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      Anlass erfassen
                      <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 group-open:rotate-180" />
                    </summary>
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
          </aside>

          <div className="space-y-8 xl:col-start-1 xl:row-start-2">
            {darfMangelLesen && (
              <section id="maengel" aria-labelledby="maengel-titel" className={ABSCHNITT}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="maengel-titel" className={H2}>
                    Mängel
                    <span className="ml-2 text-sm font-normal tracking-normal text-steel">
                      {offeneMaengel} offen
                      {detail.maengel.length > offeneMaengel ? `, ${detail.maengel.length - offeneMaengel} behoben` : ''}
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
                  <Leerzustand art="leer" ebene="h3" titel="Keine Mängel erfasst." />
                )}
              </section>
            )}

            {darfNachweiseLesen && (
              <section id="nachweise" aria-labelledby="nachweise-titel" className={ABSCHNITT}>
                <h2 id="nachweise-titel" className={H2}>
                  Nachweise
                </h2>
                <NachweisListe
                  nachweise={detail.nachweise}
                  leerText={darfNachweis ? 'Nachweise erfassen Sie in der jeweiligen Prüfart mit „Nachweis erfassen“.' : undefined}
                />
              </section>
            )}

            {darfVerlauf && (
              <section id="verlauf" aria-labelledby="verlauf-titel" className={ABSCHNITT}>
                <h2 id="verlauf-titel" className={H2}>
                  Verlauf
                </h2>
                <VerlaufListe verlauf={detail.verlauf} pruefartNamen={pruefartNamen} />
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
