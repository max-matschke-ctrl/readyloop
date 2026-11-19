// Vertrag §3.4 – Regel-Engine (F-1 bis F-4). Rein und deterministisch.
import type {
  Bereich,
  Einsatzort,
  FristEntwurf,
  FristFestlegungEingabe,
  FristFestlegungErgebnis,
  FristVorschlag,
  Geraet,
  GeraetPruefart,
  KatalogEintrag,
} from './types';

/** F-1: Override am Gerät, sonst Einsatzort des Bereichs. */
export function wirksamerEinsatzort(
  geraet: Pick<Geraet, 'einsatzort'>,
  bereich: Pick<Bereich, 'einsatzort'>,
): Einsatzort {
  return geraet.einsatzort ?? bereich.einsatzort;
}

function intervallSortwert(e: KatalogEintrag): number {
  return e.intervallMonate ?? Number.POSITIVE_INFINITY;
}

function kuerzestes(eintraege: readonly KatalogEintrag[]): KatalogEintrag | null {
  if (eintraege.length === 0) return null;
  return [...eintraege].sort((a, b) => intervallSortwert(a) - intervallSortwert(b))[0];
}

/** Je Einsatzort-Gruppe nur Einträge der höchsten Version. */
function hoechsteVersion(eintraege: readonly KatalogEintrag[]): KatalogEintrag[] {
  if (eintraege.length === 0) return [];
  const max = Math.max(...eintraege.map((e) => e.version));
  return eintraege.filter((e) => e.version === max);
}

/**
 * F-2: Einträge gleichen Schlüssels mit gegebenem Status; je (schluessel, einsatzort) höchste Version;
 * exakter Einsatzort schlägt einsatzort = null; bei mehreren das kürzeste Intervall.
 * 'zurueckgezogen' wird nie gewählt.
 */
export function waehleKatalogEintrag(
  katalog: readonly KatalogEintrag[],
  schluessel: string,
  einsatzort: Einsatzort,
  status: 'freigegeben' | 'entwurf',
): KatalogEintrag | null {
  const kandidaten = katalog.filter((e) => e.schluessel === schluessel && e.freigabestatus === status);
  const exakt = hoechsteVersion(kandidaten.filter((e) => e.einsatzort === einsatzort));
  if (exakt.length > 0) return kuerzestes(exakt);
  const allgemein = hoechsteVersion(kandidaten.filter((e) => e.einsatzort === null));
  return kuerzestes(allgemein);
}

/** F-3: Vorschlag aus Herstellerfrist und freigegebenem Katalog. Entwürfe nur zur Orientierung. */
export function ermittleFristVorschlag(eingabe: {
  pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate' | 'herstellerfristQuelle'>;
  einsatzort: Einsatzort;
  katalog: readonly KatalogEintrag[];
}): FristVorschlag {
  const { pruefart, einsatzort, katalog } = eingabe;
  const schluessel = pruefart.katalogSchluessel;
  const frei = schluessel ? waehleKatalogEintrag(katalog, schluessel, einsatzort, 'freigegeben') : null;
  const hersteller = pruefart.herstellerfristMonate;

  if (
    hersteller !== null &&
    (frei === null || frei.intervallMonate === null || hersteller < frei.intervallMonate)
  ) {
    return {
      art: 'hersteller',
      monate: hersteller,
      stufe: 'C',
      fundstelle: pruefart.herstellerfristQuelle?.trim() || 'Herstellerangabe',
      verdraengt: frei,
    };
  }

  if (frei !== null && frei.intervallMonate !== null) {
    return {
      art: 'katalog',
      monate: frei.intervallMonate,
      stufe: frei.stufe,
      fundstelle: frei.fundstelle,
      quelleUrl: frei.quelleUrl,
      eintrag: frei,
    };
  }

  if (frei !== null) return { art: 'gbu', grund: 'ohne_intervall', orientierung: frei };

  const entwurf = schluessel ? waehleKatalogEintrag(katalog, schluessel, einsatzort, 'entwurf') : null;
  if (entwurf !== null) return { art: 'gbu', grund: 'nur_entwurf', orientierung: entwurf };

  return { art: 'gbu', grund: 'kein_eintrag', orientierung: null };
}

/** F-4: Freigabe als Vorschlag-Übernahme oder GBU-Frist. Liefert Snapshot ohne Freigabe-Metadaten. */
export function legeFristFest(
  eingabe: FristFestlegungEingabe,
  kontext: {
    vorschlag: FristVorschlag;
    pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate'>;
    einsatzort: Einsatzort;
    katalog: readonly KatalogEintrag[];
  },
): FristFestlegungErgebnis {
  const { vorschlag, pruefart, einsatzort, katalog } = kontext;

  if (eingabe.modus === 'vorschlag') {
    if (vorschlag.art === 'katalog') {
      return {
        ok: true,
        frist: {
          monate: vorschlag.monate,
          quelle: 'katalog',
          stufe: vorschlag.stufe,
          fundstelle: vorschlag.fundstelle,
          quelleUrl: vorschlag.quelleUrl,
          katalogEintragId: vorschlag.eintrag.id,
          katalogVersion: vorschlag.eintrag.version,
          begruendung: null,
        },
      };
    }
    if (vorschlag.art === 'hersteller') {
      return {
        ok: true,
        frist: {
          monate: vorschlag.monate,
          quelle: 'hersteller',
          stufe: 'C',
          fundstelle: vorschlag.fundstelle,
          quelleUrl: null,
          katalogEintragId: null,
          katalogVersion: null,
          begruendung: null,
        },
      };
    }
    return { ok: false, fehler: 'Kein übernehmbarer Vorschlag – Frist über GBU festlegen.' };
  }

  const monate = eingabe.monate;
  const fundstelle = eingabe.fundstelle.trim();
  const begruendung = eingabe.begruendung.trim();
  if (!Number.isInteger(monate) || monate < 1 || monate > 120) {
    return { ok: false, fehler: 'Frist muss eine ganze Zahl zwischen 1 und 120 Monaten sein.' };
  }
  if (fundstelle.length < 3) return { ok: false, fehler: 'Fundstelle der GBU fehlt (mindestens 3 Zeichen).' };
  if (begruendung.length < 10) return { ok: false, fehler: 'Begründung fehlt (mindestens 10 Zeichen).' };

  const schluessel = pruefart.katalogSchluessel;
  const frei = schluessel ? waehleKatalogEintrag(katalog, schluessel, einsatzort, 'freigegeben') : null;
  if (frei !== null && frei.stufe === 'A' && frei.intervallMonate !== null && monate > frei.intervallMonate) {
    return {
      ok: false,
      fehler: `GBU-Frist ${monate} Monate überschreitet die Höchstfrist von ${frei.intervallMonate} Monaten (Stufe A, ${frei.fundstelle}).`,
    };
  }
  if (pruefart.herstellerfristMonate !== null && monate > pruefart.herstellerfristMonate) {
    return {
      ok: false,
      fehler: `GBU-Frist ${monate} Monate überschreitet die Herstellerfrist von ${pruefart.herstellerfristMonate} Monaten.`,
    };
  }

  const entwurf = schluessel ? waehleKatalogEintrag(katalog, schluessel, einsatzort, 'entwurf') : null;
  const orientierung = frei ?? entwurf;
  const frist: FristEntwurf = {
    monate,
    quelle: 'gbu',
    stufe: 'C',
    fundstelle,
    quelleUrl: null,
    katalogEintragId: orientierung?.id ?? null,
    katalogVersion: orientierung?.version ?? null,
    begruendung,
  };
  return { ok: true, frist };
}

/** F-13: Richtung einer Neufestlegung gegenüber der bisherigen Frist. */
export function fristRichtung(altMonate: number | null, neuMonate: number): 'erstmalig' | 'kuerzer' | 'laenger' | 'gleich' {
  if (altMonate === null) return 'erstmalig';
  if (neuMonate < altMonate) return 'kuerzer';
  if (neuMonate > altMonate) return 'laenger';
  return 'gleich';
}
