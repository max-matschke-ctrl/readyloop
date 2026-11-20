import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  ANLASS_ART_LABEL,
  DATUMSHERKUNFT_LABEL,
  PRUEF_ERGEBNIS_LABEL,
  FRIST_QUELLE_LABEL,
  PRUEFER_TYP_LABEL,
  type FristVorschlag,
  type KatalogEintrag,
  type PruefartAnsicht,
  type PrueferOption,
} from '@/domain/types';
import { FristFreigabeForm } from './FristFreigabeForm';
import { GbuVerweisForm } from './GbuVerweisForm';
import { PrueferDeaktiviertHinweis } from './PrueferDeaktiviertHinweis';
import { PrueferZuweisungForm } from './PrueferZuweisungForm';
import { Pruefplakette } from './Pruefplakette';
import { StatusAmpel } from './StatusAmpel';
import { StufeBadge, StufeMitText } from './StufeBadge';
import { datum, monate, restTageText, zeitpunkt } from './format';

interface Props {
  ansicht: PruefartAnsicht;
  darfFreigeben: boolean;
  darfNachweisErfassen: boolean;
  darfZuweisen?: boolean;
  prueferOptionen?: PrueferOption[];
  darfMangelErfassen?: boolean;
}

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 py-1.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-steel">{titel}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Ein Feld der Fristzeile: Label klein steel, Wert darunter. */
function FristFeld({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-4 py-3">
      <dt className="text-sm text-steel">{titel}</dt>
      <dd className="mt-0.5 min-w-0 text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

type StreifenArt = 'fehler' | 'warnung';

/** Warnstreifen (§6.11, §8.5 Regel 2): Fläche -50, Linie links 4 px, Symbol und Text in ink. */
function Warnstreifen({
  art,
  symbol,
  rolle,
  titel,
  children,
}: {
  art: StreifenArt;
  symbol: string;
  rolle: 'alert' | 'note';
  titel: React.ReactNode;
  children?: React.ReactNode;
}) {
  const fehler = art === 'fehler';
  return (
    <div
      role={rolle}
      className={`flex gap-2.5 border-b border-l-4 border-b-steel-200 px-4 py-2.5 text-sm text-ink ${
        fehler ? 'border-l-brick bg-brick-50' : 'border-l-ochre-600 bg-ochre-50'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-px inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none ${
          fehler ? 'bg-brick text-white' : 'bg-ochre text-ink'
        }`}
      >
        {symbol}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{titel}</p>
        {children}
      </div>
    </div>
  );
}

/** Disclosure in der Karte: geschlossen zeigt sie eine Zeile Zusammenfassung (§8.5 Regel 5). */
function Aufklapper({
  titel,
  zusammenfassung,
  offen,
  children,
}: {
  titel: string;
  zusammenfassung: React.ReactNode;
  offen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={offen} className="group border-t border-steel-200">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-steel-50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-semibold">{titel}</span>
          <span className="block text-steel [overflow-wrap:anywhere]">{zusammenfassung}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.75}
          className="shrink-0 transition-transform duration-[var(--dauer-mittel)] group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}

function Fundstelle({ text, url }: { text: string; url: string | null }) {
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link">
      {text}
      <span className="sr-only"> (öffnet in neuem Fenster)</span>
    </a>
  ) : (
    <>{text}</>
  );
}

function vorschlagText(v: FristVorschlag): string | null {
  if (v.art === 'katalog') return `${monate(v.monate)} laut Prüfkatalog, Stufe ${v.stufe}, ${v.fundstelle}`;
  if (v.art === 'hersteller') return `${monate(v.monate)} laut Herstellerangabe, Stufe C, ${v.fundstelle}`;
  return null;
}

const GBU_GRUND: Record<'kein_eintrag' | 'nur_entwurf' | 'ohne_intervall', string> = {
  kein_eintrag: 'Kein Katalogeintrag für diese Prüfart.',
  nur_entwurf: 'Nur ein Katalogentwurf vorhanden – Entwürfe erzeugen keine Frist.',
  ohne_intervall: 'Der Katalog nennt kein festes Intervall.',
};

function EntwurfKasten({ eintrag }: { eintrag: KatalogEintrag }) {
  const entwurf = eintrag.freigabestatus !== 'freigegeben';
  return (
    <div className="mt-2 rounded-feld border border-dashed border-steel-400 bg-white px-3 py-2 text-sm">
      <p className="font-medium">
        {entwurf ? 'Katalogentwurf – nicht fachlich freigegeben' : 'Prüfkatalog (ohne Intervall)'}
        {': '}
        {eintrag.intervallMonate !== null ? monate(eintrag.intervallMonate) : 'kein Intervall'}, Stufe {eintrag.stufe},{' '}
        <Fundstelle text={eintrag.fundstelle} url={eintrag.quelleUrl} />
      </p>
      {entwurf && <p className="mt-1 text-xs text-steel">Nur zur Orientierung. Die Frist muss über die GBU festgelegt werden.</p>}
    </div>
  );
}

function VorschlagBlock({ v }: { v: FristVorschlag }) {
  if (v.art === 'gbu') {
    return (
      <div>
        <p className="text-sm font-medium">Frist über GBU festlegen</p>
        <p className="text-sm text-steel">{GBU_GRUND[v.grund]}</p>
        {v.orientierung && <EntwurfKasten eintrag={v.orientierung} />}
      </div>
    );
  }
  if (v.art === 'katalog') {
    return (
      <p className="text-sm">
        <span className="font-medium">{monate(v.monate)}</span> laut Prüfkatalog (Version {v.eintrag.version}){' '}
        <StufeBadge stufe={v.stufe} /> · <Fundstelle text={v.fundstelle} url={v.quelleUrl} />
      </p>
    );
  }
  return (
    <p className="text-sm">
      <span className="font-medium">{monate(v.monate)}</span> laut Herstellerangabe <StufeBadge stufe="C" /> · {v.fundstelle}
      {v.verdraengt && v.verdraengt.intervallMonate !== null && (
        <span className="block text-xs text-steel">
          Kürzer als der Prüfkatalog ({monate(v.verdraengt.intervallMonate)}, {v.verdraengt.fundstelle}) – Herstellerfrist hat Vorrang.
        </span>
      )}
    </p>
  );
}

export function PruefartKarte({ ansicht, darfFreigeben, darfNachweisErfassen, darfZuweisen = false, prueferOptionen = [], darfMangelErfassen = false }: Props) {
  const { pruefart, vorschlag, status, katalogEintrag, letzterNachweis } = ansicht;
  const nachErgebnis =
    ansicht.fristHinweis === 'empfehlung_abweichend' && letzterNachweis
      ? {
          nachweisId: letzterNachweis.id,
          nachweisText: `Nachweis vom ${datum(letzterNachweis.pruefdatum)} (${PRUEF_ERGEBNIS_LABEL[letzterNachweis.ergebnis]})`,
          monate: letzterNachweis.fristEmpfehlungMonate,
        }
      : null;
  const frist = pruefart.frist;
  const rest = restTageText(status.restTage);
  const vText = vorschlagText(vorschlag);
  // Vorschlag-Button nur, wenn der Vorschlag noch nicht genau so freigegeben ist.
  const vorschlagFreigebbar =
    vorschlag.art !== 'gbu' && !(frist && frist.quelle === vorschlag.art && frist.monate === vorschlag.monate);
  // Gleiche Bedingung wie bisher: Formular offen, wenn eine GBU-Frist fehlt oder eine Prüfer-Empfehlung vorliegt.
  const gbuOffen = (vorschlag.art === 'gbu' && !frist) || nachErgebnis !== null;
  // §10 E-1: Vorschlag vorhanden, aber keine Frist freigegeben (Status bleibt 'gbu').
  const nichtFreigegeben = !frist && vorschlag.art !== 'gbu';

  const obergrenzen: string[] = [];
  if (pruefart.herstellerfristMonate !== null) obergrenzen.push(`Herstellerfrist ${monate(pruefart.herstellerfristMonate)}`);
  if (vorschlag.art === 'katalog' && vorschlag.stufe === 'A') obergrenzen.push(`Höchstfrist ${monate(vorschlag.monate)} (Stufe A)`);
  const hinweisObergrenze = obergrenzen.length
    ? `Nicht länger als: ${obergrenzen.join(', ')}.`
    : vorschlag.art === 'katalog' && vorschlag.stufe === 'B'
      ? `Richtwert ${monate(vorschlag.monate)} (Stufe B): Abweichung nur mit Begründung aus der GBU.`
      : null;

  const vorschlagKurz =
    vorschlag.art === 'gbu'
      ? 'Vorschlag: Frist über GBU festlegen'
      : vorschlag.art === 'katalog'
        ? `Vorschlag: ${monate(vorschlag.monate)} laut Prüfkatalog, Stufe ${vorschlag.stufe}`
        : `Vorschlag: ${monate(vorschlag.monate)} laut Herstellerangabe, Stufe C`;

  const titelId = `pruefart-${pruefart.id}`;
  const empfehlung = letzterNachweis?.fristEmpfehlungMonate;

  return (
    <article aria-labelledby={titelId} className="karte overflow-hidden">
      {/* 1. Kopf */}
      <header className="flex flex-wrap items-center gap-3 border-b border-steel-200 px-4 py-3">
        <Pruefplakette status={status.status} faelligAm={status.faelligAm} groesse={40} ohneFreigabe={nichtFreigegeben} />
        <div className="min-w-[12rem] flex-1">
          <h3 id={titelId} className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal">
            {pruefart.bezeichnung}
          </h3>
          <p className="text-xs text-steel [overflow-wrap:anywhere]">
            {pruefart.katalogSchluessel ? `Katalog: ${pruefart.katalogSchluessel}` : 'Freie Prüfart ohne Katalogeintrag'}
          </p>
        </div>
        {status.status !== 'ok' && (
          <StatusAmpel
            status={status.status}
            grund={status.grund}
            text={nichtFreigegeben && status.status === 'gbu' ? 'Frist nicht freigegeben' : undefined}
          />
        )}
        {ansicht.offeneMaengel > 0 && (
          <span className="inline-flex items-center gap-1 rounded-feld border border-brick bg-brick-50 px-1.5 py-0.5 text-xs text-ink">
            <span aria-hidden="true">⚠</span>
            {ansicht.offeneMaengel === 1 ? '1 offener Mangel' : `${ansicht.offeneMaengel} offene Mängel`}
          </span>
        )}
      </header>

      {/* 2. Warnstreifen, nach Schwere sortiert */}
      {ansicht.weiterbetriebUnzulaessig && (
        <Warnstreifen art="fehler" symbol="✕" rolle="alert" titel="Weiterbetrieb nicht zulässig – letzte Prüfung nicht bestanden." />
      )}
      {ansicht.offeneAnlaesse.length > 0 && (
        <Warnstreifen art="fehler" symbol="!" rolle="alert" titel="Anlassprüfung offen – vor Nutzung prüfen">
          <ul className="text-sm">
            {ansicht.offeneAnlaesse.map((a) => (
              <li key={a.id}>
                {ANLASS_ART_LABEL[a.art]} am <span className="font-mono">{datum(a.datum)}</span>: {a.beschreibung}
              </li>
            ))}
          </ul>
        </Warnstreifen>
      )}
      {ansicht.maengelErfassenFuerNachweisId && (
        <Warnstreifen
          art="fehler"
          symbol="!"
          rolle="note"
          titel={`Mängel aus Nachweis vom ${datum(letzterNachweis?.pruefdatum)} noch nicht erfasst.`}
        >
          {darfMangelErfassen && (
            <p>
              <Link
                href={`/maengel/neu?geraet=${pruefart.geraetId}&pruefart=${pruefart.id}&nachweis=${ansicht.maengelErfassenFuerNachweisId}&zurueck=${encodeURIComponent(`/geraete/${pruefart.geraetId}`)}`}
                className="link"
              >
                Mängel jetzt erfassen
              </Link>
            </p>
          )}
        </Warnstreifen>
      )}
      {ansicht.fristHinweis && (
        <Warnstreifen
          art="warnung"
          symbol="!"
          rolle="note"
          titel={
            ansicht.fristHinweis === 'empfehlung_abweichend'
              ? `Prüfer empfiehlt ${empfehlung !== null && empfehlung !== undefined ? monate(empfehlung) : 'eine andere Frist'}${frist ? ` (aktuell ${monate(frist.monate)})` : ''} – Nachweis vom ${datum(letzterNachweis?.pruefdatum)}.`
              : 'Kürzere Frist für neuen Einsatzort vorgeschlagen – Frist prüfen.'
          }
        >
          {darfFreigeben && ansicht.fristHinweis === 'empfehlung_abweichend' && (
            <p>
              <a href={`#gbu-form-${pruefart.id}`} className="link">
                Frist nach Prüfung festlegen
              </a>{' '}
              – das Formular ist mit der Empfehlung vorbelegt. Die Empfehlung wirkt erst nach Freigabe.
            </p>
          )}
        </Warnstreifen>
      )}

      {/* 3. Fristzeile: immer sichtbar, Stufe und Quelle nie im Aufklapper (Leitsatz 3). */}
      {frist ? (
        <dl aria-label="Frist" className="grid grid-cols-1 gap-px border-b border-steel-200 bg-steel-200 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1.3fr)_minmax(0,1.3fr)]">
          <FristFeld titel="Fällig am">
            <span className="font-mono tabular-nums">{datum(status.faelligAm)}</span>
            {rest && <span className="block text-steel">{rest}</span>}
          </FristFeld>
          <FristFeld titel="Frist">
            <span className="font-semibold">{monate(frist.monate)}</span>
          </FristFeld>
          <FristFeld titel="Stufe">
            <StufeMitText stufe={frist.stufe} />
          </FristFeld>
          <FristFeld titel="Quelle">
            {FRIST_QUELLE_LABEL[frist.quelle]}
            <span className="block text-steel">
              <Fundstelle text={frist.fundstelle} url={frist.quelleUrl} />
              {frist.katalogVersion !== null && <> · Katalogversion {frist.katalogVersion}</>}
            </span>
          </FristFeld>
        </dl>
      ) : vorschlag.art === 'gbu' ? (
        <div className="border-b border-steel-200 bg-steel-50 px-4 py-3 text-sm">
          <p className="font-semibold">Frist über GBU festlegen</p>
          <p className="text-steel">{GBU_GRUND[vorschlag.grund]} Ohne freigegebene Frist gibt es keinen Fälligkeitstermin.</p>
        </div>
      ) : (
        <div className="border-b border-steel-200 bg-steel-50 px-4 py-3 text-sm">
          <p className="font-semibold">Frist nicht freigegeben – ohne Freigabe gibt es keinen Fälligkeitstermin.</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-steel">
            <span>
              Vorschlag: <span className="font-medium text-ink">{monate(vorschlag.monate)}</span>{' '}
              {vorschlag.art === 'katalog' ? 'laut Prüfkatalog' : 'laut Herstellerangabe'},
            </span>
            <StufeMitText stufe={vorschlag.art === 'katalog' ? vorschlag.stufe : 'C'} />
            <span>
              · Quelle:{' '}
              {vorschlag.art === 'katalog' ? <Fundstelle text={vorschlag.fundstelle} url={vorschlag.quelleUrl} /> : vorschlag.fundstelle}
            </span>
          </p>
        </div>
      )}

      {/* 4. Weitere Angaben */}
      <dl className="grid gap-x-8 px-4 py-2 lg:grid-cols-2">
        <div>
          <Zeile titel="Letzte Prüfung">
            <span className="font-mono">{datum(pruefart.letztePruefung)}</span>
            <span className="block text-steel">{DATUMSHERKUNFT_LABEL[pruefart.letztePruefungHerkunft]}</span>
          </Zeile>
          <Zeile titel="Herstellerfrist">
            {pruefart.herstellerfristMonate !== null ? (
              <>
                {monate(pruefart.herstellerfristMonate)}
                {pruefart.herstellerfristQuelle && <span className="block text-steel">{pruefart.herstellerfristQuelle}</span>}
              </>
            ) : (
              <span className="text-steel">keine Angabe</span>
            )}
          </Zeile>
          <Zeile titel="GBU-Verweis">
            {pruefart.gbuDokument ? (
              pruefart.gbuDokument.url ? (
                <a href={pruefart.gbuDokument.url} target="_blank" rel="noopener noreferrer" className="link">
                  {pruefart.gbuDokument.titel}
                  <span className="sr-only"> (öffnet in neuem Fenster)</span>
                </a>
              ) : (
                pruefart.gbuDokument.titel
              )
            ) : (
              <span className="text-steel">kein Verweis</span>
            )}
          </Zeile>
        </div>
        <div>
          <Zeile titel="Prüfer">
            {pruefart.zugewiesenerPrueferId === null ? (
              <span className="text-steel">nicht zugewiesen</span>
            ) : ansicht.zugewiesenerPrueferAktiv ? (
              ansicht.zugewiesenerPrueferName
            ) : (
              <>
                <span className="text-steel line-through decoration-steel-400">{ansicht.zugewiesenerPrueferName ?? 'Unbekannter Prüfer'}</span>
                <PrueferDeaktiviertHinweis name={null} className="mt-1" />
              </>
            )}
            {katalogEintrag && katalogEintrag.prueferTypen.length > 0 && (
              <span className="block text-xs text-steel">
                Qualifikation: {katalogEintrag.prueferTypen.map((t) => PRUEFER_TYP_LABEL[t]).join(' oder ')}
                {katalogEintrag.freigabestatus !== 'freigegeben' && ' (laut Katalogentwurf)'}
              </span>
            )}
            {ansicht.qualifikationsWarnung && (
              <span className="mt-1 flex gap-1.5 rounded-feld border border-ochre-600 bg-ochre-50 px-2 py-1 text-xs">
                <span aria-hidden="true" className="font-bold text-ochre-dunkel">
                  !
                </span>
                <span>Qualifikation prüfen – {ansicht.qualifikationsWarnung}</span>
              </span>
            )}
          </Zeile>
          {frist ? (
            <>
              {frist.begruendung && <Zeile titel="Begründung">{frist.begruendung}</Zeile>}
              <Zeile titel="Freigabe">
                {frist.freigegebenVonName}
                <span className="block text-steel">am {zeitpunkt(frist.freigegebenAm)}</span>
              </Zeile>
            </>
          ) : (
            <Zeile titel="Freigabe">
              <span className="text-steel">nicht freigegeben</span>
            </Zeile>
          )}
        </div>
      </dl>

      {/* 5. Disclosures: Regel-Engine-Vorschlag mit Formularen, Prüfer-Zuweisung */}
      <Aufklapper
        titel={darfFreigeben ? 'Frist festlegen' : 'Vorschlag der Regel-Engine'}
        zusammenfassung={vorschlagKurz}
        offen={darfFreigeben && (gbuOffen || !frist)}
      >
        <section aria-label="Vorschlag der Regel-Engine" className="rounded-flaeche bg-steel-50 px-3 py-3">
          <h4 className="mb-1 text-sm font-semibold">
            {frist ? 'Aktueller Vorschlag der Regel-Engine' : 'Vorschlag der Regel-Engine'}
          </h4>
          <VorschlagBlock v={vorschlag} />
          {katalogEintrag?.hinweis && (
            <p className="mt-2 text-xs text-steel">
              Hinweis {katalogEintrag.freigabestatus === 'freigegeben' ? 'Prüfkatalog' : 'Katalogentwurf'}: {katalogEintrag.hinweis}
            </p>
          )}
        </section>
        {darfFreigeben && (
          <FristFreigabeForm
            geraetPruefartId={pruefart.id}
            vorschlagText={vorschlagFreigebbar ? vText : null}
            gbuTitel={vorschlag.art === 'gbu' && !frist ? 'Frist über GBU festlegen' : 'Abweichende Frist festlegen'}
            gbuOffen={gbuOffen}
            hinweisObergrenze={hinweisObergrenze}
            nachErgebnis={nachErgebnis}
            aktuelleMonate={frist?.monate ?? null}
          />
        )}
        {darfFreigeben && <GbuVerweisForm geraetPruefartId={pruefart.id} aktuell={pruefart.gbuDokument} />}
      </Aufklapper>

      {darfZuweisen && (
        <Aufklapper
          titel="Prüfer zuweisen"
          zusammenfassung={
            pruefart.zugewiesenerPrueferId === null
              ? 'Aktuell: nicht zugewiesen'
              : `Aktuell: ${ansicht.zugewiesenerPrueferName ?? 'Unbekannter Prüfer'}${ansicht.zugewiesenerPrueferAktiv ? '' : ' (deaktiviert)'}`
          }
        >
          <PrueferZuweisungForm
            geraetPruefartId={pruefart.id}
            optionen={prueferOptionen}
            aktuellId={pruefart.zugewiesenerPrueferId}
            aktuellName={ansicht.zugewiesenerPrueferName}
            aktuellDeaktiviert={pruefart.zugewiesenerPrueferId !== null && !ansicht.zugewiesenerPrueferAktiv}
            gefordert={katalogEintrag ? katalogEintrag.prueferTypen : null}
          />
        </Aufklapper>
      )}

      {/* 6. Fuß: Aktionen, „Nachweis erfassen“ ist die Hauptaktion. */}
      {(darfNachweisErfassen || darfMangelErfassen) && (
        <footer className="flex flex-wrap gap-2 border-t border-steel-200 px-4 py-3">
          {darfNachweisErfassen && (
            <Link href={`/nachweise/neu/${pruefart.id}`} className="btn btn-primaer">
              Nachweis erfassen<span className="sr-only">: {pruefart.bezeichnung}</span>
            </Link>
          )}
          {darfMangelErfassen && (
            <Link
              href={`/maengel/neu?geraet=${pruefart.geraetId}&pruefart=${pruefart.id}&zurueck=${encodeURIComponent(`/geraete/${pruefart.geraetId}`)}`}
              className="btn btn-sekundaer"
            >
              Mangel erfassen<span className="sr-only">: {pruefart.bezeichnung}</span>
            </Link>
          )}
        </footer>
      )}
    </article>
  );
}
