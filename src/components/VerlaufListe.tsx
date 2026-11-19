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
  }
}

export function VerlaufListe({ verlauf, pruefartNamen }: { verlauf: Ereignis[]; pruefartNamen: Map<Id, string> }) {
  if (verlauf.length === 0) return <p className="text-sm text-steel">Keine Ereignisse.</p>;
  return (
    <ol className="karte divide-y divide-steel/15">
      {verlauf.map((e) => {
        const b = beschreibung(e, pruefartNamen);
        return (
          <li key={e.id} className="grid gap-1 px-4 py-2 text-sm sm:grid-cols-[10rem_1fr]">
            <time dateTime={e.zeitpunkt} className="font-mono text-xs text-steel sm:pt-0.5">
              {zeitpunkt(e.zeitpunkt)}
            </time>
            <div>
              <p>
                <span className="font-medium">{b.titel}</span>
                <span className="text-steel"> · {e.akteurName}</span>
              </p>
              {b.details.length > 0 && <p className="text-xs text-steel">{b.details.join(' · ')}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
