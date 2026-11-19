import Link from 'next/link';
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
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1 text-sm sm:grid-cols-[11rem_1fr]">
      <dt className="text-steel">{titel}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
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
    <div className="mt-2 rounded border border-dashed border-steel/60 bg-white px-3 py-2 text-sm">
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

  const obergrenzen: string[] = [];
  if (pruefart.herstellerfristMonate !== null) obergrenzen.push(`Herstellerfrist ${monate(pruefart.herstellerfristMonate)}`);
  if (vorschlag.art === 'katalog' && vorschlag.stufe === 'A') obergrenzen.push(`Höchstfrist ${monate(vorschlag.monate)} (Stufe A)`);
  const hinweisObergrenze = obergrenzen.length
    ? `Nicht länger als: ${obergrenzen.join(', ')}.`
    : vorschlag.art === 'katalog' && vorschlag.stufe === 'B'
      ? `Richtwert ${monate(vorschlag.monate)} (Stufe B): Abweichung nur mit Begründung aus der GBU.`
      : null;

  const titelId = `pruefart-${pruefart.id}`;

  return (
    <article aria-labelledby={titelId} className="karte overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-steel/15 px-4 py-3">
        <Pruefplakette status={status.status} faelligAm={status.faelligAm} groesse={40} />
        <div className="min-w-0 flex-1">
          <h3 id={titelId} className="font-semibold">
            {pruefart.bezeichnung}
          </h3>
          <p className="text-xs text-steel">{pruefart.katalogSchluessel ? `Katalog: ${pruefart.katalogSchluessel}` : 'Freie Prüfart ohne Katalogeintrag'}</p>
        </div>
        <StatusAmpel status={status.status} grund={status.grund} />
        {ansicht.offeneMaengel > 0 && (
          <span className="inline-flex items-center gap-1 rounded border border-brick/50 bg-brick/10 px-1.5 py-0.5 text-xs">
            <span aria-hidden="true">⚠</span>
            {ansicht.offeneMaengel === 1 ? '1 offener Mangel' : `${ansicht.offeneMaengel} offene Mängel`}
          </span>
        )}
      </header>

      {ansicht.offeneAnlaesse.length > 0 && (
        <div role="alert" className="border-b border-brick/40 bg-brick/10 px-4 py-2 text-sm">
          <p className="font-semibold">
            <span aria-hidden="true">! </span>Anlassprüfung offen – vor Nutzung prüfen
          </p>
          <ul className="text-xs">
            {ansicht.offeneAnlaesse.map((a) => (
              <li key={a.id}>
                {ANLASS_ART_LABEL[a.art]} am {datum(a.datum)}: {a.beschreibung}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ansicht.maengelErfassenFuerNachweisId && (
        <div role="note" className="border-b border-brick/40 bg-brick/5 px-4 py-2 text-sm">
          <p className="font-medium">
            <span aria-hidden="true" className="mr-1 font-bold text-brick">
              !
            </span>
            Mängel aus Nachweis vom {datum(letzterNachweis?.pruefdatum)} noch nicht erfasst.
          </p>
          {darfMangelErfassen && (
            <p className="text-xs">
              <Link
                href={`/maengel/neu?geraet=${pruefart.geraetId}&pruefart=${pruefart.id}&nachweis=${ansicht.maengelErfassenFuerNachweisId}&zurueck=${encodeURIComponent(`/geraete/${pruefart.geraetId}`)}`}
                className="link"
              >
                Mängel jetzt erfassen
              </Link>
            </p>
          )}
        </div>
      )}

      {ansicht.fristHinweis && (
        <div role="note" className="border-b border-ochre/60 bg-ochre/15 px-4 py-2 text-sm">
          <p className="font-medium">
            <span aria-hidden="true" className="mr-1 font-bold text-ochre-dunkel">
              !
            </span>
            {ansicht.fristHinweis === 'empfehlung_abweichend'
              ? `Prüfer empfiehlt ${letzterNachweis?.fristEmpfehlungMonate !== null && letzterNachweis?.fristEmpfehlungMonate !== undefined ? monate(letzterNachweis.fristEmpfehlungMonate) : 'eine andere Frist'}${frist ? ` (aktuell ${monate(frist.monate)})` : ''} – Nachweis vom ${datum(letzterNachweis?.pruefdatum)}.`
              : 'Kürzere Frist für neuen Einsatzort vorgeschlagen – Frist prüfen.'}
          </p>
          {darfFreigeben && ansicht.fristHinweis === 'empfehlung_abweichend' && (
            <p className="text-xs">
              <a href={`#gbu-form-${pruefart.id}`} className="link">
                Frist nach Prüfung festlegen
              </a>{' '}
              – Formular unten ist mit der Empfehlung vorbelegt. Die Empfehlung wirkt erst nach Freigabe.
            </p>
          )}
        </div>
      )}

      {ansicht.weiterbetriebUnzulaessig && (
        <p role="alert" className="border-b border-brick/40 bg-brick/10 px-4 py-2 text-sm font-semibold text-brick">
          <span aria-hidden="true">✕ </span>Weiterbetrieb nicht zulässig – letzte Prüfung nicht bestanden.
        </p>
      )}

      <div className="grid gap-x-8 px-4 py-3 lg:grid-cols-2">
        <dl>
          <Zeile titel="Fällig am">
            <span className="font-mono">{datum(status.faelligAm)}</span>
            {rest && <span className="ml-2 text-steel">({rest})</span>}
          </Zeile>
          <Zeile titel="Letzte Prüfung">
            <span className="font-mono">{datum(pruefart.letztePruefung)}</span>
            <span className="ml-2 text-steel">({DATUMSHERKUNFT_LABEL[pruefart.letztePruefungHerkunft]})</span>
          </Zeile>
          <Zeile titel="Herstellerfrist">
            {pruefart.herstellerfristMonate !== null ? (
              <>
                {monate(pruefart.herstellerfristMonate)}
                {pruefart.herstellerfristQuelle && <span className="text-steel"> · {pruefart.herstellerfristQuelle}</span>}
              </>
            ) : (
              <span className="text-steel">keine Angabe</span>
            )}
          </Zeile>
          <Zeile titel="Prüfer">
            {pruefart.zugewiesenerPrueferId === null ? (
              <span className="text-steel">nicht zugewiesen</span>
            ) : ansicht.zugewiesenerPrueferAktiv ? (
              ansicht.zugewiesenerPrueferName
            ) : (
              <>
                <span className="text-steel line-through decoration-steel/60">{ansicht.zugewiesenerPrueferName ?? 'Unbekannter Prüfer'}</span>
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
              <span className="mt-1 block rounded border border-ochre/60 bg-ochre/15 px-2 py-1 text-xs">
                <span aria-hidden="true" className="mr-1 font-bold text-ochre-dunkel">
                  !
                </span>
                Qualifikation prüfen – {ansicht.qualifikationsWarnung}
              </span>
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
        </dl>

        <dl>
          {frist ? (
            <>
              <Zeile titel="Frist">
                <span className="font-mono font-semibold">{monate(frist.monate)}</span>
              </Zeile>
              <Zeile titel="Quelle">{FRIST_QUELLE_LABEL[frist.quelle]}</Zeile>
              <Zeile titel="Stufe">
                <StufeMitText stufe={frist.stufe} />
              </Zeile>
              <Zeile titel="Fundstelle">
                <Fundstelle text={frist.fundstelle} url={frist.quelleUrl} />
                {frist.katalogVersion !== null && <span className="text-steel"> · Katalogversion {frist.katalogVersion}</span>}
              </Zeile>
              {frist.begruendung && <Zeile titel="Begründung">{frist.begruendung}</Zeile>}
              <Zeile titel="Freigabe">
                freigegeben von {frist.freigegebenVonName} am {zeitpunkt(frist.freigegebenAm)}
              </Zeile>
            </>
          ) : (
            <>
              <Zeile titel="Frist">
                <span className="font-semibold">nicht freigegeben</span>
              </Zeile>
              <Zeile titel="Freigabe">
                <span className="text-steel">Ohne freigegebene Frist gibt es keinen Fälligkeitstermin.</span>
              </Zeile>
            </>
          )}
        </dl>
      </div>

      <section aria-label="Vorschlag" className="border-t border-steel/15 bg-paper/50 px-4 py-3">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-steel">
          {frist ? 'Aktueller Vorschlag der Regel-Engine' : 'Vorschlag'}
        </h4>
        <VorschlagBlock v={vorschlag} />
        {katalogEintrag?.hinweis && (
          <p className="mt-2 text-xs text-steel">
            Hinweis {katalogEintrag.freigabestatus === 'freigegeben' ? 'Prüfkatalog' : 'Katalogentwurf'}: {katalogEintrag.hinweis}
          </p>
        )}
        {darfFreigeben && (
          <div className="mt-3">
            <FristFreigabeForm
              geraetPruefartId={pruefart.id}
              vorschlagText={vorschlagFreigebbar ? vText : null}
              gbuTitel={vorschlag.art === 'gbu' && !frist ? 'Frist über GBU festlegen' : 'Abweichende Frist festlegen'}
              gbuOffen={(vorschlag.art === 'gbu' && !frist) || nachErgebnis !== null}
              hinweisObergrenze={hinweisObergrenze}
              nachErgebnis={nachErgebnis}
              aktuelleMonate={frist?.monate ?? null}
            />
          </div>
        )}
        {darfFreigeben && (
          <div className="mt-3">
            <GbuVerweisForm geraetPruefartId={pruefart.id} aktuell={pruefart.gbuDokument} />
          </div>
        )}
      </section>

      {darfZuweisen && (
        <section aria-label="Prüfer-Zuweisung" className="border-t border-steel/15 px-4 py-3">
          <PrueferZuweisungForm
            geraetPruefartId={pruefart.id}
            optionen={prueferOptionen}
            aktuellId={pruefart.zugewiesenerPrueferId}
            aktuellName={ansicht.zugewiesenerPrueferName}
            aktuellDeaktiviert={pruefart.zugewiesenerPrueferId !== null && !ansicht.zugewiesenerPrueferAktiv}
            gefordert={katalogEintrag ? katalogEintrag.prueferTypen : null}
          />
        </section>
      )}

      {(darfNachweisErfassen || darfMangelErfassen) && (
        <footer className="flex flex-wrap gap-2 border-t border-steel/15 px-4 py-3">
          {darfNachweisErfassen && (
            <Link href={`/nachweise/neu/${pruefart.id}`} className="btn btn-sekundaer">
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
