import {
  ANLASS_ART_LABEL,
  ANLASS_ARTEN,
  BETRIEBSSTATUS,
  BETRIEBSSTATUS_LABEL,
  EREIGNIS_LABEL,
  FRIST_QUELLE_LABEL,
  FRIST_QUELLEN,
  MANGEL_SCHWERE_LABEL,
  MANGEL_SCHWEREN,
  PRUEF_ERGEBNIS_LABEL,
  PRUEF_ERGEBNISSE,
  ROLLE_LABEL,
  ROLLEN,
  EINSATZORT_LABEL,
  EINSATZORTE,
  type Ereignis,
  type Id,
} from '@/domain/types';
import { Leerzustand } from './Leerzustand';
import { datum, monate, zeitpunkt } from './format';

function obj(wert: unknown): Record<string, unknown> | null {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert) ? (wert as Record<string, unknown>) : null;
}

function text(wert: unknown): string | null {
  return typeof wert === 'string' && wert !== '' ? wert : null;
}

function zahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
}

function aus<T extends string>(liste: readonly T[], wert: unknown): T | null {
  return liste.find((x) => x === wert) ?? null;
}

const RICHTUNG_TEXT: Record<string, string> = {
  erstmalig: 'erstmalig',
  kuerzer: 'kürzer',
  laenger: 'länger',
  gleich: 'gleich',
};

/** Ereignistext aus Typ und (untypisierten) Daten; unbekannte Felder werden ignoriert. */
function beschreibung(e: Ereignis, pruefartNamen: Map<Id, string>): { titel: string; details: string[] } {
  const d = e.daten;
  const pruefartId = text(d.pruefartId) ?? text(d.geraetPruefartId);
  const pruefart = (pruefartId ? pruefartNamen.get(pruefartId) : undefined) ?? text(d.pruefart);
  const details: string[] = [];
  if (pruefart) details.push(pruefart);
  const titel = EREIGNIS_LABEL[e.typ];

  switch (e.typ) {
    case 'geraet_angelegt':
      return { titel, details };
    case 'frist_freigegeben': {
      const neu = obj(d.neu);
      const alt = obj(d.alt);
      const neuMonate = neu ? zahl(neu.monate) : null;
      const altMonate = alt ? zahl(alt.monate) : null;
      const richtung = text(d.richtung);
      if (neuMonate !== null) {
        const r = richtung && richtung !== 'erstmalig' ? ` (${RICHTUNG_TEXT[richtung] ?? richtung})` : '';
        details.push(altMonate !== null ? `${altMonate} → ${monate(neuMonate)}${r}` : monate(neuMonate));
      }
      if (neu) {
        const q = aus(FRIST_QUELLEN, neu.quelle);
        if (q) details.push(FRIST_QUELLE_LABEL[q]);
        if (text(neu.stufe)) details.push(`Stufe ${neu.stufe as string}`);
        if (text(neu.fundstelle)) details.push(neu.fundstelle as string);
      }
      if (text(d.nachweisId)) details.push('nach Prüfergebnis');
      return { titel: alt ? 'Frist geändert' : titel, details };
    }
    case 'nachweis_erfasst': {
      if (text(d.pruefdatum)) details.push(`Prüfung vom ${datum(d.pruefdatum as string)}`);
      const erg = aus(PRUEF_ERGEBNISSE, d.ergebnis);
      if (erg) details.push(PRUEF_ERGEBNIS_LABEL[erg]);
      const empf = zahl(d.fristEmpfehlungMonate);
      if (empf !== null) details.push(`Empfehlung ${monate(empf)}`);
      return { titel, details };
    }
    case 'pruefer_zugewiesen': {
      const neuName = text(d.neuName);
      return { titel: d.neu ? titel : 'Prüfer-Zuweisung entfernt', details: neuName ? [...details, neuName] : details };
    }
    case 'gbu_dokument_gesetzt': {
      const neu = obj(d.neu);
      if (neu && text(neu.titel)) details.push(neu.titel as string);
      return { titel: neu ? titel : 'GBU-Verweis entfernt', details };
    }
    case 'geraet_verschoben': {
      const von = text(d.vonBereich);
      const nach = text(d.nachBereich);
      if (von || nach) details.push(`${von ?? '?'} → ${nach ?? '?'}`);
      if (text(d.begruendung)) details.push(d.begruendung as string);
      return { titel, details };
    }
    case 'betriebsstatus_geaendert': {
      const alt = aus(BETRIEBSSTATUS, d.alt);
      const neu = aus(BETRIEBSSTATUS, d.neu);
      if (neu) details.push(alt ? `${BETRIEBSSTATUS_LABEL[alt]} → ${BETRIEBSSTATUS_LABEL[neu]}` : BETRIEBSSTATUS_LABEL[neu]);
      if (text(d.begruendung)) details.push(d.begruendung as string);
      return { titel, details };
    }
    case 'anlass_erfasst': {
      const art = aus(ANLASS_ARTEN, d.art);
      if (art) details.push(ANLASS_ART_LABEL[art]);
      if (text(d.datum)) details.push(`am ${datum(d.datum as string)}`);
      return { titel, details };
    }
    case 'anlass_aufgehoben':
      if (text(d.grund)) details.push(`Grund: ${d.grund as string}`);
      return { titel, details };
    case 'mangel_erfasst': {
      const s = aus(MANGEL_SCHWEREN, d.schwere);
      if (s) details.push(MANGEL_SCHWERE_LABEL[s]);
      if (text(d.termin)) details.push(`Termin ${datum(d.termin as string)}`);
      return { titel, details };
    }
    case 'mangel_kenntnis': {
      if (text(d.verantwortlichName)) details.push(`verantwortlich: ${d.verantwortlichName as string}`);
      const alt = text(d.terminAlt);
      const neu = text(d.terminNeu);
      if (neu) details.push(alt && alt !== neu ? `Termin ${datum(alt)} → ${datum(neu)}` : `Termin ${datum(neu)}`);
      return { titel, details };
    }
    case 'mangel_behoben':
      if (text(d.behobenAm)) details.push(`am ${datum(d.behobenAm as string)}`);
      if (text(d.behobenDurch)) details.push(`durch ${d.behobenDurch as string}`);
      return { titel, details };
    case 'bereich_gespeichert': {
      if (text(d.name)) details.push(d.name as string);
      const ort = aus(EINSATZORTE, d.einsatzort);
      const ortAlt = aus(EINSATZORTE, d.einsatzortAlt);
      if (ort) details.push(ortAlt && ortAlt !== ort ? `${EINSATZORT_LABEL[ortAlt]} → ${EINSATZORT_LABEL[ort]}` : EINSATZORT_LABEL[ort]);
      return { titel, details };
    }
    case 'mitglied_gespeichert': {
      if (text(d.name)) details.push(d.name as string);
      const rolle = aus(ROLLEN, d.rolle);
      if (rolle) details.push(ROLLE_LABEL[rolle]);
      if (d.aktiv === false) details.push('deaktiviert');
      if (d.eingeladen === true) details.push('eingeladen');
      return { titel, details };
    }
    // I3M (F-28): bewusst ohne Person (F-27), nur ob zugeordnet oder gelöst.
    case 'zuordnung_geaendert':
      return { titel: d.zugeordnet === false ? 'Zuordnung gelöst' : titel, details };
    case 'etikett_erneuert':
      return { titel, details: [...details, 'alter Aufkleber ungültig'] };
  }
}

/** Punktfarbe (§6.14): Statusfarbe, wenn das Ereignis einen Status hat, sonst steel-400. */
function punktFarbe(e: Ereignis): string {
  switch (e.typ) {
    case 'nachweis_erfasst': {
      const erg = aus(PRUEF_ERGEBNISSE, e.daten.ergebnis);
      if (erg === 'ohne_maengel') return 'var(--color-moss)';
      if (erg === 'maengel_weiterbetrieb') return 'var(--color-ochre-600)';
      if (erg === 'nicht_bestanden') return 'var(--color-brick)';
      return 'var(--color-steel-400)';
    }
    case 'mangel_erfasst':
    case 'anlass_erfasst':
      return 'var(--color-brick)';
    case 'mangel_behoben':
      return 'var(--color-moss)';
    default:
      return 'var(--color-steel-400)';
  }
}

const SICHTBAR = 10;

function Eintrag({ e, pruefartNamen }: { e: Ereignis; pruefartNamen: Map<Id, string> }) {
  const b = beschreibung(e, pruefartNamen);
  return (
    <li className="relative grid gap-x-4 gap-y-0.5 py-2.5 pl-6 text-sm sm:grid-cols-[9.5rem_1fr] sm:pl-0">
      <time dateTime={e.zeitpunkt} className="font-mono text-sm tabular-nums text-steel sm:pt-px sm:text-right">
        {zeitpunkt(e.zeitpunkt)}
      </time>
      <span
        aria-hidden="true"
        className="absolute left-[2.5px] top-[1.0625rem] size-2 rounded-full ring-2 ring-white sm:left-[calc(9.5rem+0.5rem-3.5px)]"
        style={{ background: punktFarbe(e) }}
      />
      <div className="min-w-0 sm:pl-4">
        <p>
          <span className="font-medium">{b.titel}</span>
          <span className="text-steel"> · {e.akteurName}</span>
        </p>
        {b.details.length > 0 && <p className="text-xs text-steel [overflow-wrap:anywhere]">{b.details.join(' · ')}</p>}
      </div>
    </li>
  );
}

/** Verlauf (§6.14): senkrechte Linie, Punkt je Ereignis, links Datum, rechts Ereignis und Person. Neueste oben. */
export function VerlaufListe({ verlauf, pruefartNamen }: { verlauf: Ereignis[]; pruefartNamen: Map<Id, string> }) {
  if (verlauf.length === 0) return <Leerzustand art="leer" ebene="h3" titel="Noch keine Ereignisse." />;
  const linie =
    'relative before:absolute before:inset-y-0 before:left-[6px] before:w-px before:bg-steel-200 before:content-[""] sm:before:left-[calc(9.5rem+0.5rem)]';
  const vorne = verlauf.slice(0, SICHTBAR);
  const aeltere = verlauf.slice(SICHTBAR);
  return (
    <div className="karte px-4 py-2">
      <ol className={linie}>
        {vorne.map((e) => (
          <Eintrag key={e.id} e={e} pruefartNamen={pruefartNamen} />
        ))}
      </ol>
      {aeltere.length > 0 && (
        <details className="group">
          <summary className="btn btn-still my-1 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Ältere anzeigen ({aeltere.length})</span>
            <span className="hidden group-open:inline">Ältere ausblenden</span>
          </summary>
          <ol className={linie} start={SICHTBAR + 1}>
            {aeltere.map((e) => (
              <Eintrag key={e.id} e={e} pruefartNamen={pruefartNamen} />
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
