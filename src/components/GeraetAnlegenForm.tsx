'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import {
  DATUMSHERKUNFT_LABEL,
  EINSATZORT_LABEL,
  EINSATZORTE,
  GERAETE_KATEGORIEN,
  KATEGORIE_LABEL,
  type ActionState,
  type Bereich,
  type GeraetegruppeOption,
  type IsoDate,
} from '@/domain/types';
import { geraetAnlegen } from '@/server/actions';
import { StufeBadge } from './StufeBadge';
import { Meldung } from './Meldung';
import {
  AbsendenButton,
  ActionMeldung,
  Aktionsleiste,
  FeldGruppe,
  Fehleruebersicht,
  fehlerId,
  useGeprueftesFormular,
} from './formular';
import { monate } from './format';

const SONSTIGES = 'sonstiges';
const MAX_PRUEFARTEN = 10;

type Herkunft = '' | 'pruefbericht' | 'plakette';

interface Zeile {
  key: string;
  katalogSchluessel: string | null;
  bezeichnung: string;
  aktiv: boolean;
  katalog: GeraetegruppeOption['pruefarten'][number] | null;
  herstellerfristMonate: string;
  herstellerfristQuelle: string;
  letztePruefung: string;
  herkunft: Herkunft;
}

let zaehler = 0;
const neuerKey = () => `z${++zaehler}`;

function leereZeile(): Zeile {
  return {
    key: neuerKey(),
    katalogSchluessel: null,
    bezeichnung: '',
    aktiv: true,
    katalog: null,
    herstellerfristMonate: '',
    herstellerfristQuelle: '',
    letztePruefung: '',
    herkunft: '',
  };
}

function zeilenFuerGruppe(gruppe: GeraetegruppeOption | undefined): Zeile[] {
  if (!gruppe) return [leereZeile()];
  return gruppe.pruefarten.map((p) => ({
    ...leereZeile(),
    katalogSchluessel: p.schluessel,
    bezeichnung: p.bezeichnung,
    katalog: p,
  }));
}

function alsJson(zeilen: Zeile[]): string {
  return JSON.stringify(
    zeilen
      .filter((z) => z.aktiv)
      .map((z) => {
        const datum = z.letztePruefung.trim() === '' ? null : z.letztePruefung;
        const hf = z.herstellerfristMonate.trim();
        return {
          katalogSchluessel: z.katalogSchluessel,
          bezeichnung: z.bezeichnung.trim(),
          herstellerfristMonate: hf === '' ? null : Number(hf),
          herstellerfristQuelle: z.herstellerfristQuelle.trim() === '' ? null : z.herstellerfristQuelle.trim(),
          letztePruefung: datum,
          letztePruefungHerkunft: datum === null ? 'unbekannt' : z.herkunft,
        };
      }),
  );
}

function PruefartenFehler({ state }: { state: ActionState }) {
  const eintraege = Object.entries(state.feldfehler ?? {}).filter(([k, v]) => k.startsWith('pruefartenJson') && v?.length);
  if (eintraege.length === 0) return null;
  return (
    <ul id={fehlerId('pruefartenJson')} className="space-y-1 text-sm font-medium text-brick">
      {eintraege.map(([k, v]) => {
        const nr = /pruefartenJson\.(\d+)/.exec(k)?.[1];
        return (
          <li key={k} className="flex items-start gap-1.5">
            <span aria-hidden="true">✕</span>
            <span>
              {nr !== undefined && `Prüfart ${Number(nr) + 1}: `}
              {v!.join(' ')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const LEGENDE = 'mb-4 font-sans text-[1.0625rem] font-semibold leading-6 text-ink';

interface Props {
  bereiche: Bereich[];
  gruppen: GeraetegruppeOption[];
  heute: IsoDate;
}

/** Gerät anlegen (§8.6): Gruppen „Gerät“, „Kennung“, „Prüfarten“, einspaltig, 40 rem. */
export function GeraetAnlegenForm({ bereiche, gruppen, heute }: Props) {
  const { state, formAction, pending, onSubmit, noValidate } = useGeprueftesFormular(geraetAnlegen);
  const uid = useId();
  const [bereichId, setBereichId] = useState(bereiche.length === 1 ? bereiche[0]!.id : '');
  const [gruppe, setGruppe] = useState('');
  const [zeilen, setZeilen] = useState<Zeile[]>([]);

  const bereich = bereiche.find((b) => b.id === bereichId);
  const aktive = zeilen.filter((z) => z.aktiv).length;
  const json = useMemo(() => alsJson(zeilen), [zeilen]);

  const gruppeWaehlen = (wert: string) => {
    setGruppe(wert);
    setZeilen(wert === '' ? [] : wert === SONSTIGES ? [leereZeile()] : zeilenFuerGruppe(gruppen.find((g) => g.schluessel === wert)));
  };
  const aendern = (key: string, teil: Partial<Zeile>) =>
    setZeilen((alt) => alt.map((z) => (z.key === key ? { ...z, ...teil } : z)));
  const entfernen = (key: string) => setZeilen((alt) => alt.filter((z) => z.key !== key));

  const f = (name: string) => `${uid}-${name}`;
  const zf = (z: Zeile, name: string) => `${uid}-${z.key}-${name}`;

  // Feld → id und Label für die Fehlerübersicht. Zeilenfelder haben keinen name, ihr Schlüssel ist die id.
  const felder: Record<string, { id?: string; label: string }> = {
    bezeichnung: { id: f('bezeichnung'), label: 'Bezeichnung' },
    kategorie: { id: f('kategorie'), label: 'Kategorie' },
    bereichId: { id: f('bereichId'), label: 'Bereich' },
    einsatzort: { id: f('einsatzort'), label: 'Einsatzort' },
    inventarnummer: { id: f('inventarnummer'), label: 'Inventarnummer' },
    seriennummer: { id: f('seriennummer'), label: 'Seriennummer' },
    hersteller: { id: f('hersteller'), label: 'Hersteller' },
    typ: { id: f('typ'), label: 'Typ' },
    baujahr: { id: f('baujahr'), label: 'Baujahr' },
    geraetegruppe: { id: f('geraetegruppe'), label: 'Gerätegruppe' },
    pruefartenJson: { id: f('geraetegruppe'), label: 'Prüfarten' },
  };
  zeilen.forEach((z, i) => {
    const name = z.bezeichnung.trim() || `Prüfart ${i + 1}`;
    for (const [teil, label] of [
      ['bezeichnung', `Prüfart ${i + 1}`],
      ['hf', `${name}, Herstellerfrist`],
      ['hfq', `${name}, Quelle der Herstellerfrist`],
      ['datum', `${name}, letzte Prüfung`],
      ['herkunft', `${name}, Herkunft des Datums`],
    ] as const) {
      felder[zf(z, teil)] = { id: zf(z, teil), label };
    }
  });

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate={noValidate} className="max-w-[40rem] space-y-8">
      <Fehleruebersicht state={state} felder={felder} />

      <fieldset>
        <legend className={LEGENDE}>Gerät</legend>
        <div className="space-y-4">
          <FeldGruppe id={f('bezeichnung')} feld="bezeichnung" label="Bezeichnung" state={state} hilfe="So, wie es im Betrieb genannt wird, z. B. „Bohrhammer Hilti TE 30“.">
            {(p) => <input {...p} name="bezeichnung" required minLength={2} maxLength={120} className="feld" />}
          </FeldGruppe>
          <FeldGruppe id={f('kategorie')} feld="kategorie" label="Kategorie" state={state}>
            {(p) => (
              <select {...p} name="kategorie" required defaultValue="" className="feld">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {GERAETE_KATEGORIEN.map((k) => (
                  <option key={k} value={k}>
                    {KATEGORIE_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
          </FeldGruppe>
          <FeldGruppe id={f('bereichId')} feld="bereichId" label="Bereich" state={state}>
            {(p) => (
              <select {...p} name="bereichId" required value={bereichId} onChange={(e) => setBereichId(e.target.value)} className="feld">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {bereiche.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </FeldGruppe>
          <FeldGruppe
            id={f('einsatzort')}
            feld="einsatzort"
            label="Einsatzort"
            optional
            state={state}
            hilfe="Ein abweichender Einsatzort kann kürzere Fristen bedeuten, z. B. Baustelle."
          >
            {(p) => (
              <select {...p} name="einsatzort" defaultValue="" className="feld">
                <option value="">Wie Bereich{bereich ? ` (${EINSATZORT_LABEL[bereich.einsatzort]})` : ''}</option>
                {EINSATZORTE.map((o) => (
                  <option key={o} value={o}>
                    {EINSATZORT_LABEL[o]}
                  </option>
                ))}
              </select>
            )}
          </FeldGruppe>
        </div>
      </fieldset>

      <fieldset>
        <legend className={LEGENDE}>Kennung</legend>
        <div className="space-y-4">
          <FeldGruppe id={f('inventarnummer')} feld="inventarnummer" label="Inventarnummer" optional state={state}>
            {(p) => <input {...p} name="inventarnummer" maxLength={60} className="feld max-w-xs font-mono" />}
          </FeldGruppe>
          <FeldGruppe id={f('seriennummer')} feld="seriennummer" label="Seriennummer" optional state={state}>
            {(p) => <input {...p} name="seriennummer" maxLength={120} className="feld max-w-xs font-mono" />}
          </FeldGruppe>
          <FeldGruppe id={f('hersteller')} feld="hersteller" label="Hersteller" optional state={state}>
            {(p) => <input {...p} name="hersteller" maxLength={120} className="feld" />}
          </FeldGruppe>
          <FeldGruppe id={f('typ')} feld="typ" label="Typ" optional state={state}>
            {(p) => <input {...p} name="typ" maxLength={120} className="feld" />}
          </FeldGruppe>
          <FeldGruppe id={f('baujahr')} feld="baujahr" label="Baujahr" optional state={state}>
            {(p) => <input {...p} name="baujahr" type="number" inputMode="numeric" min={1950} max={2100} className="feld w-32 font-mono" />}
          </FeldGruppe>
        </div>
      </fieldset>

      <fieldset>
        <legend className={LEGENDE}>Prüfarten</legend>
        <div className="space-y-4">
          <FeldGruppe
            id={f('geraetegruppe')}
            feld="geraetegruppe"
            label="Gerätegruppe"
            state={state}
            hilfe="Readyloop schlägt danach die Prüfarten aus dem Prüfkatalog vor."
          >
            {(p) => (
              <select {...p} name="geraetegruppe" required value={gruppe} onChange={(e) => gruppeWaehlen(e.target.value)} className="feld">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {gruppen.map((g) => (
                  <option key={g.schluessel} value={g.schluessel}>
                    {g.label}
                  </option>
                ))}
                <option value={SONSTIGES}>Sonstiges (ohne Katalogeintrag)</option>
              </select>
            )}
          </FeldGruppe>

          <input type="hidden" name="pruefartenJson" value={json} />

          {gruppe !== '' && (
            <ul className="space-y-3" aria-label="Prüfarten des Geräts">
              {zeilen.map((z, i) => {
                const mitDatum = z.letztePruefung.trim() !== '';
                return (
                  <li
                    key={z.key}
                    className={`rounded-flaeche border p-3 sm:p-4 ${z.aktiv ? 'border-steel-200 bg-white' : 'border-dashed border-steel-400 bg-paper'}`}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      {z.katalog ? (
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={z.aktiv}
                            onChange={(e) => aendern(z.key, { aktiv: e.target.checked })}
                            className="mt-0.5 size-5 shrink-0 accent-steel"
                          />
                          <span className="min-w-0">
                            <span className="font-medium text-ink">{z.bezeichnung}</span>
                            {!z.aktiv && <span className="text-sm text-steel"> (nicht übernehmen)</span>}
                            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-steel">
                              <StufeBadge stufe={z.katalog.stufe} />
                              <span>
                                {z.katalog.intervallMonate !== null
                                  ? `Prüfkatalog: ${monate(z.katalog.intervallMonate)}`
                                  : 'Prüfkatalog: ohne Intervall, Frist über GBU festlegen'}
                              </span>
                              {z.katalog.freigabestatus !== 'freigegeben' && (
                                <span className="rounded-feld border border-dashed border-steel-400 px-1.5 font-medium text-ink">
                                  Entwurf, nicht fachlich freigegeben
                                </span>
                              )}
                            </span>
                          </span>
                        </label>
                      ) : (
                        <FeldGruppe
                          id={zf(z, 'bezeichnung')}
                          label={`Bezeichnung der Prüfart ${i + 1}`}
                          state={state}
                          hilfe="Ohne Katalogeintrag: Die Frist legen Sie später über die GBU fest."
                          className="min-w-0 flex-1"
                        >
                          {(p) => (
                            <input
                              {...p}
                              value={z.bezeichnung}
                              onChange={(e) => aendern(z.key, { bezeichnung: e.target.value })}
                              required
                              minLength={2}
                              maxLength={120}
                              placeholder="z. B. Wiederholungsprüfung Schweißgerät"
                              className="feld"
                            />
                          )}
                        </FeldGruppe>
                      )}
                      {!z.katalog && (
                        <button type="button" onClick={() => entfernen(z.key)} className="btn btn-still sm:mt-6">
                          Prüfart entfernen<span className="sr-only"> ({i + 1})</span>
                        </button>
                      )}
                    </div>

                    {z.aktiv && (
                      <div className="mt-4 grid gap-4 border-t border-steel-100 pt-4 sm:grid-cols-2">
                        <FeldGruppe id={zf(z, 'hf')} label="Herstellerfrist" optional einheit="Monate" state={state}>
                          {(p) => (
                            <input
                              {...p}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={120}
                              value={z.herstellerfristMonate}
                              onChange={(e) => aendern(z.key, { herstellerfristMonate: e.target.value })}
                              className="feld pr-20 font-mono"
                            />
                          )}
                        </FeldGruppe>
                        <FeldGruppe
                          id={zf(z, 'hfq')}
                          label="Quelle der Herstellerfrist"
                          optional={z.herstellerfristMonate.trim() === ''}
                          state={state}
                        >
                          {(p) => (
                            <input
                              {...p}
                              maxLength={200}
                              value={z.herstellerfristQuelle}
                              onChange={(e) => aendern(z.key, { herstellerfristQuelle: e.target.value })}
                              required={z.herstellerfristMonate.trim() !== ''}
                              placeholder="z. B. Betriebsanleitung Kap. 9"
                              className="feld"
                            />
                          )}
                        </FeldGruppe>
                        <FeldGruppe id={zf(z, 'datum')} label="Letzte Prüfung" optional state={state}>
                          {(p) => (
                            <input
                              {...p}
                              type="date"
                              max={heute}
                              value={z.letztePruefung}
                              onChange={(e) => aendern(z.key, { letztePruefung: e.target.value })}
                              className="feld font-mono"
                            />
                          )}
                        </FeldGruppe>
                        {mitDatum ? (
                          <FeldGruppe id={zf(z, 'herkunft')} label="Herkunft des Datums" state={state}>
                            {(p) => (
                              <select
                                {...p}
                                value={z.herkunft}
                                required
                                onChange={(e) => aendern(z.key, { herkunft: e.target.value as Herkunft })}
                                className="feld"
                              >
                                <option value="" disabled>
                                  Bitte wählen
                                </option>
                                <option value="pruefbericht">{DATUMSHERKUNFT_LABEL.pruefbericht}</option>
                                <option value="plakette">{DATUMSHERKUNFT_LABEL.plakette}</option>
                              </select>
                            )}
                          </FeldGruppe>
                        ) : (
                          <div>
                            <p className="label">Herkunft des Datums</p>
                            <p className="flex min-h-10 items-center text-sm text-steel">Unbekannt, solange kein Datum eingetragen ist.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {gruppe !== '' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setZeilen((alt) => [...alt, leereZeile()])}
                disabled={zeilen.length >= MAX_PRUEFARTEN}
                className="btn btn-sekundaer"
              >
                Freie Prüfart hinzufügen
              </button>
              <p className="text-sm text-steel" aria-live="polite">
                {aktive === 1 ? '1 Prüfart ausgewählt' : `${aktive} Prüfarten ausgewählt`}
              </p>
            </div>
          )}
          <PruefartenFehler state={state} />
        </div>
      </fieldset>

      <Meldung art="hinweis">Fristen werden nach dem Anlegen aus dem Prüfkatalog vorgeschlagen und müssen freigegeben werden.</Meldung>

      <ActionMeldung state={state} />
      <Aktionsleiste fest>
        <AbsendenButton pending={pending}>
          Gerät anlegen
        </AbsendenButton>
        <Link href="/geraete" className="btn btn-still">
          Abbrechen
        </Link>
      </Aktionsleiste>
    </form>
  );
}
