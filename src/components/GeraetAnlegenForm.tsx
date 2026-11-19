'use client';

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
import { ActionMeldung, FeldFehler, feldProps, useFormularAction } from './formular';
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
    <ul id="fehler-pruefartenJson" className="mt-2 list-inside list-disc text-sm text-brick">
      {eintraege.map(([k, v]) => {
        const nr = /pruefartenJson\.(\d+)/.exec(k)?.[1];
        return (
          <li key={k}>
            {nr !== undefined && `Prüfart ${Number(nr) + 1}: `}
            {v!.join(' ')}
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  bereiche: Bereich[];
  gruppen: GeraetegruppeOption[];
  heute: IsoDate;
}

export function GeraetAnlegenForm({ bereiche, gruppen, heute }: Props) {
  const { state, formAction, pending, onSubmit } = useFormularAction(geraetAnlegen);
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

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6">
      <fieldset className="karte grid gap-4 p-4 sm:grid-cols-2">
        <legend className="px-1 font-display font-semibold">Stammdaten</legend>
        <div className="sm:col-span-2">
          <label htmlFor={f('bezeichnung')} className="label">
            Bezeichnung *
          </label>
          <input id={f('bezeichnung')} name="bezeichnung" required minLength={2} maxLength={120} className="feld" {...feldProps(state, 'bezeichnung')} />
          <FeldFehler state={state} feld="bezeichnung" />
        </div>
        <div>
          <label htmlFor={f('inventarnummer')} className="label">
            Inventarnummer
          </label>
          <input id={f('inventarnummer')} name="inventarnummer" maxLength={60} className="feld font-mono" {...feldProps(state, 'inventarnummer')} />
          <FeldFehler state={state} feld="inventarnummer" />
        </div>
        <div>
          <label htmlFor={f('kategorie')} className="label">
            Kategorie *
          </label>
          <select id={f('kategorie')} name="kategorie" required defaultValue="" className="feld" {...feldProps(state, 'kategorie')}>
            <option value="" disabled>
              bitte wählen
            </option>
            {GERAETE_KATEGORIEN.map((k) => (
              <option key={k} value={k}>
                {KATEGORIE_LABEL[k]}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="kategorie" />
        </div>
        <div>
          <label htmlFor={f('bereichId')} className="label">
            Bereich *
          </label>
          <select
            id={f('bereichId')}
            name="bereichId"
            required
            value={bereichId}
            onChange={(e) => setBereichId(e.target.value)}
            className="feld"
            {...feldProps(state, 'bereichId')}
          >
            <option value="" disabled>
              bitte wählen
            </option>
            {bereiche.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <FeldFehler state={state} feld="bereichId" />
        </div>
        <div>
          <label htmlFor={f('einsatzort')} className="label">
            Einsatzort
          </label>
          <select id={f('einsatzort')} name="einsatzort" defaultValue="" className="feld" {...feldProps(state, 'einsatzort')}>
            <option value="">wie Bereich{bereich ? ` (${EINSATZORT_LABEL[bereich.einsatzort]})` : ''}</option>
            {EINSATZORTE.map((o) => (
              <option key={o} value={o}>
                {EINSATZORT_LABEL[o]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-steel">Abweichender Einsatzort kann kürzere Fristen bedeuten (z. B. Baustelle).</p>
          <FeldFehler state={state} feld="einsatzort" />
        </div>
        <div>
          <label htmlFor={f('hersteller')} className="label">
            Hersteller
          </label>
          <input id={f('hersteller')} name="hersteller" maxLength={120} className="feld" {...feldProps(state, 'hersteller')} />
          <FeldFehler state={state} feld="hersteller" />
        </div>
        <div>
          <label htmlFor={f('typ')} className="label">
            Typ
          </label>
          <input id={f('typ')} name="typ" maxLength={120} className="feld" {...feldProps(state, 'typ')} />
          <FeldFehler state={state} feld="typ" />
        </div>
        <div>
          <label htmlFor={f('seriennummer')} className="label">
            Seriennummer
          </label>
          <input id={f('seriennummer')} name="seriennummer" maxLength={120} className="feld font-mono" {...feldProps(state, 'seriennummer')} />
          <FeldFehler state={state} feld="seriennummer" />
        </div>
        <div>
          <label htmlFor={f('baujahr')} className="label">
            Baujahr
          </label>
          <input
            id={f('baujahr')}
            name="baujahr"
            type="number"
            inputMode="numeric"
            min={1950}
            max={2100}
            className="feld font-mono"
            {...feldProps(state, 'baujahr')}
          />
          <FeldFehler state={state} feld="baujahr" />
        </div>
      </fieldset>

      <fieldset className="karte space-y-4 p-4">
        <legend className="px-1 font-display font-semibold">Gerätegruppe und Prüfarten</legend>
        <div className="max-w-md">
          <label htmlFor={f('geraetegruppe')} className="label">
            Gerätegruppe *
          </label>
          <select
            id={f('geraetegruppe')}
            name="geraetegruppe"
            required
            value={gruppe}
            onChange={(e) => gruppeWaehlen(e.target.value)}
            className="feld"
            {...feldProps(state, 'geraetegruppe')}
          >
            <option value="" disabled>
              bitte wählen
            </option>
            {gruppen.map((g) => (
              <option key={g.schluessel} value={g.schluessel}>
                {g.label}
              </option>
            ))}
            <option value={SONSTIGES}>Sonstiges (ohne Katalogeintrag)</option>
          </select>
          <FeldFehler state={state} feld="geraetegruppe" />
        </div>

        <input type="hidden" name="pruefartenJson" value={json} />

        {gruppe === '' ? (
          <p className="text-sm text-steel">Nach Wahl der Gerätegruppe werden die Prüfarten aus dem Katalog vorgeschlagen.</p>
        ) : (
          <ul className="space-y-3">
            {zeilen.map((z, i) => {
              const p = (name: string) => `${uid}-${z.key}-${name}`;
              const mitDatum = z.letztePruefung.trim() !== '';
              return (
                <li key={z.key} className={`rounded border p-3 ${z.aktiv ? 'border-steel/30 bg-white' : 'border-dashed border-steel/30 bg-paper opacity-75'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    {z.katalog ? (
                      <label className="flex min-w-0 flex-1 items-start gap-2">
                        <input
                          type="checkbox"
                          checked={z.aktiv}
                          onChange={(e) => aendern(z.key, { aktiv: e.target.checked })}
                          className="mt-1 size-4 accent-steel"
                        />
                        <span className="min-w-0">
                          <span className="font-medium">{z.bezeichnung}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-steel">
                            <StufeBadge stufe={z.katalog.stufe} />
                            {z.katalog.intervallMonate !== null ? monate(z.katalog.intervallMonate) : 'ohne Intervall'}
                            {z.katalog.freigabestatus !== 'freigegeben' && (
                              <span className="rounded border border-dashed border-steel px-1.5 font-medium text-ink">
                                Entwurf – nicht fachlich freigegeben
                              </span>
                            )}
                          </span>
                        </span>
                      </label>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <label htmlFor={p('bezeichnung')} className="label">
                          Freie Prüfart {i + 1} – Bezeichnung *
                        </label>
                        <input
                          id={p('bezeichnung')}
                          value={z.bezeichnung}
                          onChange={(e) => aendern(z.key, { bezeichnung: e.target.value })}
                          required
                          minLength={2}
                          maxLength={120}
                          placeholder="z. B. Wiederholungsprüfung Schweißgerät"
                          className="feld"
                        />
                        <p className="mt-1 text-xs text-steel">Ohne Katalogeintrag: Frist später über GBU festlegen.</p>
                      </div>
                    )}
                    {!z.katalog && (
                      <button type="button" onClick={() => entfernen(z.key)} className="btn btn-sekundaer">
                        Entfernen<span className="sr-only"> (Prüfart {i + 1})</span>
                      </button>
                    )}
                  </div>

                  {z.aktiv && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label htmlFor={p('hf')} className="label">
                          Herstellerfrist (Monate)
                        </label>
                        <input
                          id={p('hf')}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={120}
                          value={z.herstellerfristMonate}
                          onChange={(e) => aendern(z.key, { herstellerfristMonate: e.target.value })}
                          className="feld font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor={p('hfq')} className="label">
                          Quelle Herstellerfrist
                        </label>
                        <input
                          id={p('hfq')}
                          maxLength={200}
                          value={z.herstellerfristQuelle}
                          onChange={(e) => aendern(z.key, { herstellerfristQuelle: e.target.value })}
                          required={z.herstellerfristMonate.trim() !== ''}
                          placeholder="z. B. Betriebsanleitung Kap. 9"
                          className="feld"
                        />
                      </div>
                      <div>
                        <label htmlFor={p('datum')} className="label">
                          Letzte Prüfung
                        </label>
                        <input
                          id={p('datum')}
                          type="date"
                          max={heute}
                          value={z.letztePruefung}
                          onChange={(e) => aendern(z.key, { letztePruefung: e.target.value })}
                          className="feld font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor={p('herkunft')} className="label">
                          Herkunft des Datums{mitDatum && ' *'}
                        </label>
                        {mitDatum ? (
                          <select
                            id={p('herkunft')}
                            value={z.herkunft}
                            required
                            onChange={(e) => aendern(z.key, { herkunft: e.target.value as Herkunft })}
                            className="feld"
                          >
                            <option value="" disabled>
                              bitte wählen
                            </option>
                            <option value="pruefbericht">{DATUMSHERKUNFT_LABEL.pruefbericht}</option>
                            <option value="plakette">{DATUMSHERKUNFT_LABEL.plakette}</option>
                          </select>
                        ) : (
                          <p id={p('herkunft')} className="py-1.5 text-sm text-steel">
                            unbekannt (kein Datum)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {gruppe !== '' && (
          <div className="flex flex-wrap items-center gap-3">
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
      </fieldset>

      <p className="text-xs text-steel">
        Fristen werden nicht beim Anlegen festgelegt: Vorschläge gibt Sifa oder Verantwortlicher in der Geräteakte frei.
      </p>
      <ActionMeldung state={state} />
      <button type="submit" disabled={pending || aktive === 0} className="btn btn-primaer">
        {pending ? 'Wird gespeichert …' : 'Gerät anlegen'}
      </button>
    </form>
  );
}
